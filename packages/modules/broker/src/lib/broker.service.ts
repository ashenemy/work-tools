import { Inject, Injectable, OnApplicationShutdown, Optional as Optional_ } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, RpcException, Transport } from '@nestjs/microservices';
import type { AppConfigToml } from '@work-tools/config-cenerator';
import { CONFIG_SERVICE, ConfigService } from '@work-tools/config-service';
import { defaultIfEmpty, firstValueFrom, TimeoutError, timeout } from 'rxjs';
import type { BrokerModuleOptions, BrokerResolvedNatsOptions } from '../@types';
import { BROKER_MODULE_OPTIONS } from './broker.constants';

const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class BrokerService implements OnApplicationShutdown {
    private _client: ClientProxy | null = null;
    private _connectionPromise: Promise<void> | null = null;

    constructor(
        @Inject(CONFIG_SERVICE)
        private readonly _configService: ConfigService<AppConfigToml>,
        @Optional_()
        @Inject(BROKER_MODULE_OPTIONS)
        private readonly _options?: BrokerModuleOptions,
    ) {}

    public getClientOptions(): BrokerResolvedNatsOptions {
        return { name: this._options?.nats?.name, queue: this._options?.nats?.queue, server: this.getServer() };
    }

    public getServer(): string {
        return this._configService.getStringOrThrow('nats.server');
    }

    public async onApplicationShutdown(): Promise<void> {
        this._connectionPromise = null;

        if (!this._client) {
            return;
        }

        await this._client.close();
        this._client = null;
    }

    public async emit<TPayload = unknown>(subject: string, payload: TPayload): Promise<void> {
        const client = await this._getClient();
        await firstValueFrom(client.emit<void, TPayload>(subject, payload).pipe(defaultIfEmpty(undefined)));
    }

    public async request<TResponse = unknown, TPayload = unknown>(
        subject: string,
        payload: TPayload,
        timeoutMs?: number,
    ): Promise<TResponse> {
        const client = await this._getClient();
        const requestTimeoutMs = this._resolveRequestTimeout(timeoutMs);

        try {
            return await firstValueFrom(client.send<TResponse, TPayload>(subject, payload).pipe(timeout({ first: requestTimeoutMs })));
        } catch (error) {
            if (error instanceof TimeoutError) {
                throw new RpcException(`Broker request timeout for subject "${subject}" after ${requestTimeoutMs}ms`);
            }

            throw error;
        }
    }

    private async _getClient(): Promise<ClientProxy> {
        if (!this._client) {
            const { server, queue, name } = this.getClientOptions();

            this._client = ClientProxyFactory.create({ options: { name, queue, servers: [server] }, transport: Transport.NATS });
        }

        await this._ensureConnected();

        return this._client;
    }

    private async _ensureConnected(): Promise<void> {
        if (!this._client) {
            throw new Error('Broker client is not initialized');
        }

        if (!this._connectionPromise) {
            this._connectionPromise = this._client.connect().catch((error: unknown) => {
                this._connectionPromise = null;
                throw error;
            });
        }

        await this._connectionPromise;
    }

    private _resolveRequestTimeout(timeoutMs?: number): number {
        const value = timeoutMs ?? this._options?.defaultRequestTimeoutMs;

        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
            return DEFAULT_REQUEST_TIMEOUT_MS;
        }

        return value;
    }
}
