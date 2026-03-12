import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import type { FileEntity } from '../../@types';
import { FILES_COLLECTION } from '../files.constants';

const filesSchemaDef: MongoSchemaDef<FileEntity> = {
    currentStatus: { default: null, enum: ['in-process', 'complete', 'error', 'fatal'], type: String },
    file: {
        extractFilePath: { required: true, type: String },
        fileName: { required: true, type: String },
        filePassword: { default: null, type: String },
        localFilePath: { required: true, type: String },
        mimeType: { required: true, type: String },
        size: { required: true, type: Number },
    },
    step: { default: 'new', enum: ['new', 'download', 'extract', 'analyze'], required: true, type: String },
    tg: {
        messageId: { required: true, type: Number },
        peerAccessHash: { required: true, type: Number },
        peerId: { required: true, type: Number },
    },
};

export const filesCollectionProvider = MongoCollectionFactory<FileEntity>(FILES_COLLECTION, filesSchemaDef);
