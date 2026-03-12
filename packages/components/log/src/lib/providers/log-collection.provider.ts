import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import { Schema } from 'mongoose';
import type { LogEntity } from '../../@types';
import { LOG_COLLECTION } from '../log.constants';

const logSchemaDef: MongoSchemaDef<LogEntity> = {
    analyzeResult: [{ required: true, type: String }],
    archivePath: { required: true, type: String },
    category: { default: null, type: String },
    country: { default: null, type: String },
    file: { ref: 'files', required: true, type: Schema.Types.ObjectId },
    inUser: { default: null, type: Number },
    isMak: { required: true, type: Boolean },
    passCounts: { required: true, type: Number },
    soft: [{ required: true, type: String }],
    three: { default: null, type: Schema.Types.Mixed },
    wallets: [{ required: true, type: String }],
};

export const logCollectionProvider = MongoCollectionFactory<LogEntity>(LOG_COLLECTION, logSchemaDef);
