import { DocFile, File } from '../primitives';
import { Dirent } from 'node:fs';
import { PdfFileTypeError } from '../errors';

export class PDFFile extends DocFile {
    public static readonly EXTENSIONS: Array<string> = ['pdf'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!PDFFile.isPdfFile(filePath)) {
            throw new PdfFileTypeError(this.name);
        }
    }

    public static isPdfFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return PDFFile.EXTENSIONS.includes(_file.ext);
    }
}
