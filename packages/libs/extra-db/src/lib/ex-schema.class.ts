import type { MongoSchema, MongoSchemaDef } from '../@types';
import { Schema } from 'mongoose';
import { idTransform } from './utils/id-transform';

export class ExSchema {
    public static from<T, M = {}>(def: MongoSchemaDef<T>, collectionName: string): MongoSchema<T, M> {
        return new Schema(def, {
            timestamps: true,
            versionKey: false,
            collection: collectionName,
            toJSON: {
                virtuals: true,
                versionKey: false,
                transform: idTransform,
            },
            toObject: {
                virtuals: true,
                versionKey: false,
                transform: idTransform,
            },
        }) as MongoSchema<T, M>;
    }
}
