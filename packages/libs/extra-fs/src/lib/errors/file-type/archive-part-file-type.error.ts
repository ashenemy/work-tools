import { BaseFileTypeError } from './base-file-type.error';

export class ArchivePartFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'archive part');
    }
}
