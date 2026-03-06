import { BaseFileTypeError } from './base-file-type.error';

export class TomlFileTypeError extends BaseFileTypeError {
    constructor(fileName: string) {
        super(fileName, 'toml');
    }
}
