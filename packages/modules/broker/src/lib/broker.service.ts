import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { defaultIfEmpty, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { BROKER_CLIENT, BROKER_DEFAULT_REQUEST_TIMEOUT_MS } from './broker.constants';

@Injectable()
export class BrokerService implements OnApplicationBootstrap, OnApplicationShutdown {
    private _connectionPromise: Promise<void> | null = null;

    constructor(
        @Inject(BROKER_CLIENT)
        private readonly _client: ClientProxy,
        @Inject(BROKER_DEFAULT_REQUEST_TIMEOUT_MS)
        private readonly _defaultRequestTimeoutMs: number,
    ) {}

    public async onApplicationBootstrap(): Promise<void> {
        await this._ensureConnected();
    }

    public async onApplicationShutdown(): Promise<void> {
        this._connectionPromise = null;
        await this._client.close();
    }

    public async emit<TPayload = unknown>(subject: string, payload: TPayload): Promise<void> {
        await this._ensureConnected();

        await firstValueFrom(this._client.emit<void, TPayload>(subject, payload).pipe(defaultIfEmpty(undefined)));
    }

    public async request<TResponse = unknown, TPayload = unknown>(subject: string, payload: TPayload, timeoutMs?: number): Promise<TResponse> {
        await this._ensureConnected();

        const requestTimeoutMs = timeoutMs ?? this._defaultRequestTimeoutMs;

        try {
            return await firstValueFrom(this._client.send<TResponse, TPayload>(subject, payload).pipe(timeout({ first: requestTimeoutMs })));
        } catch (error) {
            if (error instanceof TimeoutError) {
                throw new RpcException(`Broker request timeout for subject "${subject}" after ${requestTimeoutMs}ms`);
            }

            throw error;
        }
    }

    private async _ensureConnected(): Promise<void> {
        if (!this._connectionPromise) {
            this._connectionPromise = this._client.connect().catch((error: unknown) => {
                this._connectionPromise = null;
                throw error;
            });
        }

        await this._connectionPromise;
    }
}
