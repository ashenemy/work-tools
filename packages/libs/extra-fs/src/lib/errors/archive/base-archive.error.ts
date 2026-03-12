export class BaseArchiveError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BaseArchiveError';
    }
}
