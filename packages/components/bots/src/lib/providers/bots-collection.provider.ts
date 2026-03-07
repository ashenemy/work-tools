import { MongoCollectionFactory } from '@work-tools/db-service';
import type { MongoSchemaDef } from '@work-tools/extra-db';
import type { BotEntity } from '../../@types';
import { BOTS_COLLECTION } from '../bots.constants';

const botsSchemaDef: MongoSchemaDef<BotEntity> = {
    botName: { type: String, required: true },
    allowedUsers: [{ type: String, required: true }],
};

export const botsCollectionProvider = MongoCollectionFactory<BotEntity>(BOTS_COLLECTION, botsSchemaDef);
