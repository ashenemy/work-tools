import { Dirent } from 'node:fs';
import type { FsItem } from '../@types';
import { ArchivePathFile } from './types/archive-path-file.class';
import { ArchiveFile } from './types/archive-file.class';
import { File } from './primitives/file.class';
import { Folder } from './primitives/folder.class';
import { AudioFile } from './types/audio-file.class';
import { CsvFile } from './types/csv-file.class';
import { EnvFile } from './types/env-file.class';
import { ExcelFile } from './types/excel-file.class';
import { JsonFile } from './types/json-file.class';
import { PDFFile } from './types/pdf-file.class';
import { TomlFile } from './types/toml-file.class';
import { TxtFile } from './types/txt-file.class';
import { VideoFile } from './types/video-file.class';
import { WordFile } from './types/word-file.class';

export class FsFactory {

    public static fromPath(path: string | Dirent): FsItem {
        if (Folder.isFolder(path)) {
            return new Folder(path);
        }

        if (ArchivePathFile.isArchivePath(path)) {
            return new ArchivePathFile(path);
        }

        if (ArchiveFile.isArchiveFile(path)) {
            return new ArchiveFile(path);
        }

        if (AudioFile.isAudioFile(path)) {
            return new AudioFile(path);
        }

        if (CsvFile.isCsvFile(path)) {
            return new CsvFile(path);
        }

        if (EnvFile.isEnvFile(path)) {
            return new EnvFile(path);
        }

        if (ExcelFile.isExcelFile(path)) {
            return new ExcelFile(path);
        }

        if (JsonFile.isJsonFile(path)) {
            return new JsonFile(path);
        }

        if (PDFFile.isPdfFile(path)) {
            return new PDFFile(path);
        }

        if (TomlFile.isTomlFile(path)) {
            return new TomlFile(path);
        }

        if (TxtFile.isTxtFile(path)) {
            return new TxtFile(path);
        }

        if (VideoFile.isVideo(path)) {
            return new VideoFile(path);
        }

        if (WordFile.isWordFile(path)) {
            return new WordFile(path);
        }

        return new File<any>(path);
    }

    public static createNewFile(path: string): FsItem {
        const file = new File(path, true);

        return FsFactory.fromPath(file.absPath);
    }

    public static createFolder(path: string): Folder {
        return new Folder(path, true);
    }
}
