import { File } from '../primitives';
import { JsonLike } from '@work-tools/ts';
import { ExcelSheet } from '../../@types';
import { readFile } from 'fs-extra';

export abstract class AbstractTextFile<T extends string | JsonLike | ExcelSheet> extends File<string> {
    public override async read(): Promise<T> {
        return await this._parse(await readFile(this.absPath, 'utf-8'));
    }

    protected abstract _parse(content: string): Promise<T>;
}
