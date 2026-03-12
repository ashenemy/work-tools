import type { ClickHouseClient } from '@clickhouse/client';
import type { FactoryProvider } from '@nestjs/common';
import { LoggerService } from '@work-tools/logger-service';
import type { ClickHouseQueryParams, ClickHouseTable, ClickHouseTableRow } from '../../../@types';
import { CLICKHOUSE_DB_CONNECTION, getClickHouseTableToken } from '../../db.constants';

export function ClickHouseTableFactory<T extends ClickHouseTableRow = ClickHouseTableRow>(
    tableName: string,
): FactoryProvider<ClickHouseTable<T>> {
    return {
        inject: [CLICKHOUSE_DB_CONNECTION, LoggerService],
        provide: getClickHouseTableToken(tableName),
        useFactory: (connection: ClickHouseClient, logger: LoggerService): ClickHouseTable<T> => {
            logger.info(`ClickHouse table: ${tableName}`);

            return {
                command: async (query: string, queryParams?: ClickHouseQueryParams): Promise<void> => {
                    await connection.command({ query, query_params: queryParams });
                },
                insert: async (rows: T[]): Promise<void> => {
                    if (rows.length === 0) {
                        return;
                    }

                    await connection.insert({ format: 'JSONEachRow', table: tableName, values: rows });
                },
                name: tableName,
                query: async (query: string, queryParams?: ClickHouseQueryParams): Promise<T[]> => {
                    const result = await connection.query({ format: 'JSONEachRow', query, query_params: queryParams });

                    return (await result.json()) as T[];
                },
            };
        },
    };
}
