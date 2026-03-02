import { Dirent } from 'node:fs';
import { DocFile } from '../primitives/doc-file.class';
import { PdfFileTypeError } from '../errors/file-type/pdf-file-type.error';
import { File } from '../primitives/file.class';

export class PDFFile extends DocFile {
    public static readonly EXTENSIONS: Array<string> = ['pdf'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!PDFFile.isPdfFile(filePath, createNewFile)) {
            throw new PdfFileTypeError(this.name);
        }
    }

    public static isPdfFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return PDFFile.EXTENSIONS.includes(_file.ext);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, PDFFile.EXTENSIONS);
    }
}
