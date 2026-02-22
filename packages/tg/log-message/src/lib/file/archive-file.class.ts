import {File} from './file.class';
import { extname } from 'path';
import { ArchiveType } from '../../@types';
import { AbstractExtractor, RarExtractor, ZipExtractor, SevenZipExtractor } from '@work-tools/bot-runner';

export class ArchiveFile extends File {
    public get isArchive(): boolean {
        return this.archiveType === 'RAR' || this.archiveType === 'ZIP' || this.archiveType === '7Zip';
    }

    public get archiveType(): ArchiveType {
        const ext = extname(this.fileName);

        switch (ext) {
            case '.rar':
                return 'RAR';
            case '.zip':
                return 'ZIP';
            case '.7z':
                return '7Zip';
            default:
                throw new Error(`Unsupported file type${this.fullPath}`);
        }
    }

    public get outputDir(): string {
        return this.fullPath.replace(extname(this.fileName), '');
    }

    public extractor(password?: string): AbstractExtractor {
        if (!this.isArchive) {
            throw new Error(`File ${this.fullPath} is not archive`);
        }

        switch (this.archiveType) {
            case 'RAR':
                return new RarExtractor(this.fullPath, this.outputDir, password);
            case 'ZIP':
                return new ZipExtractor(this.fullPath, this.outputDir, password);
            case '7Zip':
                return new SevenZipExtractor(this.fullPath, this.outputDir, password);
            default:
                throw new Error(`Unsupported file type${this.fullPath}`);
        }
    }
}