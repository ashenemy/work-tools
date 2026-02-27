import { ArchiveError } from './archive-error.class';

export class ArchiveMissingVolumeError extends ArchiveError {
    constructor(archivePath: string, details?: string, cause?: unknown) {
        super('Missing archive volume(s) for multi-part archive', archivePath, details, cause);
        this.name = 'ArchiveMissingVolumeError';
    }
}
