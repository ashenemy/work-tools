import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import type { FileEntity } from '../../@types';
import { FILES_COLLECTION } from '../files.constants';

const filesSchemaDef: MongoSchemaDef<FileEntity> = {
    tg: {
        messageId: { type: Number, required: true },
        peerId: { type: Number, required: true },
        peerAccessHash: { type: Number, required: true },
    },
    file: {
        fileName: { type: String, required: true },
        size: { type: Number, required: true },
        filePassword: { type: String, default: null },
        mimeType: { type: String, required: true },
        localFilePath: { type: String, required: true },
        extractFilePath: { type: String, required: true },
    },
    step: {
        type: String,
        enum: ['new', 'download', 'extract', 'analyze'],
        default: 'new',
        required: true,
    },
    currentStatus: {
        type: String,
        enum: ['in-process', 'complete', 'error', 'fatal'],
        default: null,
    },
};

export const filesCollectionProvider = MongoCollectionFactory<FileEntity>(FILES_COLLECTION, filesSchemaDef);
