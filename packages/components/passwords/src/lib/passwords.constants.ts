import { getClickHouseTableToken } from '@work-tools/db-service';

export const PASSWORDS_TABLE = 'passwords';
export const PASSWORDS_TABLE_TOKEN = getClickHouseTableToken(PASSWORDS_TABLE);
