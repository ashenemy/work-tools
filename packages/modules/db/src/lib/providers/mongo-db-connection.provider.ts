import { MONGO_DB_CONNECTION } from '../db.constants';
import  { LoggerService } from '@work-tools/logger-service';
import  { ConfigService } from '@work-tools/config-service';
import type { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import mongoose, { connect, ConnectOptions } from 'mongoose';
import type { FactoryProvider } from '@nestjs/common';
import type { MongoDbConnectionConfig } from '../../@types';

export const mongoDbConnectionProvider: FactoryProvider = {
    provide: MONGO_DB_CONNECTION,
    useFactory: async <T extends Record<'mongoDb', MongoDbConnectionConfig>>(config: ConfigService<T>, logger: LoggerService): Promise<typeof mongoose> => {
        const connectionString: Optional<string> = config.getString('mongoDb.connectionUri')!;

        if (isUndefined(connectionString)) {
            throw new Error(`Connection string not set`);
        }

        logger.info(`Connection to mongodb: ${config.getString('mongoDb.connectionUri')}`);

        const connectionOptions: ConnectOptions = config.get('mongoDb.options', {});

        return await connect(connectionString, connectionOptions);
    },
    inject: [ConfigService, LoggerService],
};
