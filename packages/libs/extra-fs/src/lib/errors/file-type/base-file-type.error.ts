export class BaseFileTypeError extends Error {
    constructor(fileName: string, fileType: string) {
        super(`File ${fileName} is not a ${fileType}`);
    }
}
