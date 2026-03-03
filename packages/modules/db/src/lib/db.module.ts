import { Global, Module } from '@nestjs/common';
import { mongoDbConnectionProvider } from './providers/mongo-db-connection.provider';
import { MongoDbShutdownProvider } from './providers/mongo-db-shutdown.provider';

const providers = [mongoDbConnectionProvider];

@Global()
@Module({
    controllers: [],
    providers: [...providers, MongoDbShutdownProvider],
    exports: [...providers],
})
export class DbModule {}
