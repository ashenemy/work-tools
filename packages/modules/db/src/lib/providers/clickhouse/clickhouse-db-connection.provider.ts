import { type ClickHouseClient, createClient } from '@clickhouse/client';
import type { FactoryProvider } from '@nestjs/common';
import type { AppConfigToml } from '@work-tools/config-cenerator';
import { CONFIG_SERVICE, type ConfigService } from '@work-tools/config-service';
import { LoggerService } from '@work-tools/logger-service';
import type { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import type { ParsedClickHouseConnectionUri } from '../../../@types';
import { CLICKHOUSE_DB_CONNECTION } from '../../db.constants';

export const clickHouseDbConnectionProvider: FactoryProvider = {
    inject: [CONFIG_SERVICE, LoggerService],
    provide: CLICKHOUSE_DB_CONNECTION,
    useFactory: async (config: ConfigService<AppConfigToml>, logger: LoggerService): Promise<ClickHouseClient> => {
        const connectionUri: Optional<string> = config.getStringOrThrow('clickHouse.connectionUri');

        if (isUndefined(connectionUri)) {
            throw new Error('ClickHouse connectionUri is not set');
        }

        const parsedConnectionUri = _parseClickHouseConnectionUri(connectionUri);

        if (
            isUndefined(parsedConnectionUri.username) ||
            isUndefined(parsedConnectionUri.password) ||
            isUndefined(parsedConnectionUri.database)
        ) {
            throw new Error('ClickHouse connection config is not set');
        }

        logger.verbose(`Connecting to ClickHouse`);

        const clickHouseConnection: ClickHouseClient = createClient({
            database: parsedConnectionUri.database,
            password: parsedConnectionUri.password,
            url: parsedConnectionUri.url,
            username: parsedConnectionUri.username,
        });

        const ping = await clickHouseConnection.ping({ select: true });

        if (!ping.success) {
            throw ping.error;
        }

        logger.verbose(`Connected to ClickHouse`);

        return clickHouseConnection;
    },
};

function _parseClickHouseConnectionUri(connectionUri: string): ParsedClickHouseConnectionUri {
    let uri: URL;

    try {
        uri = new URL(connectionUri);
    } catch {
        throw new Error(`Invalid ClickHouse connectionUri: ${connectionUri}`);
    }

    if (uri.protocol !== 'http:' && uri.protocol !== 'https:' && uri.protocol !== 'clickhouse:') {
        throw new Error(`Unsupported ClickHouse connectionUri protocol: ${uri.protocol}`);
    }

    const url = new URL(uri.toString());

    if (url.protocol === 'clickhouse:') {
        url.protocol = 'http:';

        if (url.port.length === 0 || url.port === '9000') {
            url.port = '8123';
        }
    }

    const username: Optional<string> = uri.username.length > 0 ? decodeURIComponent(uri.username) : undefined;
    const password: Optional<string> = uri.password.length > 0 ? decodeURIComponent(uri.password) : undefined;
    const databaseValue = uri.pathname.replace(/^\/+/, '').trim();
    const database: Optional<string> = databaseValue.length > 0 ? decodeURIComponent(databaseValue) : undefined;

    url.username = '';
    url.password = '';
    url.pathname = '/';
    url.hash = '';

    return { database, password, url: url.toString(), username };
}
