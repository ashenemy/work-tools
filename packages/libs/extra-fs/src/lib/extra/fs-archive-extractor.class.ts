import { Optional } from '@work-tools/ts';
import { pathExists, readdir } from 'fs-extra';
import { fullArchive, listArchive, testArchive } from 'node-7z-archive';
import { basename, dirname, extname, join } from 'path';
import { ArchiveEntry, SevenZipListEntry, SevenZipTask, SupportedArchiveType } from '../../@types';
import { FsFile } from '../base/fs-file.class';
import { FsFolder } from '../base/fs-folder.class';
import { ArchiveCorruptedError } from '../errors/archive-corrupted-error.class';
import { ArchiveError } from '../errors/archive-error.class';
import { ArchiveMissingVolumeError } from '../errors/archive-missing-volume-error.class';
import { ArchiveWrongPasswordError } from '../errors/archive-wrong-password-error.class';
import { FsArchiveFile } from './fs-archive-file.class';
import { isDefined } from '@work-tools/utils';

export class FsArchiveExtractor {
    private static _cwdQueue: Promise<void> = Promise.resolve();

    private _checkedPassword: Optional<string> = undefined;

    constructor(private readonly _archive: FsArchiveFile) {}

    public get password(): Optional<string> {
        return this._checkedPassword ?? this._archive.password;
    }

    private get _archivePath(): string {
        return this._archive.getAbsolutePath();
    }

    public async checkCorrupted(): Promise<boolean> {
        await this.checkPartsExists();

        try {
            await this._runTest(this.password);
            return true;
        } catch (error) {
            const details = this._getErrorMessage(error);

            if (this._isWrongPasswordError(details)) {
                throw new ArchiveWrongPasswordError(this._archivePath, details, error);
            }

            throw new ArchiveCorruptedError(this._archivePath, details, error);
        }
    }

    public async checkPartsExists(): Promise<boolean> {
        const missingParts = await this._getMissingPartPaths();

        if (missingParts.length > 0) {
            throw new ArchiveMissingVolumeError(this._archivePath, `Missing parts: ${missingParts.join(', ')}`);
        }

        return true;
    }

    public async checkPassword(): Promise<boolean> {
        const passwordsForCheck = [this.password];

        if (isDefined(this.password)) {
            passwordsForCheck.push(undefined);

            if (!this.password.startsWith('@')) {
                passwordsForCheck.push(`@${this.password}`);
            }
        } else {
            passwordsForCheck.push('@LOGACTIVE');
        }

        for (const password of passwordsForCheck) {
            const checkResult = await this._checkPassword(password);
            if (checkResult) {
                this._checkedPassword = password;
                return true;
            }
        }

        return false;
    }

    public async getFileCount(): Promise<number> {
        await this.checkPassword();
        const entries = await this._listEntries();
        return entries.filter((entry) => !entry.isDirectory).length;
    }

    public async extract(destination: FsFolder): Promise<FsFile[]> {
        await destination.ensureExists();
        await this.checkPartsExists();
        await this.checkPassword();
        await this.checkCorrupted();

        try {
            await this._runInArchiveDirectory(async (archiveFileName) => {
                const task = fullArchive(archiveFileName, destination.getAbsolutePath(), this._buildSevenZipOptions(), false) as unknown as SevenZipTask<string[], string[]>;

                await this._awaitTask(task);
            });
        } catch (error) {
            const details = this._getErrorMessage(error);

            if (this._isWrongPasswordError(details)) {
                throw new ArchiveWrongPasswordError(this._archivePath, details, error);
            }

            throw new ArchiveCorruptedError(this._archivePath, details, error);
        }

        return destination.getFiles(true);
    }

    private async _checkPassword(password: Optional<string>): Promise<boolean> {
        try {
            return await this.__checkPassword(password);
        } catch {
            return false;
        }
    }

    private async __checkPassword(password: Optional<string>): Promise<boolean> {
        await this.checkPartsExists();

        try {
            await this._runTest(password);
            return true;
        } catch (error) {
            const details = this._getErrorMessage(error);

            if (this._isWrongPasswordError(details) || details.length === 0) {
                throw new ArchiveWrongPasswordError(this._archivePath, details, error);
            }

            throw new ArchiveCorruptedError(this._archivePath, details, error);
        }
    }

    private async _runTest(password: Optional<string>): Promise<void> {
        await this._runInArchiveDirectory(async (archiveFileName) => {
            const task = testArchive(archiveFileName, this._buildSevenZipOptions(), false) as unknown as SevenZipTask<string[], string[]>;
            await this._awaitTask(task);
        });
    }

    private async _listEntries(): Promise<ArchiveEntry[]> {
        const entries: ArchiveEntry[] = [];
        const seen: Set<string> = new Set();

        try {
            await this._runInArchiveDirectory(async (archiveFileName) => {
                const task = listArchive(archiveFileName, this._buildSevenZipOptions(), false) as unknown as SevenZipTask<Record<string, unknown>, SevenZipListEntry[]>;

                task.progress((chunk) => {
                    for (const rawEntry of chunk) {
                        const entry = this._toArchiveEntry(rawEntry);
                        const key = `${entry.name}|${entry.size}|${entry.isDirectory ? 'd' : 'f'}`;

                        if (!seen.has(key)) {
                            seen.add(key);
                            entries.push(entry);
                        }
                    }
                });

                await this._awaitTask(task);
            });
        } catch (error) {
            const details = this._getErrorMessage(error);

            if (this._isWrongPasswordError(details)) {
                throw new ArchiveWrongPasswordError(this._archivePath, details, error);
            }

            throw new ArchiveCorruptedError(this._archivePath, details, error);
        }

        return entries;
    }

    private _toArchiveEntry(raw: SevenZipListEntry): ArchiveEntry {
        const name = raw.name.trim().replace(/\\/g, '/');
        const attr = typeof raw.attr === 'string' ? raw.attr.trim().toUpperCase() : '';
        const compressedSize = typeof raw.compressedSize === 'number' && Number.isFinite(raw.compressedSize) ? raw.compressedSize : undefined;

        return {
            name,
            size: Number.isFinite(raw.size) ? raw.size : 0,
            compressedSize,
            isDirectory: attr.startsWith('D') || name.endsWith('/'),
        };
    }

    private _buildSevenZipOptions(): Record<string, string | boolean> {
        return {
            t: this._resolveArchiveType(),
            p: this.password ?? '',
            y: true,
        };
    }

    private _resolveArchiveType(): SupportedArchiveType {
        const lowerName = this._archive.getName().toLowerCase();

        if (/\.(zip|z\d{2}|zip\.\d{3}|part\d+\.zip)$/i.test(lowerName)) {
            return 'zip';
        }

        if (/\.(7z|7z\.\d{3}|part\d+\.7z)$/i.test(lowerName)) {
            return '7z';
        }

        if (/\.(rar|rar\.\d{3}|part\d+\.rar)$/i.test(lowerName)) {
            return 'rar';
        }

        const numberedMatch = lowerName.match(/^(.*)\.(\d{3})$/);

        if (numberedMatch) {
            const base = numberedMatch[1];

            if (base.endsWith('.zip')) {
                return 'zip';
            }

            if (base.endsWith('.7z')) {
                return '7z';
            }

            if (base.endsWith('.rar')) {
                return 'rar';
            }
        }

        throw new ArchiveError('Unsupported archive format. Supported formats: zip, 7z, rar', this._archivePath, this._archive.getName());
    }

    private async _getMissingPartPaths(): Promise<string[]> {
        const archivePath = this._archivePath;
        const archiveDir = dirname(archivePath);
        const archiveName = basename(archivePath);
        const lowerName = archiveName.toLowerCase();
        const allNames = await readdir(archiveDir);
        const lowerSet = new Set(allNames.map((name) => name.toLowerCase()));

        const splitByNumber = lowerName.match(/^(.*\.(zip|7z|rar))\.(\d{3})$/);

        if (splitByNumber) {
            return this._missingByThreeDigitVolume(archiveDir, lowerSet, splitByNumber[1]);
        }

        const splitByPart = lowerName.match(/^(.*)\.part(\d+)\.(zip|7z|rar)$/);

        if (splitByPart) {
            return this._missingByPartVolume(archiveDir, lowerSet, splitByPart[1], splitByPart[3] as SupportedArchiveType);
        }

        const splitZipByZ = lowerName.match(/^(.*)\.z(\d{2})$/);

        if (splitZipByZ) {
            return this._missingByZipZVolume(archiveDir, lowerSet, splitZipByZ[1]);
        }

        const extension = extname(lowerName);
        const baseName = lowerName.slice(0, lowerName.length - extension.length);

        if (extension === '.zip') {
            if (lowerSet.has(`${baseName}.z01`)) {
                return this._missingByZipZVolume(archiveDir, lowerSet, baseName);
            }

            if (lowerSet.has(`${lowerName}.001`)) {
                return this._missingByThreeDigitVolume(archiveDir, lowerSet, lowerName);
            }

            if (lowerSet.has(`${baseName}.part1.zip`)) {
                return this._missingByPartVolume(archiveDir, lowerSet, baseName, 'zip');
            }
        }

        if (extension === '.7z') {
            if (lowerSet.has(`${lowerName}.001`)) {
                return this._missingByThreeDigitVolume(archiveDir, lowerSet, lowerName);
            }

            if (lowerSet.has(`${baseName}.part1.7z`)) {
                return this._missingByPartVolume(archiveDir, lowerSet, baseName, '7z');
            }
        }

        if (extension === '.rar') {
            if (lowerSet.has(`${lowerName}.001`)) {
                return this._missingByThreeDigitVolume(archiveDir, lowerSet, lowerName);
            }

            if (lowerSet.has(`${baseName}.part1.rar`)) {
                return this._missingByPartVolume(archiveDir, lowerSet, baseName, 'rar');
            }
        }

        if (!this._archive.isMultipart()) {
            return [];
        }

        if (!(await this._archive.areAllPartsAvailable())) {
            return ['sequence gap detected'];
        }

        if (this._archive.getAllPartPaths().length < 2) {
            return ['next volume not found'];
        }

        return [];
    }

    private _missingByThreeDigitVolume(archiveDir: string, names: Set<string>, base: string): string[] {
        const pattern = new RegExp(`^${this._escapeRegExp(base)}\\.(\\d{3})$`, 'i');
        const numbers = this._collectNumbersByPattern(names, pattern);
        const missingNumbers = this._findMissingNumbers(numbers);
        const missing: string[] = missingNumbers.map((number) => join(archiveDir, `${base}.${number.toString().padStart(3, '0')}`));

        if (numbers.length > 0 && numbers.length < 2) {
            const next = numbers[0] + 1;
            missing.push(join(archiveDir, `${base}.${next.toString().padStart(3, '0')}`));
        }

        return missing;
    }

    private _missingByPartVolume(archiveDir: string, names: Set<string>, base: string, type: SupportedArchiveType): string[] {
        const pattern = new RegExp(`^${this._escapeRegExp(base)}\\.part(\\d+)\\.${type}$`, 'i');
        const numbers = this._collectNumbersByPattern(names, pattern);
        const missingNumbers = this._findMissingNumbers(numbers);
        const missing: string[] = missingNumbers.map((number) => join(archiveDir, `${base}.part${number}.${type}`));

        if (numbers.length > 0 && numbers.length < 2) {
            missing.push(join(archiveDir, `${base}.part${numbers[0] + 1}.${type}`));
        }

        return missing;
    }

    private _missingByZipZVolume(archiveDir: string, names: Set<string>, base: string): string[] {
        const pattern = new RegExp(`^${this._escapeRegExp(base)}\\.z(\\d{2})$`, 'i');
        const numbers = this._collectNumbersByPattern(names, pattern);
        const missingNumbers = this._findMissingNumbers(numbers);
        const missing = missingNumbers.map((number) => join(archiveDir, `${base}.z${number.toString().padStart(2, '0')}`));
        const mainArchive = `${base}.zip`;

        if (!names.has(mainArchive.toLowerCase())) {
            missing.push(join(archiveDir, mainArchive));
        }

        return missing;
    }

    private _collectNumbersByPattern(names: Set<string>, pattern: RegExp): number[] {
        const numbers: number[] = [];

        for (const name of names) {
            const match = name.match(pattern);

            if (match) {
                const parsed = Number.parseInt(match[1], 10);

                if (!Number.isNaN(parsed)) {
                    numbers.push(parsed);
                }
            }
        }

        return Array.from(new Set(numbers)).sort((a, b) => a - b);
    }

    private _findMissingNumbers(numbers: number[]): number[] {
        if (numbers.length === 0) {
            return [];
        }

        const missing: number[] = [];
        const max = numbers[numbers.length - 1];
        const known = new Set(numbers);

        for (let index = 1; index <= max; index++) {
            if (!known.has(index)) {
                missing.push(index);
            }
        }

        return missing;
    }

    private async _runInArchiveDirectory<T>(callback: (archiveFileName: string) => Promise<T>): Promise<T> {
        const archivePath = this._archivePath;
        const archiveName = basename(archivePath);
        const archiveDir = dirname(archivePath);

        if (!(await pathExists(archivePath))) {
            throw new ArchiveCorruptedError(archivePath, 'Archive file does not exist');
        }

        const run = async (): Promise<T> => {
            const currentDir = process.cwd();

            process.chdir(archiveDir);

            try {
                return await callback(archiveName);
            } finally {
                process.chdir(currentDir);
            }
        };

        const queued = FsArchiveExtractor._cwdQueue.then(run, run);

        FsArchiveExtractor._cwdQueue = queued.then(
            () => undefined,
            () => undefined,
        );

        return queued;
    }

    private async _awaitTask<R, P>(task: SevenZipTask<R, P>): Promise<R> {
        return task;
    }

    private _isWrongPasswordError(message: string): boolean {
        return /wrong password|encrypted file|can not open encrypted archive/i.test(message);
    }

    private _escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private _getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message.trim();
        }

        if (typeof error === 'string') {
            return error.trim();
        }

        return '';
    }
}
