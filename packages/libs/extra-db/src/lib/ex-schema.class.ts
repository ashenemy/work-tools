import { Schema } from 'mongoose';
import type { MongoSchema, MongoSchemaDef } from '../@types';
import { idTransform } from './utils/id-transform';

export class ExSchema {
    public static from<T, M = {}>(def: MongoSchemaDef<T>, collectionName: string): MongoSchema<T, M> {
        return new Schema(def, {
            collection: collectionName,
            timestamps: true,
            toJSON: { transform: idTransform, versionKey: false, virtuals: true },
            toObject: { transform: idTransform, versionKey: false, virtuals: true },
            versionKey: false,
        }) as MongoSchema<T, M>;
    }
}
