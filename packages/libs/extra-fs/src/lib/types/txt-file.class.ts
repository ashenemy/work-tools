import { AbstractWritableFile } from '../abstracts';
import { Dirent } from 'node:fs';
import { File } from '../primitives';
import { TxtFileTypeError } from '../errors';

export class TxtFile extends AbstractWritableFile<string> {
    public static readonly EXTENSIONS: Array<string> = ['txt'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!TxtFile.isTxtFile(filePath)) {
            throw new TxtFileTypeError(this.name);
        }
    }

    public static isTxtFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return TxtFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _parse(content: string): Promise<string> {
        return Promise.resolve(content);
    }

    protected override _stringify(content: string): Promise<string> {
        return Promise.resolve(content);
    }
}
