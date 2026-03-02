import type { FactoryProvider } from '@nestjs/common';
import { MONGO_DB_CONNECTION } from '../db.constants';
import { LoggerService } from '@work-tools/logger-service';
import { type Connection } from 'mongoose';
import { isDefined } from '@work-tools/utils';
import type { MongoModel, MongoSchema } from '../../@types';
import type { Optional } from '@work-tools/ts';

export function MongoCollectionFactory<T, M = {}>(collectionName: string, schema: MongoSchema<T, M>): FactoryProvider<MongoModel<T, M>> {
    return {
        provide: collectionName,
        useFactory: (connection: Connection, logger: LoggerService): MongoModel<T, M> => {
            schema.set('timestamps', true);
            schema.set('versionKey', false);

            const _model: Optional<MongoModel<T, M>> = connection.models[collectionName];

            if (isDefined(_model)) {
                return _model;
            }

            const newModel: MongoModel<T, M> = connection.model(collectionName, schema, collectionName) as MongoModel<T, M>;

            logger.info(`Mongo collection: ${collectionName}`);

            return newModel;
        },
        inject: [MONGO_DB_CONNECTION, LoggerService],
    };
}