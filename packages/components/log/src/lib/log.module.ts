import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { logCollectionProvider } from './providers/log-collection.provider';
import { LogService } from './log.service';

@Module({
    controllers: [],
    imports: [DbModule],
    providers: [logCollectionProvider, LogService],
    exports: [logCollectionProvider, LogService],
})
export class LogModule {}
