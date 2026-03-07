import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { BrokerController } from './broker.controller';
import { BROKER_CLIENT, BROKER_DEFAULT_REQUEST_TIMEOUT_MS, BROKER_NATS_OPTIONS } from './broker.constants';
import { BrokerService } from './broker.service';
import type { BrokerModuleOptions, BrokerNatsOptions, BrokerResolvedNatsOptions } from '../@types';

const DEFAULT_NATS_SERVER = 'nats://localhost:4222';
const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

@Global()
@Module({})
export class BrokerModule {
    public static forRoot(options: BrokerModuleOptions = {}): DynamicModule {
        const resolvedNatsOptions = BrokerModule._resolveNatsOptions(options.nats);
        const defaultRequestTimeoutMs = BrokerModule._resolveRequestTimeout(options.defaultRequestTimeoutMs);

        return {
            module: BrokerModule,
            controllers: [BrokerController],
            providers: [
                {
                    provide: BROKER_NATS_OPTIONS,
                    useValue: resolvedNatsOptions,
                },
                {
                    provide: BROKER_DEFAULT_REQUEST_TIMEOUT_MS,
                    useValue: defaultRequestTimeoutMs,
                },
                {
                    provide: BROKER_CLIENT,
                    useFactory: (natsOptions: BrokerResolvedNatsOptions) => {
                        return ClientProxyFactory.create({
                            transport: Transport.NATS,
                            options: natsOptions,
                        });
                    },
                    inject: [BROKER_NATS_OPTIONS],
                },
                BrokerService,
            ],
            exports: [BROKER_NATS_OPTIONS, BROKER_DEFAULT_REQUEST_TIMEOUT_MS, BROKER_CLIENT, BrokerService],
        };
    }

    private static _resolveNatsOptions(options: BrokerNatsOptions | undefined): BrokerResolvedNatsOptions {
        const configuredServers = options?.servers?.map((server) => server.trim()).filter((server) => server.length > 0);
        const servers = configuredServers?.length ? configuredServers : BrokerModule._resolveNatsServersFromEnv();

        return {
            servers,
            queue: options?.queue,
            name: options?.name,
        };
    }

    private static _resolveNatsServersFromEnv(): string[] {
        const envValue = process.env.NATS_SERVERS ?? process.env.NATS_URL ?? DEFAULT_NATS_SERVER;
        const servers = envValue
            .split(',')
            .map((server) => server.trim())
            .filter((server) => server.length > 0);

        return servers.length > 0 ? servers : [DEFAULT_NATS_SERVER];
    }

    private static _resolveRequestTimeout(timeoutMs: number | undefined): number {
        if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
            return DEFAULT_REQUEST_TIMEOUT_MS;
        }

        return timeoutMs;
    }
}
