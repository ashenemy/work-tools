import { Dirent } from 'node:fs';
import { AbstractWritableFile } from '../abstracts/abstract-writable-file.class';
import { TxtFileTypeError } from '../errors/file-type/txt-file-type.error';
import { File } from '../primitives/file.class';

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
