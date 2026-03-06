import { AbstractTextFile } from './abstract-text-file.class';
import type { JsonLike } from '@work-tools/ts';
import type { ExcelSheet } from '../../@types';
import { createFile, ensureDir, writeFile } from 'fs-extra';
import { dirname } from 'path';

export abstract class AbstractWritableFile<T1 extends string | JsonLike | ExcelSheet, T2 extends string | JsonLike | ExcelSheet = T1> extends AbstractTextFile<T1> {
    public async write(content: T2): Promise<void> {
        await ensureDir(dirname(this.absPath));

        await writeFile(this.absPath, await this._stringify(content));
    }

    public override async create(): Promise<void> {
        await createFile(this.absPath);
    }

    protected abstract _stringify(data: T2): Promise<string>;
}
