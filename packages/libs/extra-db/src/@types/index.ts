import { Schema, Model, HydratedDocument, SchemaDefinitionType, SchemaDefinition } from 'mongoose';

export type MongoDoc<T, M = {}> = HydratedDocument<T, M>;
export type MongoModel<T, M = {}> = Model<MongoDoc<T, M>, {}, M>;
export type MongoSchema<T, M = {}> = Schema<MongoDoc<T, M>, MongoModel<T, M>>;
export type MongoSchemaDef<T> = SchemaDefinition<SchemaDefinitionType<T>>;