import { Subject } from 'rxjs';
import { ProgressEvent } from '../../@types';
import { TgMessageFile } from './tg-message-file.class';
import { AbstractBaseFsItem, FileFactory, FsFolder } from '@work-tools/extra-fs';
import { isType } from '@work-tools/utils';
import { createWriteStream, WriteStream } from 'node:fs';
import { MtpClient } from '../connections/mtp-client.class';
import bigInt from 'big-integer';
import { finished } from 'node:stream/promises';

export class TgMessageFileDownloader {
    public static REQUEST_SIZE = 1024 * 1024;
    public static MAX_ATTEMPTS = 10;

    private readonly _progress: Subject<ProgressEvent> = new Subject();

    constructor(private readonly _file: TgMessageFile) {}

    public async downloadMedia<T extends AbstractBaseFsItem>(): Promise<T> {
        const file: AbstractBaseFsItem = await FileFactory.from(this._file.saveToPath);

        if (isType(file, FsFolder)) {
            throw new Error('File is a folder');
        }

        let attempt = 0;

        while (true) {
            const offset = await file.size();

            if (this._file.size <= offset) {
                this._progress.complete();
                return file as T;
            }

            const flags = offset === 0 ? 'w' : 'r+';
            const ws = createWriteStream(this._file.saveToPath, { flags, start: offset });

            try {
                for await (const chunk of MtpClient.tgClient.iterDownload({
                    file: this._file.media,
                    offset: bigInt(offset),
                    requestSize: TgMessageFileDownloader.REQUEST_SIZE,
                })) {
                    await this._writeChunk(ws, chunk);
                    const success = offset + ws.bytesWritten;
                    this._progress.next({
                        total: this._file.size,
                        success,
                    });
                }

                ws.end();
                await finished(ws);

                return file as T;
            } catch (e) {
                ws.destroy();

                attempt++;
                if (attempt > TgMessageFileDownloader.MAX_ATTEMPTS) {
                    this._progress.error(e);
                    throw e;
                }
            }
        }
    }

    private async  _writeChunk(ws: WriteStream, chunk: Buffer): Promise<void> {
        if (!ws.write(chunk)) {
            await new Promise<void>((r) => ws.once("drain", () => r()));
        }
    }
}