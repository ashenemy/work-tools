import { BaseArchiveError } from './base-archive.error';

export class UnknowArchiveError extends BaseArchiveError {
    constructor() {
        super('Unknow error archive');
    }
}
