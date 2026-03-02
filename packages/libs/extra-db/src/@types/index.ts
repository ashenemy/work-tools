import { Schema, Model, HydratedDocument, SchemaDefinitionType, SchemaDefinition } from 'mongoose';

export type MongoDoc<T, M = {}> = HydratedDocument<T, M>;
export type MongoModel<T, M = {}> = Model<T, {}, M>;
export type MongoSchema<T, M = {}> = Schema<T, MongoModel<T, M>, M>;
export type MongoSchemaDef<T> = SchemaDefinition<SchemaDefinitionType<T>>;