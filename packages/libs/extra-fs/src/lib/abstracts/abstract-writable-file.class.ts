import { AbstractTextFile } from './abstract-text-file.class';
import type { JsonLike } from '@work-tools/ts';
import type { ExcelSheet } from '../../@types';
import { writeFile } from 'fs-extra';

export abstract class AbstractWritableFile<T1 extends string | JsonLike | ExcelSheet, T2 extends string | JsonLike | ExcelSheet = T1> extends AbstractTextFile<T1> {
    public async write(content: T2): Promise<void> {
        await writeFile(this.absPath, await this._stringify(content));
    }

    protected abstract _stringify(data: T2): Promise<string>;
}
