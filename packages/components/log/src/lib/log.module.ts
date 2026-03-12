import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { LogService } from './log.service';
import { logCollectionProvider } from './providers/log-collection.provider';

@Module({
    controllers: [],
    exports: [logCollectionProvider, LogService],
    imports: [DbModule],
    providers: [logCollectionProvider, LogService],
})
export class LogModule {}
