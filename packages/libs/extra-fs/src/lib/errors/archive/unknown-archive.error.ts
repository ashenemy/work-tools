import { BaseArchiveError } from './base-archive.error';

export class UnknownArchiveError extends BaseArchiveError {
    constructor(message?: string) {
        super(`Unknown archive: ${message ?? ''}`);
        this.name = 'UnknownArchiveError';
    }
}
