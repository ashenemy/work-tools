import { BaseFileTypeError } from './base-file-type.error';

export class FolderFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'folder');
    }
}
