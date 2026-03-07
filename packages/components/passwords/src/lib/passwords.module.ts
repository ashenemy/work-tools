import { Module } from '@nestjs/common';
import { DbModule } from '@work-tools/db-service';
import { passwordsTableProvider } from './providers/passwords-table.provider';
import { PasswordsService } from './passwords.service';

@Module({
    controllers: [],
    imports: [DbModule],
    providers: [passwordsTableProvider, PasswordsService],
    exports: [passwordsTableProvider, PasswordsService],
})
export class PasswordsModule {}
