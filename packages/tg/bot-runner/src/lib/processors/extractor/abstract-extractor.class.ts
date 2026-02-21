import { Optional } from '@work-tools/ts';

export abstract class AbstractExtractor  {

    constructor(
        public readonly archivePath: string,
        public outputFolder: string,
        public readonly password: Optional<string> = undefined,
    ) {}

    public abstract extract(): Promise<void>;
}