import { FsFolder } from '../lib/base/fs-folder.class';
import { FsFile } from '../lib/base/fs-file.class';

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

export type SupportedArchiveType = 'zip' | '7z' | 'rar';

export type SevenZipTask<R, P> = Promise<R> & {
    progress: (callback: (payload: P) => void) => SevenZipTask<R, P>;
};

export type SevenZipListEntry = {
    attr?: string;
    name: string;
    size: number;
    compressedSize?: number;
};
