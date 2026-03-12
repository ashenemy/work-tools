import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { PasswordsService } from './passwords.service';
import { passwordsTableProvider } from './providers/passwords-table.provider';

@Module({
    controllers: [],
    exports: [passwordsTableProvider, PasswordsService],
    imports: [DbModule],
    providers: [passwordsTableProvider, PasswordsService],
})
export class PasswordsModule {}
