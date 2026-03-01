import { ExcelSheet } from '../../@types';
import { AbstractTextFile } from '../abstracts';
import { parseString } from '@fast-csv/parse';
import { Dirent } from 'node:fs';
import { File } from '../primitives';
import { CsvFileTypeError } from '../errors';

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
        return CsvFile.EXTENSIONS.includes(_file.ext) || _file.name === '.env';
    }

    protected override _parse(content: string): Promise<T> {
        return new Promise((resolve, reject) => {
            parseString(content)
                .on('data', (row) => {
                    resolve(row);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }
}
