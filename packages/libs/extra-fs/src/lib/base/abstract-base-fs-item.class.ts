import { Dirent, Stats } from 'node:fs';
import { isType } from '@work-tools/utils';
import { basename, dirname, extname, join, relative, resolve } from 'path';
import { access, copy, ensureFile, move, pathExists, remove, rename, stat, unlink } from 'fs-extra';
import { FsFolder } from './fs-folder.class';
import { Optional } from '@work-tools/ts';

export abstract class AbstractBaseFsItem {
    protected _path: string;

    constructor(input: string | Dirent) {
        if (isType(input, Dirent)) {
            this._path = resolve(input.parentPath, input.name);
        } else {
            this._path = resolve(input);
        }
    }

    public async exists(): Promise<boolean> {
        try {
            await access(this._path);
            return true;
        } catch {
            return false;
        }
    }

    public getAbsolutePath(): string {
        return this._path;
    }
    public getName(): string {
        return basename(this._path);
    }
    public getExtension(): string {
        return extname(this._path).toLowerCase();
    }

    public async getParent(): Promise<Optional<FsFolder>> {
        const parentPath = dirname(this._path);
        return parentPath === this._path ? undefined : new FsFolder(parentPath);
    }

    public async getStats(): Promise<Stats> {
        return stat(this._path);
    }
    public async isDirectory(): Promise<boolean> {
        return (await this.getStats()).isDirectory();
    }
    public async isFile(): Promise<boolean> {
        return (await this.getStats()).isFile();
    }
    public async size(): Promise<number> {
        try {
            return (await this.getStats()).size;
        } catch {
            return 0;
        }
    }

    public async rename(newName: string): Promise<void> {
        const newPath = join(dirname(this._path), newName);
        await rename(this._path, newPath);
        this._path = newPath;
    }

    public async delete(): Promise<void> {
        if (await this.isDirectory()) await remove(this._path);
        else await unlink(this._path);
    }

    public async move(newPath: string, overwrite = false): Promise<void> {
        await move(this._path, newPath, { overwrite });
        this._path = newPath;
    }

    public async copy(destination: string, overwrite = false): Promise<void> {
        await copy(this._path, destination, { overwrite });
    }

    public async touch(): Promise<void> {
        await ensureFile(this._path);
    }

    public getRelativePath(basePath: string): string {
        return relative(basePath, this._path);
    }

    public async getUniquePath(): Promise<string> {
        let candidate = this._path;
        let counter = 1;
        const dir = dirname(candidate);
        const name = basename(candidate, extname(candidate));
        const ext = extname(candidate);

        while (await pathExists(candidate)) {
            candidate = join(dir, `${name}_${counter}${ext}`);
            counter++;
        }
        return candidate;
    }
}
