import { BaseFileTypeError } from './base-file-type.error';

export class AudioFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'audio');
    }
}
