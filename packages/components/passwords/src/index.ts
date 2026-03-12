export type { PasswordEntity, PasswordWriteResult } from './@types';
export { PASSWORDS_TABLE, PASSWORDS_TABLE_TOKEN } from './lib/passwords.constants';
export { PasswordsModule, PasswordsModule as WorkToolsPasswordsModule } from './lib/passwords.module';
export { PasswordsService } from './lib/passwords.service';
export { passwordsTableProvider } from './lib/providers/passwords-table.provider';
