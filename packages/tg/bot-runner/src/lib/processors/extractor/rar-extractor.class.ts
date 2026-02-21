import { AbstractExtractor } from './abstract-extractor.class';
import { createExtractorFromFile } from 'node-unrar-js';

export class RarExtractor extends AbstractExtractor {
    public async extract(): Promise<void> {
        const extractor = await createExtractorFromFile({
            filepath: this.archivePath,
            password: this.password,
            targetPath: this.outputFolder,
        });

        extractor.extract();
    }
}