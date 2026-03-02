import type { FactoryProvider } from '@nestjs/common';
import { MONGO_DB_CONNECTION } from '../db.constants';
import { LoggerService } from '@work-tools/logger-service';
import { type Connection } from 'mongoose';
import { isDefined } from '@work-tools/utils';
import type { Optional } from '@work-tools/ts';
import { ExSchema, type MongoModel, type MongoSchemaDef } from '@work-tools/extra-db';

export function MongoCollectionFactory<T, M = {}>(collectionName: string, schemaDef: MongoSchemaDef<T>): FactoryProvider<MongoModel<T, M>> {
    return {
        provide: collectionName,
        useFactory: (connection: Connection, logger: LoggerService): MongoModel<T, M> => {
            const _model: Optional<MongoModel<T, M>> = connection.models[collectionName];

            if (isDefined(_model)) {
                return _model;
            }

            const newModel: MongoModel<T, M> = connection.model(collectionName, ExSchema.from<T, M>(schemaDef, collectionName), collectionName) as MongoModel<T, M>;

            logger.info(`Mongo collection: ${collectionName}`);

            return newModel;
        },
        inject: [MONGO_DB_CONNECTION, LoggerService],
    };
}