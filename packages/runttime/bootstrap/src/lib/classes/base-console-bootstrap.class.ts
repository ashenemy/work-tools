import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import type { ConsoleAppModule, ConsoleBootstrapNatsOptions, ConsoleBootstrapOptions } from '../../@types';

type NatsTransportOptions = {
    servers: string[];
    queue?: string;
    name?: string;
};

type NestFactoryContextOptions = Omit<ConsoleBootstrapOptions, 'shutdownSignals' | 'nats'>;

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

        const nestOptions = this._getNestFactoryOptions();

        if (this._options.nats?.enabled === false) {
            this._context = await NestFactory.createApplicationContext(this._appModule, nestOptions);
            return this._context;
        }

        const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(this._appModule, {
            ...nestOptions,
            transport: Transport.NATS,
            options: this._buildNatsTransportOptions(this._options.nats),
        });

        await microservice.listen();
        this._context = microservice;

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

    private _buildNatsTransportOptions(natsOptions: ConsoleBootstrapNatsOptions | undefined): NatsTransportOptions {
        const transportOptions: NatsTransportOptions = {
            servers: this._resolveNatsServers(natsOptions?.servers),
        };

        if (natsOptions?.queue) {
            transportOptions.queue = natsOptions.queue;
        }

        if (natsOptions?.name) {
            transportOptions.name = natsOptions.name;
        }

        return transportOptions;
    }

    private _resolveNatsServers(configuredServers: string[] | undefined): string[] {
        if (configuredServers && configuredServers.length > 0) {
            return configuredServers;
        }

        const envServers = process.env.NATS_SERVERS ?? process.env.NATS_URL ?? 'nats://localhost:4222';
        const resolvedServers = envServers
            .split(',')
            .map((server) => server.trim())
            .filter((server) => server.length > 0);

        if (resolvedServers.length > 0) {
            return resolvedServers;
        }

        return ['nats://localhost:4222'];
    }

    private _getNestFactoryOptions(): NestFactoryContextOptions {
        const options: ConsoleBootstrapOptions = { ...this._options };
        delete (options as Record<string, unknown>).shutdownSignals;
        delete (options as Record<string, unknown>).nats;
        return options;
    }

    public abstract run(): Promise<void>;
}
