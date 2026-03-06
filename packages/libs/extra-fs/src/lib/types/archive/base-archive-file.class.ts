import { Dirent } from 'node:fs';
import type { ArchiveParseResult, SupportedArchiveType } from '../../../@types';
import type { Optional } from '@work-tools/ts';
import { getFileName, isType, pad } from '@work-tools/utils';
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
                fileName,
                isArchive: true,
                archiveKind: '7z',
                isPart: true,
                isFirstPart: idx === 1,
                partIndex: Number.isFinite(idx) ? idx : undefined,
                baseName,
                entryFileName,
                globPattern: `${baseName}.7z.*`,
            };
        }

        m = fileName.match(/^(.*)\.zip\.(\d{3,})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            const entryFileName = `${baseName}.zip.${pad(1, m[2].length)}`;
            return {
                fileName,
                isArchive: true,
                archiveKind: 'zip',
                isPart: true,
                isFirstPart: idx === 1,
                partIndex: Number.isFinite(idx) ? idx : undefined,
                baseName,
                entryFileName,
                globPattern: `${baseName}.zip.*`,
            };
        }

        m = fileName.match(/^(.*)\.part(\d+)\.rar$/i);
        if (m) {
            const baseName = m[1];
            const digits = m[2].length;
            const idx = Number(m[2]);
            const entryFileName = `${baseName}.part${pad(1, digits)}.rar`;
            return {
                fileName,
                isArchive: true,
                archiveKind: 'rar',
                isPart: true,
                isFirstPart: idx === 1,
                partIndex: Number.isFinite(idx) ? idx : undefined,
                baseName,
                entryFileName,
                globPattern: `${baseName}.part*.rar`,
            };
        }

        m = fileName.match(/^(.*)\.r(\d{2})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            return {
                fileName,
                isArchive: true,
                archiveKind: 'rar',
                isPart: true,
                isFirstPart: false,
                partIndex: Number.isFinite(idx) ? idx : undefined,
                baseName,
                entryFileName: `${baseName}.rar`,
                globPattern: `{${baseName}.rar,${baseName}.r??}`,
            };
        }

        m = fileName.match(/^(.*)\.z(\d{2})$/i);
        if (m) {
            const baseName = m[1];
            const idx = Number(m[2]);
            return {
                fileName,
                isArchive: true,
                archiveKind: 'zip',
                isPart: true,
                isFirstPart: false,
                partIndex: Number.isFinite(idx) ? idx : undefined,
                baseName,
                entryFileName: `${baseName}.zip`,
                globPattern: `{${baseName}.zip,${baseName}.z??}`,
            };
        }

        m = fileName.match(/^(.*)\.(zip|rar|7z)$/i);
        if (m) {
            const baseName = m[1];
            const kind = m[2].toLowerCase() as SupportedArchiveType;

            return {
                fileName,
                isArchive: true,
                archiveKind: kind,
                isPart: false,
                isFirstPart: undefined,
                partIndex: undefined,
                baseName,
                entryFileName: fileName,
                globPattern: undefined,
            };
        }

        m = fileName.match(/^(.*)\.(\d{3,})$/);
        if (m) {
            return {
                fileName,
                isArchive: true,
                archiveKind: 'generic',
                isPart: true,
                isFirstPart: Number(m[2]) === 1,
                partIndex: Number(m[2]),
                baseName: m[1],
                entryFileName: undefined,
                globPattern: `${m[1]}.*`,
            };
        }

        return {
            fileName,
            isArchive: false,
            archiveKind: undefined,
            isPart: false,
            isFirstPart: undefined,
            partIndex: undefined,
            baseName: fileName,
            entryFileName: undefined,
            globPattern: undefined,
        };
    }
}
