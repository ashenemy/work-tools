import { Dirent } from 'node:fs';
import { DocFile } from '../primitives/doc-file.class';
import { WordFileTypeError } from '../errors/file-type/word-file-type.error';
import { File } from '../primitives/file.class';

export class WordFile extends DocFile {
    public static readonly EXTENSIONS: Array<string> = ['doc', 'docx'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!WordFile.isWordFile(filePath, createNewFile)) {
            throw new WordFileTypeError(this.name);
        }
    }

    public static isWordFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return WordFile.EXTENSIONS.includes(_file.ext);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, WordFile.EXTENSIONS);
    }
}
