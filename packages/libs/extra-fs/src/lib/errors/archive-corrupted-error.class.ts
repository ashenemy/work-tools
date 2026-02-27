import { ArchiveError } from './archive-error.class';

export class ArchiveCorruptedError extends ArchiveError {
    constructor(archivePath: string, details?: string, cause?: unknown) {
        super('Archive is corrupted or cannot be processed', archivePath, details, cause);
        this.name = 'ArchiveCorruptedError';
    }
}
