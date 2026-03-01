import { BaseArchiveError } from './base-archive.error';

export class MissingArchivePartError extends BaseArchiveError {
    constructor(missing: string) {
        super('Missing archive part');
    }
}
