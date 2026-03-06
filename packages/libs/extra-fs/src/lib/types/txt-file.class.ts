import { Dirent } from 'node:fs';
import { AbstractWritableFile } from '../abstracts/abstract-writable-file.class';
import { TxtFileTypeError } from '../errors/file-type/txt-file-type.error';
import { File } from '../primitives/file.class';

export class TxtFile extends AbstractWritableFile<string> {
    public static readonly EXTENSIONS: Array<string> = ['txt'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!TxtFile.isTxtFile(filePath, createNewFile)) {
            throw new TxtFileTypeError(this.name);
        }
    }

    public static isTxtFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return TxtFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _parse(content: string): Promise<string> {
        return Promise.resolve(content);
    }

    protected override _stringify(content: string): Promise<string> {
        return Promise.resolve(content);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, TxtFile.EXTENSIONS);
    }
}
