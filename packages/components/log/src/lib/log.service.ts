import { Inject, Injectable } from '@nestjs/common';
import { ExCrudService, getMongoCollectionToken, type MongoModel } from '@work-tools/extra-db';
import type { LogEntity } from '../@types';
import { LOG_COLLECTION } from './log.constants';

@Injectable()
export class LogService extends ExCrudService<LogEntity> {
    constructor(
        @Inject(getMongoCollectionToken(LOG_COLLECTION))
        protected override readonly _model: MongoModel<LogEntity>,
    ) {
        super(_model);
    }
}
