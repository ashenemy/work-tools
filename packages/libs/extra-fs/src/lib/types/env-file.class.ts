import dotenv from 'dotenv';
import { Dirent } from 'node:fs';
import { File } from '../primitives/file.class';
import { EnvFileTypeError } from '../errors/file-type/env-file-type.error';
import { AbstractTextFile } from '../abstracts/abstract-text-file.class';

export class EnvFile<T extends Record<string, string> = Record<string, string>> extends AbstractTextFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['env'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!EnvFile.isEnvFile(filePath)) {
            throw new EnvFileTypeError(this.name);
        }
    }

    public static isEnvFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return EnvFile.EXTENSIONS.includes(_file.ext) || _file.name === '.env';
    }

    protected override _parse(content: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(content);
            resolve(dotenv.parse(buffer) as T);
        });
    }
}
