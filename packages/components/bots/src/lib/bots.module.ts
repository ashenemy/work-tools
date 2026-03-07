import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { botsCollectionProvider } from './providers/bots-collection.provider';
import { BotsService } from './bots.service';

@Module({
    controllers: [],
    imports: [DbModule],
    providers: [botsCollectionProvider, BotsService],
    exports: [botsCollectionProvider, BotsService],
})
export class BotsModule {}
