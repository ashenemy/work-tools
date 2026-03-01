import { Dirent, Stats } from 'node:fs';
import { isType } from '@work-tools/utils';
import { basename, dirname, extname, relative, resolve } from 'path';
import { access, copy, move, remove, stat } from 'fs-extra';
import { Ctor, Optional } from '@work-tools/ts';

export abstract class AbstractFs {
    protected _fullPath: string;

    constructor(input: string | Dirent) {
        if (isType(input, Dirent)) {
            this._fullPath = resolve(input.parentPath, input.name);
        } else {
            this._fullPath = resolve(input);
        }
    }

    public get absPath(): string {
        return this._fullPath;
    }

    public get normalizedPath(): string {
        return this.absPath.replace(/[\\/]+$/, '');
    }

    public get name(): string {
        return basename(this.normalizedPath);
    }

    public get parent(): string {
        return dirname(this.normalizedPath);
    }

    public abstract ensure(): Promise<void>;

    public abstract create(): Promise<void>;

    public abstract size(): Promise<Optional<number>>;

    public abstract empty(): Promise<void>;

    public abstract isEmpty(): Promise<boolean>;

    public relativePath(basePath: string): string {
        return relative(basePath, this.absPath);
    }

    public async getStats(): Promise<Stats> {
        return await stat(this.absPath);
    }

    public async isDirectory(): Promise<boolean> {
        try {
            return (await this.getStats()).isDirectory();
        } catch {
            return false;
        }
    }

    public async isFile(): Promise<boolean> {
        try {
            return (await this.getStats()).isFile();
        } catch {
            return false;
        }
    }

    public async exists(): Promise<boolean> {
        try {
            await access(this.absPath);
            return true;
        } catch {
            return false;
        }
    }

    public async move(destination: string): Promise<void> {
        if (extname(destination) !== extname(this.absPath)){
            throw new Error(
                `Destination path must have the same extension as the source path. Source: ${this.absPath}, Destination: ${destination}`
            )
        }
        await move(this.absPath, destination);
        this._fullPath = resolve(destination);
    }

    public async copy<T extends this>(destination: string): Promise<T> {
        if (extname(destination) !== extname(this.absPath)){
            throw new Error(
                `Destination path must have the same extension as the source path. Source: ${this.absPath}, Destination: ${destination}`
            )
        }
        try {
            await copy(this.absPath, destination);
            const ctor: Ctor<this, [string]> = this.constructor as Ctor<this, [string]>;
            return new ctor(destination) as T;
        } catch (e) {
            throw e;
        }
    }

    public async remove(): Promise<void> {
        await remove(this.absPath);
    }

    public async rename(newName: string): Promise<void> {
        if (extname(newName) !== extname(this.absPath)){
            throw new Error(`Destination path must have the same extension as the source path. Source: ${this.absPath}, Destination: ${newName}`);
        }
        const newFullPath = resolve(this.parent, newName);
        await this.move(newFullPath);
    }
}
