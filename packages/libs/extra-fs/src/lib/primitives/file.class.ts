import { createFile, ensureDir, ensureFile, ensureFileSync, readFile, statSync, truncate } from 'fs-extra';
import { Dirent } from 'node:fs';
import { isDefined, isErrorNoException, isType } from '@work-tools/utils';
import mime from 'mime-types';
import type { Optional } from '@work-tools/ts';
import _7z from '7zip-min';
import { dirname, extname, resolve } from 'path';
import { AbstractFs } from '../abstracts/abstract-fs.class';

export class File<ContentType extends Buffer | string = Buffer> extends AbstractFs {
    public get extension(): string {
        return extname(this.absPath).toLowerCase();
    }

    public get ext(): string {
        return this.extension.substring(1);
    }

    public get fileName(): string {
        if (this.ext === '') {
            return this.name;
        }
        const names = this.name.split('.');
        names.pop();
        return names.join('.');
    }

    public get mime(): Optional<string> {
        return mime.lookup(this.absPath) || undefined;
    }

    public static isFile(path: string | Dirent, canBeCreate: boolean = false): boolean {
        if (isType(path, Dirent)) {
            return path.isFile();
        }

        try {
            const lstat = statSync(path);

            return lstat.isFile();
        } catch (err) {
            return isErrorNoException(err) && canBeCreate;
        }
    }

    public override async ensure(): Promise<void> {
        await ensureFile(this.absPath);
    }

    public override ensureSync(): void {
        ensureFileSync(this.absPath);
    }

    public override async create(): Promise<void> {
        await createFile(this.absPath);
    }

    public override async size(): Promise<Optional<number>> {
        try {
            const stats = await this.getStats();

            return stats.size;
        } catch {
            return undefined;
        }
    }

    public override async empty(): Promise<void> {
        try {
            await truncate(this.absPath, 0);
        } catch {}
    }

    public override async isEmpty(): Promise<Optional<boolean>> {
        const size = await this.size();
        if (isDefined(size)) {
            return size === 0;
        }

        return undefined;
    }

    public async read(): Promise<ContentType> {
        return (await readFile(this.absPath)) as ContentType;
    }

    public async zip(destination?: string): Promise<string> {
        const zipPath = this._resolveZipPath(destination);

        await ensureDir(dirname(zipPath));
        await _7z.pack(this.absPath, zipPath);

        return zipPath;
    }

    protected assertAllowedExtensions(destination: string, extensions: readonly string[]): void {
        const nextExt = extname(resolve(destination)).slice(1).toLowerCase();

        if (!extensions.includes(nextExt)) {
            throw new Error(`Destination path must have one of extensions: ${extensions.join(', ')}. Destination: ${destination}`);
        }
    }

    protected _resolveZipPath(destination?: string): string {
        if (!destination) {
            return resolve(this.parent, `${this.fileName}.zip`);
        }

        const archivePath = resolve(destination);
        const ext = extname(archivePath).toLowerCase();

        if (ext === '.zip') {
            return archivePath;
        }

        if (ext === '') {
            return `${archivePath}.zip`;
        }

        throw new Error(`Zip destination must have .zip extension or no extension. Destination: ${destination}`);
    }
}
