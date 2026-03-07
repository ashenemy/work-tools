import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { filesCollectionProvider } from './providers/files-collection.provider';
import { FilesService } from './files.service';

@Module({
    controllers: [],
    imports: [DbModule],
    providers: [filesCollectionProvider, FilesService],
    exports: [filesCollectionProvider, FilesService],
})
export class FilesModule {}
