import { TelegramClient } from 'telegram';
import { ArchiveFile, BaseLogMessage } from '@work-tools/log-message';
import { DownloadRunnerStep } from '../steps/download-step.class';
import { ExtractRunnerStep } from '../steps/extract-step.class';
import { CleanRunnerStep } from '../steps/clean-step.class';
import { ProgressBarRenderer } from './progress-bar-renderer.class';
import logSymbols from 'log-symbols';
import boxen from 'boxen';
import logUpdate from 'log-update';


export class TaskRunner {
    constructor(
        private readonly logMessage: BaseLogMessage,
        private readonly client: TelegramClient,
    ) {}

    public async run(): Promise<void> {
        console.log(' ');
        console.log(boxen(`🚀 Начинаем обработку: ${this.logMessage.logFile?.fileName || 'файл'}`, { backgroundColor: 'cyan', padding: 1 }));
        try {
            // 2. Download
            logUpdate(`${logSymbols.info} Download archive`);
            const downloader = new DownloadRunnerStep(this.client);
            ProgressBarRenderer.$.startDownloadProgress(downloader.downloadProgress);
            await downloader.run(this.logMessage);
            logUpdate.persist(`${logSymbols.success} Download archive`);

            // 3. Extract
            logUpdate(`${logSymbols.info} Extract archive`);
            const newFolder = await ExtractRunnerStep.run(this.logMessage.logFile!.localFile as ArchiveFile, this.logMessage.logFile?.filePassword);
            logUpdate.persist(`${logSymbols.success} Extract archive, ${newFolder}`);

            // 4. Clean

            logUpdate(`${logSymbols.info} Clean temporary files`);
            await CleanRunnerStep.run(this.logMessage);
            logUpdate(`${logSymbols.success} Clean temporary files`);
        } catch (e) {
            console.error(`❌ Ошибка при обработке таска:`, e);
        }
    }
}
