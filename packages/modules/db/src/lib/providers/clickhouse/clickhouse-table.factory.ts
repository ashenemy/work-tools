import type { FactoryProvider } from '@nestjs/common';
import type { ClickHouseClient } from '@clickhouse/client';
import { LoggerService } from '@work-tools/logger-service';
import type { ClickHouseQueryParams, ClickHouseTable, ClickHouseTableRow } from '../../../@types';
import { CLICKHOUSE_DB_CONNECTION } from '../../db.constants';
import { getClickHouseTableToken } from '@work-tools/extra-db';

export function ClickHouseTableFactory<T extends ClickHouseTableRow = ClickHouseTableRow>(tableName: string): FactoryProvider<ClickHouseTable<T>> {
    return {
        provide: getClickHouseTableToken(tableName),
        useFactory: (connection: ClickHouseClient, logger: LoggerService): ClickHouseTable<T> => {
            logger.info(`ClickHouse table: ${tableName}`);

            return {
                name: tableName,
                query: async (query: string, queryParams?: ClickHouseQueryParams): Promise<T[]> => {
                    const result = await connection.query({
                        query,
                        query_params: queryParams,
                        format: 'JSONEachRow',
                    });

                    return (await result.json()) as T[];
                },
                command: async (query: string, queryParams?: ClickHouseQueryParams): Promise<void> => {
                    await connection.command({
                        query,
                        query_params: queryParams,
                    });
                },
                insert: async (rows: T[]): Promise<void> => {
                    if (rows.length === 0) {
                        return;
                    }

                    await connection.insert({
                        table: tableName,
                        values: rows,
                        format: 'JSONEachRow',
                    });
                },
            };
        },
        inject: [CLICKHOUSE_DB_CONNECTION, LoggerService],
    };
}
