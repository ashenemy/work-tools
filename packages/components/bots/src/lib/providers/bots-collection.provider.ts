import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import type { BotEntity } from '../../@types';
import { BOTS_COLLECTION } from '../bots.constants';

const botsSchemaDef: MongoSchemaDef<BotEntity> = {
    allowedUsers: [{ required: true, type: String }],
    botName: { required: true, type: String },
};

export const botsCollectionProvider = MongoCollectionFactory<BotEntity>(BOTS_COLLECTION, botsSchemaDef);
