import { BaseFileTypeError } from './base-file-type.error';

export class ArchiveFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'archive');
    }
}
