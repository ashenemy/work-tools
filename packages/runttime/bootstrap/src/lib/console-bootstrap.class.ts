import type { ConsoleAppModule, ConsoleBootstrapOptions } from './bootstrap.types';
import { BaseConsoleBootstrap } from './base-console-bootstrap.class';

export class ConsoleBootstrap extends BaseConsoleBootstrap {
    constructor(appModule: ConsoleAppModule, options: ConsoleBootstrapOptions = {}) {
        super(appModule, options);
    }

    public override async run(): Promise<void> {
        await this.start();
    }
}
