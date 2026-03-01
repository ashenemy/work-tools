import { BaseFileTypeError } from './base-file-type.error';

export class ExcelFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'excel');
    }
}
