import { AbstractExtractor } from './abstract-extractor.class';
import { fullArchive } from 'node-7z-archive';

export class SevenZipExtractor extends AbstractExtractor {
    public async extract(): Promise<void> {
        await fullArchive(this.archivePath, this.outputFolder, { p: this.password });
    }
}