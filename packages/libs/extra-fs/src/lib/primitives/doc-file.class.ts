import { Dirent } from 'node:fs';
import { AbstractBinaryFile } from '../abstracts/abstract-binary-file.class';

export class DocFile extends AbstractBinaryFile {
    constructor(filePath: string | Dirent) {
        super(filePath);
    }
}
