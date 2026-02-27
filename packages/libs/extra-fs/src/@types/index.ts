import { FsFolder } from '../lib/fs-folder.class';
import { FsFile } from '../lib/fs-file.class';

export type TextSearchResult = {
    line: number;
    column: number;
    match: string;
};

export type ArchiveEntry = {
    name: string;
    size: number;
    compressedSize?: number;
    isDirectory: boolean;
};

export type ScanResult = {
    files: number;
    folders: number;
    totalSize: number;
    items: (FsFolder | FsFile)[];
};

export type FilterCb<T extends FsFolder | FsFile> = (entry: T) => boolean;