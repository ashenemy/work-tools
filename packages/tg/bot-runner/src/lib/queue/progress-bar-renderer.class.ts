import { FileDownloadProgress } from '../../@types';
import { Subject, Subscription } from 'rxjs';
import { Optional } from '@work-tools/ts';
import logUpdate from 'log-update';
import logSymbols from 'log-symbols';

export class ProgressBarRenderer {
    private static _instance: Optional<ProgressBarRenderer> = undefined;

    public static get $(): ProgressBarRenderer {
        if (!ProgressBarRenderer._instance) {
            ProgressBarRenderer._instance = new ProgressBarRenderer();
        }
        return ProgressBarRenderer._instance;
    }

    private downloadSub: Subscription | null = null;

    private constructor() {}

    public startDownloadProgress(progress$: Subject<FileDownloadProgress>): void {
        this.stopDownloadProgress();

        this.downloadSub = progress$.subscribe({
            next: (p: FileDownloadProgress) => {
                if (!p.total) return;

                const percent = Math.floor((p.downloaded / p.total) * 100);

                const line = `${logSymbols.warning} Скачивание: ${percent.toString().padStart(3)}%   (${this.formatBytes(p.downloaded)} / ${this.formatBytes(p.total)})`;
                logUpdate(line);
            },

            complete: () => {
                logUpdate.persist(`${logSymbols.success} Скачивание завершено`);
                this.stopDownloadProgress();
            },

            error: () => this.stopDownloadProgress(),
        });
    }

    private stopDownloadProgress(): void {
        this.downloadSub?.unsubscribe();
        this.downloadSub = null;
    }

    private formatBytes(bytes: number): string {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    public stop(): void {
        this.stopDownloadProgress();
    }
}
