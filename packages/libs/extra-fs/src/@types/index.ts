import { Nullable, Optional } from '@work-tools/ts';
import { ArchiveFile } from '../lib/types/archive-file.class';
import { ArchivePathFile } from '../lib/types/archive-path-file.class';
import { Folder } from '../lib/primitives/folder.class';
import { File } from '../lib/primitives/file.class';
import { AudioFile } from '../lib/types/audio-file.class';
import { CsvFile } from '../lib/types/csv-file.class';
import { EnvFile } from '../lib/types/env-file.class';
import { ExcelFile } from '../lib/types/excel-file.class';
import { JsonFile } from '../lib/types/json-file.class';
import { PDFFile } from '../lib/types/pdf-file.class';
import { TomlFile } from '../lib/types/toml-file.class';
import { TxtFile } from '../lib/types/txt-file.class';
import { VideoFile } from '../lib/types/video-file.class';
import { WordFile } from '../lib/types/word-file.class';

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
