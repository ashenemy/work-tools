export type { ArchiveParseResult, ExcelContentType, ExcelRow, ExcelSheet, FileTree, FsItem, SupportedArchiveType } from './@types';
export { FsFactory } from './lib/fs-factory.class';
export { AbstractBinaryFile, AbstractFs, AbstractTextFile, AbstractWritableFile } from './lib/abstracts';
export { DocFile, File, Folder, MediaFile } from './lib/primitives';
export { AudioFile, CsvFile, EnvFile, ExcelFile, JsonFile, PDFFile, TomlFile, TxtFile, WordFile } from './lib/types';
export { ArchivePathFile } from './lib/types/archive-path-file.class';
export { ArchiveFile } from './lib/types/archive-file.class';
export { ArchiveExtractor, BaseArchiveFile } from './lib/types/archive';
export { ArchiveFileTypeError, ArchivePartFileTypeError, AudioFileTypeError, CorruptedArchiveError, CsvFileTypeError, EnvFileTypeError, ExcelFileTypeError, FolderFileTypeError, JsonFileTypeError, MissingArchivePartError, PdfFileTypeError, TomlFileTypeError, TxtFileTypeError, UnknowArchiveError, VideoFileTypeError, WordFileTypeError, WrongPasswordArchiveError } from './lib/errors';
