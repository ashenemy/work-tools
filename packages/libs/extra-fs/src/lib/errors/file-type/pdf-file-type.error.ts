import { BaseFileTypeError } from './base-file-type.error';

export class PdfFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'pdf');
    }
}
