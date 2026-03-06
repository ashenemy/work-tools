import type { MongoCreate, MongoDoc, MongoFilter, MongoId, MongoInsertOptions, MongoModel, MongoQueryOptions, MongoSaveOptions, MongoUpdate } from '../@types';
import { NotFoundException } from '@nestjs/common';

export class ExCrudService<T extends object, M = {}> {
    constructor(protected readonly _model: MongoModel<T, M>) {}

    public get model(): MongoModel<T, M> {
        return this._model;
    }

    public async create(payload: MongoCreate<T>, options?: MongoSaveOptions): Promise<MongoDoc<T, M>> {
        const doc = new this._model(payload);
        return (await doc.save(options)) as MongoDoc<T, M>;
    }

    public async createMany(payloads: MongoCreate<T>[], options?: MongoInsertOptions): Promise<MongoDoc<T, M>[]> {
        if (options) {
            return (await this._model.insertMany(payloads, options)) as unknown as MongoDoc<T, M>[];
        }

        return (await this._model.insertMany(payloads)) as unknown as MongoDoc<T, M>[];
    }

    public async findById(id: MongoId<T, M>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model.findById(id, null, options).exec()) as MongoDoc<T, M> | null;
    }

    public async findByIdOrThrow(id: MongoId<T, M>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M>> {
        const doc = await this.findById(id, options);
        return this._ensureFound(doc, `Document not found by id: ${String(id)}`);
    }

    public async findOne(filter: MongoFilter<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model.findOne(filter, null, options).exec()) as MongoDoc<T, M> | null;
    }

    public async findOneOrThrow(filter: MongoFilter<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M>> {
        const doc = await this.findOne(filter, options);
        return this._ensureFound(doc, `Document not found in ${this._model.collection.name}`);
    }

    public async findMany(filter: MongoFilter<T> = {}, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M>[]> {
        return (await this._model.find(filter, null, options).exec()) as MongoDoc<T, M>[];
    }

    public async findAll(options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M>[]> {
        return await this.findMany({}, options);
    }

    public async exists(filter: MongoFilter<T>): Promise<boolean> {
        return (await this._model.exists(filter)) !== null;
    }

    public async count(filter: MongoFilter<T> = {}): Promise<number> {
        return await this._model.countDocuments(filter).exec();
    }

    public async updateById(id: MongoId<T, M>, update: MongoUpdate<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model
            .findByIdAndUpdate(id, update, {
                ...options,
                new: options.new ?? true,
                runValidators: options.runValidators ?? true,
            })
            .exec()) as MongoDoc<T, M> | null;
    }

    public async updateOne(filter: MongoFilter<T>, update: MongoUpdate<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model
            .findOneAndUpdate(filter, update, {
                ...options,
                new: options.new ?? true,
                runValidators: options.runValidators ?? true,
            })
            .exec()) as MongoDoc<T, M> | null;
    }

    public async upsertOne(filter: MongoFilter<T>, update: MongoUpdate<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M>> {
        const doc = (await this._model
            .findOneAndUpdate(filter, update, {
                ...options,
                upsert: true,
                new: true,
                runValidators: options.runValidators ?? true,
            })
            .exec()) as MongoDoc<T, M> | null;

        return this._ensureFound(doc, `Failed to upsert document in ${this._model.collection.name}`);
    }

    public async deleteById(id: MongoId<T, M>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model.findByIdAndDelete(id, options).exec()) as MongoDoc<T, M> | null;
    }

    public async deleteOne(filter: MongoFilter<T>, options: MongoQueryOptions<T> = {}): Promise<MongoDoc<T, M> | null> {
        return (await this._model.findOneAndDelete(filter, options).exec()) as MongoDoc<T, M> | null;
    }

    public async deleteMany(filter: MongoFilter<T> = {}): Promise<number> {
        const result = await this._model.deleteMany(filter).exec();
        return result.deletedCount ?? 0;
    }

    private _ensureFound<V>(value: V | null, message: string): V {
        if (value === null) {
            throw new NotFoundException(message);
        }

        return value;
    }
}
