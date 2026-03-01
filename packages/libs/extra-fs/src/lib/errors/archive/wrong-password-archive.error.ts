import { BaseArchiveError } from './base-archive.error';

export class WrongPasswordArchiveError extends BaseArchiveError {
    constructor() {
        super('Wrong password');
    }
}
