export class ArchiveError extends Error {
    constructor(
        message: string,
        public readonly archivePath: string,
        public readonly details?: string,
        public override readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'ArchiveError';
    }
}
