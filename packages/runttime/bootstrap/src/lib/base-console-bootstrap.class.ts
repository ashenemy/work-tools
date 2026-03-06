import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import type { ConsoleAppModule, ConsoleBootstrapOptions } from './bootstrap.types';

export abstract class BaseConsoleBootstrap {
    protected readonly _shutdownSignals: NodeJS.Signals[];
    private _context: INestApplicationContext | null = null;

    protected constructor(
        protected readonly _appModule: ConsoleAppModule,
        protected readonly _options: ConsoleBootstrapOptions = {},
    ) {
        this._shutdownSignals = _options.shutdownSignals ?? ['SIGINT', 'SIGTERM'];
    }

    protected get context(): INestApplicationContext {
        if (!this._context) {
            throw new Error('Application context is not initialized');
        }

        return this._context;
    }

    protected get contextOrNull(): INestApplicationContext | null {
        return this._context;
    }

    public async start(): Promise<INestApplicationContext> {
        if (this._context) {
            return this._context;
        }

        this._context = await NestFactory.createApplicationContext(this._appModule, this._options);

        return this._context;
    }

    public async stop(): Promise<void> {
        if (!this._context) {
            return;
        }

        await this._context.close();
        this._context = null;
    }

    protected awaitShutdownSignal(): Promise<NodeJS.Signals> {
        return new Promise((resolve) => {
            const handlers = new Map<NodeJS.Signals, () => void>();

            const detach = (): void => {
                for (const [signal, handler] of handlers) {
                    process.off(signal, handler);
                }
                handlers.clear();
            };

            for (const signal of this._shutdownSignals) {
                const handler = (): void => {
                    detach();
                    resolve(signal);
                };

                handlers.set(signal, handler);
                process.once(signal, handler);
            }
        });
    }

    public abstract run(): Promise<void>;
}
