import { Inject, Injectable } from '@nestjs/common';
import { ExCrudService, getMongoCollectionToken, type MongoModel } from '@work-tools/extra-db';
import type { FileEntity } from '../@types';
import { FILES_COLLECTION } from './files.constants';

@Injectable()
export class FilesService extends ExCrudService<FileEntity> {
    constructor(
        @Inject(getMongoCollectionToken(FILES_COLLECTION))
        protected override readonly _model: MongoModel<FileEntity>,
    ) {
        super(_model);
    }
}
