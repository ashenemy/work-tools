import { BaseFileTypeError } from './base-file-type.error';

export class TxtFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'txt');
    }
}
