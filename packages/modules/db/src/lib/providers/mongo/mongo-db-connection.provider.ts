import { MONGO_DB_CONNECTION } from '../../db.constants';
import { LoggerService } from '@work-tools/logger-service';
import { CONFIG_SERVICE, ConfigService } from '@work-tools/config-service';
import type { Optional } from '@work-tools/ts';
import { isUndefined } from '@work-tools/utils';
import { connect, type Connection } from 'mongoose';
import type { FactoryProvider } from '@nestjs/common';
import type { MongoDbConnectionConfig } from '../../../@types';

export const mongoDbConnectionProvider: FactoryProvider = {
    provide: MONGO_DB_CONNECTION,
    useFactory: async (config: ConfigService<Record<'mongoDb', MongoDbConnectionConfig>>, logger: LoggerService): Promise<Connection> => {
        const connectionString: Optional<string> = config.getString('mongoDb.connectionUri')!;

        if (isUndefined(connectionString)) {
            throw new Error(`Connection string not set`);
        }

        logger.verbose(`Connecting to MongoDB`);

        const mongoConnection = await connect(connectionString, {
            appName: config.get('mongoDb.appName'),
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 60000,
            heartbeatFrequencyMS: 5000,
            minPoolSize: 1,
            maxPoolSize: 20,
            maxConnecting: 3,
            waitQueueTimeoutMS: 15000,
            retryReads: true,
            retryWrites: true,
            readPreference: 'primary',
            autoIndex: true,
            bufferCommands: false,
        });

        logger.verbose(`Connected to MongoDB`);

        return mongoConnection.connection;
    },
    inject: [CONFIG_SERVICE, LoggerService],
};
