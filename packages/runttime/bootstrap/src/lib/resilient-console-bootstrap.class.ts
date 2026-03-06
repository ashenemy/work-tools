import type { ConsoleAppModule, ConsoleBootstrapOptions } from './bootstrap.types';
import { GracefulConsoleBootstrap } from './graceful-console-bootstrap.class';

export class ResilientConsoleBootstrap extends GracefulConsoleBootstrap {
    private _isStopping = false;
    private readonly _onUnhandledRejection = (reason: unknown): void => {
        void this._handleFatal(reason);
    };
    private readonly _onUncaughtException = (error: unknown): void => {
        void this._handleFatal(error);
    };

    constructor(appModule: ConsoleAppModule, options: ConsoleBootstrapOptions = {}) {
        super(appModule, options);
    }

    public override async run(): Promise<void> {
        this._attachFatalHandlers();

        try {
            await super.run();
        } finally {
            this._detachFatalHandlers();
        }
    }

    private _attachFatalHandlers(): void {
        process.on('unhandledRejection', this._onUnhandledRejection);
        process.on('uncaughtException', this._onUncaughtException);
    }

    private _detachFatalHandlers(): void {
        process.off('unhandledRejection', this._onUnhandledRejection);
        process.off('uncaughtException', this._onUncaughtException);
    }

    private async _handleFatal(error: unknown): Promise<void> {
        if (this._isStopping) {
            return;
        }

        this._isStopping = true;
        process.exitCode = 1;
        console.error(error);
        await this.stop();
        process.kill(process.pid, 'SIGTERM');
    }
}
