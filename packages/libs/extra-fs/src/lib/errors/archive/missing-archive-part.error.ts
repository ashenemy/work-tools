import { BaseArchiveError } from './base-archive.error';

export class MissingArchivePartError extends BaseArchiveError {
    constructor(missingParts: string) {
        super(`Missing archive part ${missingParts}`);
        this.name = 'MissingArchivePartError';
    }
}
