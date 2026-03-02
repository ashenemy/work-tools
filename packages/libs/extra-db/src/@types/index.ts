import type { HydratedDocument, InsertManyOptions, Model, ProjectionType, QueryOptions, SaveOptions, Schema, SchemaDefinition, SchemaDefinitionType, UpdateQuery } from 'mongoose';

export type MongoDoc<T, M = {}> = HydratedDocument<T, M>;
export type MongoModel<T, M = {}> = Model<T, {}, M>;
export type MongoSchema<T, M = {}> = Schema<T, MongoModel<T, M>, M>;
export type MongoSchemaDef<T> = SchemaDefinition<SchemaDefinitionType<T>>;
export type MongoId<T, M = {}> = MongoDoc<T, M>['_id'];
export type MongoFilter<T> = Partial<T> & Record<string, unknown>;
export type MongoProjection<T> = ProjectionType<T>;
export type MongoQueryOptions<T> = QueryOptions<T>;
export type MongoUpdate<T> = UpdateQuery<T>;
export type MongoCreate<T> = Omit<T, '_id' | 'id' | 'createdAt' | 'updatedAt'>;
export type MongoInsertOptions = InsertManyOptions;
export type MongoSaveOptions = SaveOptions;
