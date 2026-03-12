import { Inject, Injectable } from '@nestjs/common';
import type { ClickHouseTable } from '@work-tools/db-service';
import type { PasswordEntity, PasswordWriteResult } from '../@types';
import { PASSWORDS_TABLE_TOKEN } from './passwords.constants';

@Injectable()
export class PasswordsService {
    constructor(
        @Inject(PASSWORDS_TABLE_TOKEN)
        private readonly _table: ClickHouseTable<PasswordEntity>,
    ) {}

    public async findOne(url: string, userName: string): Promise<PasswordEntity | null> {
        const rows = await this._table.query(
            `
            SELECT
                url,
                userName,
                password
            FROM passwords
            WHERE url = {url:String}
              AND userName = {userName:String}
            LIMIT 1
            `,
            { url, userName },
        );

        if (rows.length === 0) {
            return null;
        }

        return this._normalizeRecord(rows[0]);
    }

    public async write(payload: PasswordEntity): Promise<PasswordWriteResult> {
        const url = payload.url.trim();
        const userName = payload.userName.trim();
        const incomingPasswords = this._normalizePasswords(payload.password);

        if (url.length === 0 || userName.length === 0 || incomingPasswords.length === 0) {
            return { data: { password: incomingPasswords, url, userName }, inserted: false, skipped: true, updated: false };
        }

        const existed = await this.findOne(url, userName);

        if (!existed) {
            const newData: PasswordEntity = { password: incomingPasswords, url, userName };

            await this._table.insert([newData]);

            return { data: newData, inserted: true, skipped: false, updated: false };
        }

        const mergedPasswords = this._mergePasswords(existed.password, incomingPasswords);

        if (mergedPasswords.length === existed.password.length) {
            return { data: existed, inserted: false, skipped: true, updated: false };
        }

        await this._table.command(
            `
            ALTER TABLE passwords
            UPDATE password = {password:Array(String)}
            WHERE url = {url:String}
              AND userName = {userName:String}
            `,
            { password: mergedPasswords, url, userName },
        );

        return { data: { password: mergedPasswords, url, userName }, inserted: false, skipped: false, updated: true };
    }

    private _normalizeRecord(record: PasswordEntity): PasswordEntity {
        return {
            password: this._normalizePasswords(record.password),
            url: String(record.url).trim(),
            userName: String(record.userName).trim(),
        };
    }

    private _mergePasswords(current: string[], incoming: string[]): string[] {
        const merged = [...current];
        const hasPassword = new Set(current);

        for (const password of incoming) {
            if (hasPassword.has(password)) {
                continue;
            }

            merged.push(password);
            hasPassword.add(password);
        }

        return merged;
    }

    private _normalizePasswords(passwords: string[] | string): string[] {
        const values = Array.isArray(passwords) ? passwords : [passwords];
        const normalized = values.map((password) => String(password).trim()).filter((password) => password.length > 0);

        return Array.from(new Set(normalized));
    }
}
