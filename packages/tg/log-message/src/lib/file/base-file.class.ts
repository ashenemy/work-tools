import { ArchiveFile } from './archive-file.class';
import { File } from './file.class';

export class BaseFile {
    public static fromPath(path: string): ArchiveFile | File {
        const archiveFile = new ArchiveFile(path);

        if (archiveFile.isArchive) {
            return archiveFile;
        }

        return new File(path);
    }
}