import { Dirent } from 'node:fs';
import { BaseArchiveFile } from './archive/base-archive-file.class';
import { ArchivePartFileTypeError } from '../errors/file-type/archive-part-file-type.error';

export class ArchivePathFile extends BaseArchiveFile {
    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!ArchivePathFile.isArchivePath(filePath)) {
            throw new ArchivePartFileTypeError(this.name);
        }
    }

    public static isArchivePath(filePath: string | Dirent): boolean {
        const analize = BaseArchiveFile.analyzeArchiveFilename(filePath);

        return analize.isArchive && analize.isPart;
    }
}
