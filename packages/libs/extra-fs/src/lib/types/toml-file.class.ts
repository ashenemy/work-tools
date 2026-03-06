import type { JsonLike } from '@work-tools/ts';
import TOML from '@iarna/toml';
import { Dirent } from 'node:fs';
import { AbstractTextFile } from '../abstracts/abstract-text-file.class';
import { TomlFileTypeError } from '../errors/file-type/toml-file-type.error';
import { File } from '../primitives/file.class';

export class TomlFile<T extends JsonLike = {}> extends AbstractTextFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['toml'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!TomlFile.isTomlFile(filePath, createNewFile)) {
            throw new TomlFileTypeError(this.name);
        }
    }

    public static isTomlFile(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return TomlFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _parse(content: string): Promise<T> {
        return Promise.resolve(TOML.parse(content) as T);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, TomlFile.EXTENSIONS);
    }
}
