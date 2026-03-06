export class TimeoutError extends Error {
    constructor(message = 'timeout') {
        super(message);
        this.name = 'TimeoutError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}
