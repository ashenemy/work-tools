export type MongoDbConnectionConfig = {
    connectionUri: string;
    appName: string;
};

export type ClickHouseDbConnectionConfig = {
    connectionUri: string;
    username: string;
    password: string;
    database: string;
};

export type ClickHouseQueryParams = Record<string, unknown>;

export type ClickHouseTableRow = Record<string, unknown>;

export type ClickHouseTable<T extends ClickHouseTableRow = ClickHouseTableRow> = {
    name: string;
    query: (query: string, queryParams?: ClickHouseQueryParams) => Promise<T[]>;
    command: (query: string, queryParams?: ClickHouseQueryParams) => Promise<void>;
    insert: (rows: T[]) => Promise<void>;
};
