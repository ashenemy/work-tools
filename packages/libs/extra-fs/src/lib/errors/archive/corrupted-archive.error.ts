import { BaseArchiveError } from './base-archive.error';

export class CorruptedArchiveError extends BaseArchiveError {
    constructor(message: string) {
        super(`Corrupted archive: ${message}`);
    }
}
