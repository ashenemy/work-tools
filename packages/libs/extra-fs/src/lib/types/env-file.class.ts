import dotenv from 'dotenv';
import { Dirent } from 'node:fs';
import { File } from '../primitives/file.class';
import { EnvFileTypeError } from '../errors/file-type/env-file-type.error';
import { AbstractTextFile } from '../abstracts/abstract-text-file.class';
import { basename, resolve } from 'path';

export class EnvFile<T extends Record<string, string> = Record<string, string>> extends AbstractTextFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['env'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!EnvFile.isEnvFile(filePath, createNewFile)) {
            throw new EnvFileTypeError(this.name);
        }
    }

    public static isEnvFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return EnvFile.EXTENSIONS.includes(_file.ext) || _file.name === '.env' || _file.fileName === '.env';
    }

    protected override _parse(content: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(content);
            resolve(dotenv.parse(buffer) as T);
        });
    }

    protected override assertDestinationCompatible(destination: string): void {
        const name = basename(resolve(destination)).toLowerCase();

        if (!(name === '.env' || name.startsWith('.env.'))) {
            throw new Error(`EnvFile can only be moved/copied/renamed to .env or .env.* path. Destination: ${destination}`);
        }
    }
}
