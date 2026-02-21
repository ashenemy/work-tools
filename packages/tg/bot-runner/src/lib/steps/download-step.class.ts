import { BehaviorSubject } from 'rxjs';
import { ArchiveFile, BaseLogMessage } from '@work-tools/log-message';
import { TelegramClient } from 'telegram';
import { FileDownloadProgress } from '../../@types';
import { TgFileDownloader } from '../processors/tg-file-downloader.class';

export class DownloadRunnerStep {

    public readonly downloadProgress = new BehaviorSubject<FileDownloadProgress>({
        downloaded: 0,
        total: 0,
    });
    constructor(private readonly client: TelegramClient) {}

    public async run(logMessage: BaseLogMessage): Promise<ArchiveFile> {
        const fileDownloader = new TgFileDownloader(logMessage, this.client);

        await fileDownloader.run(this.downloadProgress);

        return fileDownloader.archiveFile;
    }
}
