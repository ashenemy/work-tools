export const MONGO_DB_CONNECTION = Symbol('MONGO_DB_CONNECTION');
export const CLICKHOUSE_DB_CONNECTION = Symbol('CLICKHOUSE_DB_CONNECTION');

export function getClickHouseTableToken(tableName: string): string {
    return `CLICKHOUSE_TABLE:${tableName}`;
}

export function getMongoCollectionToken(collectionName: string): string {
    return `MONGO_COLLECTION:${collectionName.toUpperCase()}`;
}
