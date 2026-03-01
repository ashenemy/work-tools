import { AbstractBinaryFile } from '../abstracts';
import { Dirent } from 'node:fs';

export class DocFile extends AbstractBinaryFile {
    constructor(filePath: string | Dirent) {
        super(filePath);
    }
}
