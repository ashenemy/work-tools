import { BaseFileTypeError } from './base-file-type.error';

export class VideoFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'video');
    }
}
