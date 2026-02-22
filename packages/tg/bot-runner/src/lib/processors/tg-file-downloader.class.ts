import { ArchiveFile, BaseLogMessage } from '@work-tools/log-message';
import { TelegramClient } from 'telegram';
import { open } from 'node:fs/promises';
import { Subject } from 'rxjs';
import { FileDownloadProgress } from '../../@types';
import { isUndefined } from '@work-tools/utils';
import bigInt = require('big-integer');

export class TgFileDownloader {
    public static CHUNK_SIZE: number = 512 * 1024;
    public static MAX_ATTEMPT: number = 5;

    constructor(
        private readonly logMessage: BaseLogMessage,
        private readonly client: TelegramClient,
    ) {}

    public get archiveFile(): ArchiveFile {
        if (isUndefined(this.logMessage.logFile)) {
            throw new Error(`Message not have file`);
        }

        return this.logMessage.logFile.localFile as ArchiveFile;
    }

    private async _download(progress$: Subject<FileDownloadProgress>): Promise<void> {
        let offset: bigInt.BigInteger = bigInt(0);

        if (this.archiveFile.exists) {
            offset = bigInt(this.archiveFile.size);
        }

        const fileHandle = await open(this.archiveFile.fullPath, offset.toJSNumber() > 0 ? 'a' : 'w');
        const writeStream = fileHandle.createWriteStream({ start: Number(offset) });

        let downloaded = offset.toJSNumber();

        try {
            for await (const chunk of this.client.iterDownload({
                file: this.logMessage.logFile!.media,
                offset,
                limit: undefined,
                chunkSize: TgFileDownloader.CHUNK_SIZE,
                requestSize: TgFileDownloader.CHUNK_SIZE,
            })) {
                await new Promise<void>((resolve, reject) => {
                    writeStream.write(chunk, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                downloaded += chunk.length;

                progress$.next({
                    downloaded,
                    total: this.logMessage.document?.size.toJSNumber() ?? 0,
                });
            }
        } catch (err) {
            progress$.error(err);
        } finally {
            writeStream.end();
            await fileHandle.close();

            progress$.complete();
        }
    }

    public async run(progress$: Subject<FileDownloadProgress>): Promise<void> {
        for (let attempt = 1; attempt <= TgFileDownloader.MAX_ATTEMPT; attempt++) {
            try {
                await this._download(progress$);
                return;
            } catch (err: any) {
                if (attempt === TgFileDownloader.MAX_ATTEMPT) throw err;
                await new Promise((r) => setTimeout(r, 10000));
            }
        }
    }
}
