import { Global, Module } from '@nestjs/common';
import { clickHouseDbConnectionProvider } from './providers/clickhouse/clickhouse-db-connection.provider';
import { ClickHouseDbShutdownProvider } from './providers/clickhouse/clickhouse-db-shutdown.provider';
import { mongoDbConnectionProvider } from './providers/mongo/mongo-db-connection.provider';
import { MongoDbShutdownProvider } from './providers/mongo/mongo-db-shutdown.provider';

const providers = [mongoDbConnectionProvider, clickHouseDbConnectionProvider];

@Global()
@Module({
    controllers: [],
    providers: [...providers, MongoDbShutdownProvider, ClickHouseDbShutdownProvider],
    exports: [...providers],
})
export class DbModule {}
