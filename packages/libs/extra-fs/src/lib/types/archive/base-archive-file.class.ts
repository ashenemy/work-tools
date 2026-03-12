import { Dirent } from 'node:fs';
import type { Optional } from '@work-tools/ts';
import { getFileName, isType, pad } from '@work-tools/utils';
import type { ArchiveParseResult, SupportedArchiveType } from '../../../@types';
import { AbstractBinaryFile } from '../../abstracts/abstract-binary-file.class';
import { File } from '../../primitives/file.class';

export class BaseArchiveFile extends AbstractBinaryFile {
    protected _analized: ArchiveParseResult;

    constructor(filePath: string | Dirent) {
        super(filePath);

        this._analized = BaseArchiveFile.analyzeArchiveFilename(this.absPath);
    }

    public get archiveKind(): Optional<SupportedArchiveType | 'generic'> {
        return this._analized.archiveKind;
    }

    public get isPart(): boolean {
        return this._analized.isPart;
    }

    public get isFirstPart(): Optional<boolean> {
        return this._analized.isFirstPart;
    }

    public get partIndex(): Optional<number> {
        return this._analized.partIndex;
    }

    public get entryFileName(): Optional<string> {
        return this._analized.entryFileName;
    }

    public get globPattern(): Optional<string> {
        return this._analized.globPattern;
    }

    public get baseName(): Optional<string> {
        return this._analized.baseName;
    }

    public static analyzeArchiveFilename(filePathOrName: File | string | Dirent): ArchiveParseResult {
        let fileName: string;
        if (isType(filePathOrName, File)) {
            fileName = filePathOrName.name;
        } else if (isType(filePathOrName, Dirent)) {
            fileName = filePathOrName.name;
        } else {
            fileName = filePathOrName;
        }

        fileName = getFileName(fileName);

        let m = fileName.match(/^(.*)\.7z\.(\d{3,})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            const entryFileName = `${baseName}.7z.${pad(1, m[2].length)}`;
            return {
                archiveKind: '7z',
                baseName,
                entryFileName,
                fileName,
                globPattern: `${baseName}.7z.*`,
                isArchive: true,
                isFirstPart: idx === 1,
                isPart: true,
                partIndex: Number.isFinite(idx) ? idx : undefined,
            };
        }

        m = fileName.match(/^(.*)\.zip\.(\d{3,})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            const entryFileName = `${baseName}.zip.${pad(1, m[2].length)}`;
            return {
                archiveKind: 'zip',
                baseName,
                entryFileName,
                fileName,
                globPattern: `${baseName}.zip.*`,
                isArchive: true,
                isFirstPart: idx === 1,
                isPart: true,
                partIndex: Number.isFinite(idx) ? idx : undefined,
            };
        }

        m = fileName.match(/^(.*)\.part(\d+)\.rar$/i);
        if (m) {
            const baseName = m[1];
            const digits = m[2].length;
            const idx = Number(m[2]);
            const entryFileName = `${baseName}.part${pad(1, digits)}.rar`;
            return {
                archiveKind: 'rar',
                baseName,
                entryFileName,
                fileName,
                globPattern: `${baseName}.part*.rar`,
                isArchive: true,
                isFirstPart: idx === 1,
                isPart: true,
                partIndex: Number.isFinite(idx) ? idx : undefined,
            };
        }

        m = fileName.match(/^(.*)\.r(\d{2})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            return {
                archiveKind: 'rar',
                baseName,
                entryFileName: `${baseName}.rar`,
                fileName,
                globPattern: `{${baseName}.rar,${baseName}.r??}`,
                isArchive: true,
                isFirstPart: false,
                isPart: true,
                partIndex: Number.isFinite(idx) ? idx : undefined,
            };
        }

        m = fileName.match(/^(.*)\.z(\d{2})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            return {
                archiveKind: 'zip',
                baseName,
                entryFileName: `${baseName}.zip`,
                fileName,
                globPattern: `{${baseName}.zip,${baseName}.z??}`,
                isArchive: true,
                isFirstPart: false,
                isPart: true,
                partIndex: Number.isFinite(idx) ? idx : undefined,
            };
        }

        m = fileName.match(/^(.*)\.(zip|rar|7z)$/i);
        if (m) {
            const baseName = m[1];
            const kind = m[2].toLowerCase() as SupportedArchiveType;

            return {
                archiveKind: kind,
                baseName,
                entryFileName: fileName,
                fileName,
                globPattern: undefined,
                isArchive: true,
                isFirstPart: undefined,
                isPart: false,
                partIndex: undefined,
            };
        }

        m = fileName.match(/^(.*)\.(\d{3,})$/);
        if (m) {
            return {
                archiveKind: 'generic',
                baseName: m[1],
                entryFileName: undefined,
                fileName,
                globPattern: `${m[1]}.*`,
                isArchive: true,
                isFirstPart: Number(m[2]) === 1,
                isPart: true,
                partIndex: Number(m[2]),
            };
        }

        return {
            archiveKind: undefined,
            baseName: fileName,
            entryFileName: undefined,
            fileName,
            globPattern: undefined,
            isArchive: false,
            isFirstPart: undefined,
            isPart: false,
            partIndex: undefined,
        };
    }
}
