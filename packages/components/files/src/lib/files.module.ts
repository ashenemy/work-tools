import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { FilesService } from './files.service';
import { filesCollectionProvider } from './providers/files-collection.provider';

@Module({
    controllers: [],
    exports: [filesCollectionProvider, FilesService],
    imports: [DbModule],
    providers: [filesCollectionProvider, FilesService],
})
export class FilesModule {}
