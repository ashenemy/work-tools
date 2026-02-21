import { ArchiveFile } from '@work-tools/log-message';

export class ExtractRunnerStep {
    public static async run(archive: ArchiveFile, password?: string): Promise<string> {
        const _: ExtractRunnerStep = new ExtractRunnerStep();

        return await _._run(archive, password);
    }

    private async _run(archive: ArchiveFile, password?: string): Promise<string> {
        const extractor = archive.extractor(password);

        await extractor.extract();

        return extractor.outputFolder;
    }
}
