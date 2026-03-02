import { Global, Module } from '@nestjs/common';
import { mongoDbConnectionProvider } from './providers/mongo-db-connection.provider';

const providers = [mongoDbConnectionProvider];

@Global()
@Module({
    controllers: [],
    providers: [...providers],
    exports: [...providers],
})
export class DbModule {}
