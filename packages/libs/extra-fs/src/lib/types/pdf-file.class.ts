import { Dirent } from 'node:fs';
import { DocFile } from '../primitives/doc-file.class';
import { PdfFileTypeError } from '../errors/file-type/pdf-file-type.error';
import { File } from '../primitives/file.class';

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

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, PDFFile.EXTENSIONS);
    }
}
