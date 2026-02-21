import { AbstractExtractor } from './abstract-extractor.class';
import AdmZip from 'adm-zip';

export class ZipExtractor extends AbstractExtractor {
    public async extract(): Promise<void> {
        try {
            const admZip = new AdmZip(this.archivePath);

            admZip.extractAllTo(this.outputFolder, true, true, this.password);
        } catch (e) {
            console.error(e);
        }

    }
}