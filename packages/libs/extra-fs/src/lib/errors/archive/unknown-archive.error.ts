import { BaseArchiveError } from './base-archive.error';

export class UnknownArchiveError extends BaseArchiveError {
    constructor() {
        super('Unknow error archive');
    }
}
