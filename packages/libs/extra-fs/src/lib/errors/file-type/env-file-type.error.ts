import { BaseFileTypeError } from './base-file-type.error';

export class EnvFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'env');
    }
}
