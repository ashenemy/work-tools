import { BaseFileTypeError } from './base-file-type.error';

export class JsonFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'json');
    }
}
