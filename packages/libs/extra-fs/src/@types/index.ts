import { Nullable, Optional } from '@work-tools/ts';
import { File, Folder } from '../lib/primitives';
import { ArchiveFile } from '../lib/types/archive-file.class';
import { ArchivePathFile } from '../lib/types/archive-path-file.class';
import { AudioFile, CsvFile, EnvFile, ExcelFile, JsonFile, PDFFile, TomlFile, TxtFile, VideoFile, WordFile } from '../lib/types';

export type ExcelContentType = string | number | boolean | Date | null;
export type ExcelRow = ExcelContentType[];
export type ExcelSheet = ExcelRow[];
export type SupportedArchiveType = 'zip' | '7z' | 'rar';
export type ArchiveParseResult = {
    fileName: string;
    isArchive: boolean;
    archiveKind: Optional<SupportedArchiveType>;
    isPart: boolean;
    isFirstPart: Optional<boolean>;
    partIndex: Optional<number>;
    baseName: string;
    entryFileName: Optional<string>;
    globPattern: Optional<string>;
};

export type FileTree = {
    [key: string]: Nullable<FileTree>;
};

export type FsItem = File | Folder | ArchiveFile | ArchivePathFile | AudioFile | CsvFile | EnvFile | ExcelFile | JsonFile | PDFFile | TomlFile | TxtFile | VideoFile | WordFile;
