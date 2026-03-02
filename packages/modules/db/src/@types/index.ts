import type { HydratedDocument, Model, Schema } from 'mongoose';

export type MongoDbConnectionConfig = {
    connectionUri: string;
    appName: string;
};

export type MongoDoc<T, M = {}> = HydratedDocument<T, M>;
export type MongoModel<T, M = {}> = Model<MongoDoc<T, M>, {}, M>;
export type MongoSchema<T, M = {}> = Schema<MongoDoc<T, M>, MongoModel<T, M>>
