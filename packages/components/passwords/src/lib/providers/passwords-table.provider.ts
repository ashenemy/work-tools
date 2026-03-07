import { ClickHouseTableFactory } from '@work-tools/db-service';
import type { PasswordEntity } from '../../@types';
import { PASSWORDS_TABLE } from '../passwords.constants';

export const passwordsTableProvider = ClickHouseTableFactory<PasswordEntity>(PASSWORDS_TABLE);
