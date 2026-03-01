import { Dirent } from 'node:fs';
import { File, Folder } from './primitives';
import { FsItem } from '../@types';
import { ArchivePathFile } from './types/archive-path-file.class';
import { ArchiveFile } from './types/archive-file.class';
import { AudioFile, CsvFile, EnvFile, ExcelFile, JsonFile, PDFFile, TomlFile, TxtFile, VideoFile, WordFile } from './types';

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

        return new File<any>(path)
    }
}
