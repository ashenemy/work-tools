import { AbstractExtractor } from './abstract-extractor.class';
import { createExtractorFromFile } from 'node-unrar-js';
import { mkdir } from 'fs/promises';

export class RarExtractor extends AbstractExtractor {
    public async extract(): Promise<void> {
        try {
            await mkdir(this.outputFolder, { recursive: true });
            console.log('this.password', this.password);
            const extractor = await createExtractorFromFile({
                filepath: this.archivePath,
                password: this.password || undefined,
                targetPath: this.outputFolder,
            });

            // Правильный способ распаковки
            const result = extractor.extract({password: this.password});

            for await (const _file of result.files) {}
        } catch (e: any) {
            console.error(`❌ RAR ошибка для ${this.archivePath}`, e.message || e);
            throw e; // важно пробросить ошибку наверх
        }
    }
}
