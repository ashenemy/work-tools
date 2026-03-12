import { Inject, Injectable } from '@nestjs/common';
import { getMongoCollectionToken } from '@work-tools/db-service';
import { ExCrudService, type MongoModel } from '@work-tools/extra-db';
import type { BotEntity } from '../@types';
import { BOTS_COLLECTION } from './bots.constants';

@Injectable()
export class BotsService extends ExCrudService<BotEntity> {
    constructor(
        @Inject(getMongoCollectionToken(BOTS_COLLECTION))
        protected override readonly _model: MongoModel<BotEntity>,
    ) {
        super(_model);
    }
}
