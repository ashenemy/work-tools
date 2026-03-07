import type { FactoryProvider } from '@nestjs/common';
import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { CONFIG_SERVICE, ConfigService } from '@work-tools/config-service';
import { LoggerService } from '@work-tools/logger-service';
import type { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import type { ClickHouseDbConnectionConfig } from '../../../@types';
import { CLICKHOUSE_DB_CONNECTION } from '../../db.constants';

export const clickHouseDbConnectionProvider: FactoryProvider = {
    provide: CLICKHOUSE_DB_CONNECTION,
    useFactory: async (config: ConfigService<Record<'clickHouse', ClickHouseDbConnectionConfig>>, logger: LoggerService): Promise<ClickHouseClient> => {
        const connectionUri: Optional<string> = config.getString('clickHouse.connectionUri')!;
        const username: Optional<string> = config.getString('clickHouse.username')!;
        const password: Optional<string> = config.getString('clickHouse.password')!;
        const database: Optional<string> = config.getString('clickHouse.database')!;

        if (isUndefined(connectionUri) || isUndefined(username) || isUndefined(password) || isUndefined(database)) {
            throw new Error('ClickHouse connection config is not set');
        }

        logger.verbose(`Connecting to ClickHouse`);

        const clickHouseConnection: ClickHouseClient = createClient({
            url: connectionUri,
            username,
            password,
            database,
        });

        const ping = await clickHouseConnection.ping({
            select: true,
        });

        if (!ping.success) {
            throw ping.error;
        }

        logger.verbose(`Connected to ClickHouse`);

        return clickHouseConnection;
    },
    inject: [CONFIG_SERVICE, LoggerService],
};
