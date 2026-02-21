import { TelegramClient } from 'telegram';
import { BaseLogMessage } from '@work-tools/log-message';
import { ShareRunnerStep } from '../steps/share-step.class';
import { SaveRunnerStep } from '../steps/save-step.class';
import { DownloadRunnerStep } from '../steps/download-step.class';
import { ExtractRunnerStep } from '../steps/extract-step.class';
import { CleanRunnerStep } from '../steps/clean-step.class';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FileDownloadProgress, StepEvent } from '../../@types';


export class TaskRunner {
    private _currentStep$ = new BehaviorSubject<StepEvent>({
        step: undefined,
        stepIndex: -1,
        stepName: '',
        totalSteps: 5,
        taskProgress: 0,
        progress: null, // теперь всегда процент 0-100 (или null)
        name: 'Unknown task',
    });

    private downloadProgressSub?: Subscription;

    constructor(
        private readonly logMessage: BaseLogMessage,
        private readonly _client: TelegramClient,
    ) { }

    public get currentStep$() {
        return this._currentStep$.asObservable();
    }

    public async run(): Promise<string | undefined> {
        const steps = [
            { key: 'share' as const, name: 'Share message' },
            { key: 'save' as const, name: 'Save cloned message' },
            { key: 'download' as const, name: 'Download archive' },
            { key: 'extract' as const, name: 'Extract archive' },
            { key: 'clean' as const, name: 'Clean temporary files' },
        ];

        let sharedMessage, clonedMessage, archive, folderName: string | undefined;

        try {
            for (let i = 0; i < steps.length; i++) {
                const { key, name } = steps[i];

                this._currentStep$.next({
                    step: key,
                    stepIndex: i,
                    stepName: name,
                    totalSteps: steps.length,
                    taskProgress: Math.floor((i / steps.length) * 100),
                    progress: null,
                    name: String(this.logMessage.message.id) || 'Task',
                });

                if (key === 'share') {
                    sharedMessage = await ShareRunnerStep.run(this._client, this.logMessage);
                } else if (key === 'save' && sharedMessage) {
                    clonedMessage = await SaveRunnerStep.run(sharedMessage);
                } else if (key === 'download' && clonedMessage) {
                    const downloader = new DownloadRunnerStep(this._client);

                    // ←←← ЖИВОЙ ПРОГРЕСС С НОВЫМ ТИПОМ
                    this.downloadProgressSub = downloader.downloadProgress.subscribe((fileProgress: FileDownloadProgress) => {
                        const percent = fileProgress.total > 0 ? Math.floor((fileProgress.downloaded / fileProgress.total) * 100) : 0;

                        this._currentStep$.next({
                            ...this._currentStep$.value,
                            progress: percent,
                            taskProgress: Math.floor(((i + percent / 100) / steps.length) * 100),
                        });
                    });

                    archive = await downloader.run(clonedMessage);
                    this.downloadProgressSub?.unsubscribe();
                } else if (key === 'extract' && archive) {
                    folderName = await ExtractRunnerStep.run(archive, clonedMessage?.logFile?.filePassword);
                } else if (key === 'clean' && clonedMessage) {
                    await CleanRunnerStep.run(clonedMessage);
                }
            }

            this._currentStep$.complete();
            return folderName;
        } catch (e) {
            this._currentStep$.error(e);
            await clonedMessage?.createReport(e as Error);
            return undefined;
        } finally {
            this.downloadProgressSub?.unsubscribe();
        }
    }
}
