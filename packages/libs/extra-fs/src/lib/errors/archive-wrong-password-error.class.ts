import { ArchiveError } from './archive-error.class';

export class ArchiveWrongPasswordError extends ArchiveError {
    constructor(archivePath: string, details?: string, cause?: unknown) {
        super('Wrong archive password', archivePath, details, cause);
        this.name = 'ArchiveWrongPasswordError';
    }
}
