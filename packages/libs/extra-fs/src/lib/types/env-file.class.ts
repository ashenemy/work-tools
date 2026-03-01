import { AbstractTextFile } from '../abstracts';
import dotenv from 'dotenv';
import { Dirent } from 'node:fs';
import { File } from '../primitives';
import { EnvFileTypeError } from '../errors';

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
