import { createWriteStream, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { finished } from 'node:stream/promises';
import { File } from '@work-tools/extra-fs';
import { isUndefined } from '@work-tools/utils';
import bigInt from 'big-integer';
import { type Observable, Subject } from 'rxjs';
import type { MTPFileDownloadProgress } from '../../../@types';
import type { MtpClient } from '../mtp-client.class';
import { TG_FILE_DOWNLOAD_OPTIONS } from '../mtp-client.constants';
import type { MtpMessage } from '../types/mtp-message.class';
import type { MtpMessageFile } from '../types/mtp-message-file.class';

export class MtpClientFileDownloader {
    private _attempt = 0;
    private _progress$: Subject<MTPFileDownloadProgress> = new Subject<MTPFileDownloadProgress>();
    private readonly _downloadableFile: MtpMessageFile;
    private readonly _saveFile: File;
    constructor(
        private readonly _client: MtpClient,
        private readonly _message: MtpMessage,
        path: string,
    ) {
        if (isUndefined(this._message.downloadableFile)) {
            throw new Error('Message is not downloadable');
        }

        this._downloadableFile = this._message.downloadableFile;
        this._saveFile = new File(join(path, this._downloadableFile.fileName));
    }

    public get progress$(): Observable<MTPFileDownloadProgress> {
        return this._progress$.asObservable();
    }

    public async download(): Promise<File> {
        this._attempt = 0;
        return await this._downloadAttempt();
    }

    private async _downloadAttempt(): Promise<File> {
        const offset = (await this._saveFile.size()) ?? 0;

        if (this._downloadableFile.size <= offset) {
            this._progress$.complete();
            return this._saveFile;
        }

        const flags = offset === 0 ? 'w' : 'r+';
        const ws = createWriteStream(this._saveFile.absPath, { flags, start: offset });

        try {
            for await (const chunk of this._client.client.iterDownload({
                file: this._downloadableFile.downloadable,
                offset: bigInt(offset),
                requestSize: TG_FILE_DOWNLOAD_OPTIONS.requestSize,
            })) {
                await this._writeChunk(ws, chunk);
                const success = offset + ws.bytesWritten;
                this._progress$.next({ downloaded: success, total: this._downloadableFile.size });
            }

            ws.end();
            await finished(ws);
            this._progress$.complete();

            return this._saveFile;
        } catch (e) {
            ws.destroy();
            this._attempt++;

            if (this._attempt > TG_FILE_DOWNLOAD_OPTIONS.maxAttempts) {
                const maxAttemptsError = new Error('Max download attempts reached');

                this._progress$.error(maxAttemptsError);
                throw maxAttemptsError;
            } else {
                return await this._downloadAttempt();
            }
        }
    }

    private async _writeChunk(ws: WriteStream, chunk: Buffer): Promise<void> {
        if (!ws.write(chunk)) {
            await new Promise<void>((r) => ws.once('drain', () => r()));
        }
    }
}
