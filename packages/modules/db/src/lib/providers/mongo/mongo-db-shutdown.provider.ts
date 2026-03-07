import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { Connection } from 'mongoose';
import { MONGO_DB_CONNECTION } from '../../db.constants';

@Injectable()
export class MongoDbShutdownProvider implements OnApplicationShutdown {
    constructor(
        @Inject(MONGO_DB_CONNECTION)
        private readonly _connection: Connection,
    ) {}

    public async onApplicationShutdown(): Promise<void> {
        if (this._connection.readyState !== 0) {
            await this._connection.close();
        }
    }
}
