import { Dirent, Stats } from 'node:fs';
import { isType } from '@work-tools/utils';
import { basename, dirname, relative, resolve } from 'path';
import { access, copy, move, remove, stat } from 'fs-extra';
import type { Ctor, Optional } from '@work-tools/ts';
import { parse } from 'node:path';

export abstract class AbstractFs {
    protected _fullPath: string;

    constructor(input: string | Dirent, createNew: boolean = false) {
        if (isType(input, Dirent)) {
            this._fullPath = resolve(input.parentPath, input.name);
        } else {
            this._fullPath = resolve(input);
        }

        if (createNew) {
            this.ensureSync();
        }
    }
    protected assertDestinationCompatible(_destination: string): void {}

    public get absPath(): string {
        return this._fullPath;
    }

    public get normalizedPath(): string {
        const abs = this.absPath;
        const { root } = parse(abs);

        if (abs === root) {
            return root;
        }

        return abs.replace(/[\\/]+$/, '');
    }

    public get name(): string {
        const normalized = this.normalizedPath;
        const { root } = parse(normalized);

        if (normalized === root) {
            return root;
        }

        return basename(this.normalizedPath);
    }

    public get parent(): string {
        const normalized = this.normalizedPath;
        const { root } = parse(normalized);

        if (normalized === root) {
            return root;
        }

        return dirname(this.normalizedPath);
    }

    public abstract ensure(): Promise<void>;

    public abstract ensureSync(): void;

    public abstract create(): Promise<void>;

    public abstract size(): Promise<Optional<number>>;

    public abstract empty(): Promise<void>;

    public abstract isEmpty(): Promise<Optional<boolean>>;

    public abstract zip(destination?: string): Promise<string>;

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
        const newPath = resolve(destination);
        this.assertDestinationCompatible(newPath);

        await move(this.absPath, newPath);
        this._fullPath = newPath;
    }

    public async copy<T extends this>(destination: string): Promise<T> {
        try {
            const newPath = resolve(destination);
            this.assertDestinationCompatible(newPath);

            await copy(this.absPath, newPath);
            const ctor: Ctor<this, [string]> = this.constructor as Ctor<this, [string]>;
            return new ctor(newPath) as T;
        } catch (e) {
            throw e;
        }
    }

    public async remove(): Promise<void> {
        await remove(this.absPath);
    }

    public async rename(newName: string): Promise<void> {
        const newFullPath = resolve(this.parent, newName);
        this.assertDestinationCompatible(newFullPath);

        await this.move(newFullPath);
    }
}
