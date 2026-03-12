import type { FactoryProvider } from '@nestjs/common';
import { CONFIG_SERVICE, type ConfigService } from '@work-tools/config-service';
import { LoggerService } from '@work-tools/logger-service';
import type { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import { type Connection, connect } from 'mongoose';
import type { MongoDbConnectionConfig } from '../../../@types';
import { MONGO_DB_CONNECTION } from '../../db.constants';

export const mongoDbConnectionProvider: FactoryProvider = {
    inject: [CONFIG_SERVICE, LoggerService],
    provide: MONGO_DB_CONNECTION,
    useFactory: async (config: ConfigService<Record<'mongoDb', MongoDbConnectionConfig>>, logger: LoggerService): Promise<Connection> => {
        const connectionString: Optional<string> = config.getString('mongoDb.connectionUri')!;

        if (isUndefined(connectionString)) {
            throw new Error(`Connection string not set`);
        }

        logger.verbose(`Connecting to MongoDB`);

        const mongoConnection = await connect(connectionString, {
            appName: config.get('mongoDb.appName'),
            autoIndex: true,
            bufferCommands: false,
            connectTimeoutMS: 10000,
            heartbeatFrequencyMS: 5000,
            maxConnecting: 3,
            maxPoolSize: 20,
            minPoolSize: 1,
            readPreference: 'primary',
            retryReads: true,
            retryWrites: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 60000,
            waitQueueTimeoutMS: 15000,
        });

        logger.verbose(`Connected to MongoDB`);

        return mongoConnection.connection;
    },
};
