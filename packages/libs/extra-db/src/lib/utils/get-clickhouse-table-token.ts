export function getClickHouseTableToken(tableName: string): string {
    return `CLICKHOUSE_TABLE:${tableName}`;
}
