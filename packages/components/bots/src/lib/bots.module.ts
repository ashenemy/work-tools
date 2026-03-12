import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { BotsService } from './bots.service';
import { botsCollectionProvider } from './providers/bots-collection.provider';

@Module({
    controllers: [],
    exports: [botsCollectionProvider, BotsService],
    imports: [DbModule],
    providers: [botsCollectionProvider, BotsService],
})
export class BotsModule {}
