import type { ClickHouseClient } from '@clickhouse/client';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { LoggerService } from '@work-tools/logger-service';
import { CLICKHOUSE_DB_CONNECTION } from '../../db.constants';

@Injectable()
export class ClickHouseDbShutdownProvider implements OnModuleDestroy {
    constructor(
        @Inject(CLICKHOUSE_DB_CONNECTION)
        private readonly _clickHouseConnection: ClickHouseClient,
        private readonly _logger: LoggerService,
    ) {}

    public async onModuleDestroy(): Promise<void> {
        this._logger.verbose(`Disconnecting from ClickHouse`);
        await this._clickHouseConnection.close();
        this._logger.verbose(`Disconnected from ClickHouse`);
    }
}
