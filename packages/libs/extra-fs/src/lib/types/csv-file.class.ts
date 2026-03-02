import type { ExcelSheet } from '../../@types';
import { parseString } from '@fast-csv/parse';
import { Dirent } from 'node:fs';
import { File } from '../primitives/file.class';
import { CsvFileTypeError } from '../errors/file-type/csv-file-type.error';
import { AbstractTextFile } from '../abstracts/abstract-text-file.class';

export class CsvFile<T extends ExcelSheet = Array<Array<any>>> extends AbstractTextFile<T> {
    public static readonly EXTENSIONS: Array<string> = ['csv'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!CsvFile.isCsvFile(filePath)) {
            throw new CsvFileTypeError(this.name);
        }
    }

    public static isCsvFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return CsvFile.EXTENSIONS.includes(_file.ext);
    }

    protected override _parse(content: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const rows: T = [] as unknown as T;

            parseString(content)
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('end', () => {
                    resolve(rows);
                });
        });
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, CsvFile.EXTENSIONS);
    }
}
