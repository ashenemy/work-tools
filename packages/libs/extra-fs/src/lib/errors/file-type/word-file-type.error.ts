import { BaseFileTypeError } from './base-file-type.error';

export class WordFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'word');
    }
}
