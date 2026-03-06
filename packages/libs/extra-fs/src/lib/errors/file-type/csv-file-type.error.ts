import { BaseFileTypeError } from './base-file-type.error';

export class CsvFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'csv');
    }
}
