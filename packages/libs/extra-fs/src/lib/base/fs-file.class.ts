import { AbstractBaseFsItem } from './abstract-base-fs-item.class';
import { appendFile, readFile, writeFile, truncate } from 'fs-extra';
import mime from 'mime-types';
import { Optional } from '@work-tools/ts';

export class FsFile extends AbstractBaseFsItem {
    public async read(): Promise<Buffer> {
        return readFile(this._path);
    }

    public async write(data: Buffer | string): Promise<void> {
        await writeFile(this._path, data);
    }

    public async append(data: Buffer | string): Promise<void> {
        await appendFile(this._path, data);
    }

    public async truncate(size = 0): Promise<void> {
        await truncate(this._path, size);
    }

    public getMimeType(): Optional<string> {
        return mime.lookup(this._path) || undefined;
    }
}