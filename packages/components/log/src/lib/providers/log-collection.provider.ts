import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import { Schema } from 'mongoose';
import type { LogEntity } from '../../@types';
import { LOG_COLLECTION } from '../log.constants';

const logSchemaDef: MongoSchemaDef<LogEntity> = {
    country: { type: String, default: null },
    isMak: { type: Boolean, required: true },
    file: { type: Schema.Types.ObjectId, ref: 'files', required: true },
    archivePath: { type: String, required: true },
    soft: [{ type: String, required: true }],
    wallets: [{ type: String, required: true }],
    passCounts: { type: Number, required: true },
    analyzeResult: [{ type: String, required: true }],
    category: { type: String, default: null },
    three: { type: Schema.Types.Mixed, default: null },
    inUser: { type: Number, default: null },
};

export const logCollectionProvider = MongoCollectionFactory<LogEntity>(LOG_COLLECTION, logSchemaDef);
