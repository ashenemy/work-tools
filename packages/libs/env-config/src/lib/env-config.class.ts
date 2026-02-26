import { Optional } from '@work-tools/ts';
import { configDotenv } from 'dotenv';
import { isDefined, toString,  isUndefined, toNumber, toBoolean } from '@work-tools/utils';
import {resolve} from 'node:path';


export class EnvConfig {
    private static _instance: Optional<EnvConfig> = undefined;
    public static $(root: Optional<string> = undefined): EnvConfig {
        if (!EnvConfig._instance) {
            EnvConfig._instance = new EnvConfig(root);
        }
        return EnvConfig._instance;
    }

    private readonly _configs: Record<string, string> = {};

    private constructor(root: Optional<string> = undefined) {
        const config = configDotenv({
            path: resolve(isUndefined(root) ? process.cwd() : root, '.env'),
        });

        if (isDefined(config.parsed)) {
            this._configs = this._processEnvMerge(config.parsed);
        }

        if (isDefined(config.error)) {
            throw config.error;
        }
    }

    public getNumber(key: string, def: number): number;
    public getNumber(key: string): Optional<number>;
    public getNumber(key: string, def?: number): Optional<number> {
        let value: Optional<number> = toNumber(this._get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined<number>(value, def);
        }

        return value;
    }

    public getNumberOrThrow(key: string): number {
        return this._getOrThrow<number>(key, this.getNumber(key));
    }

    public getString(key: string, def: string): string;
    public getString(key: string): Optional<string>;
    public getString(key: string, def?: string): Optional<string> {
        let value: Optional<string> = toString(this._get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined<string>(value, def);
        }

        return value;
    }

    public getStringOrThrow(key: string): string {
        return this._getOrThrow<string>(key, this.getString(key));
    }

    public getBoolean(key: string, def: boolean): boolean;
    public getBoolean(key: string): Optional<boolean>;
    public getBoolean(key: string, def?: boolean): Optional<boolean> {
        let value: Optional<boolean> = toBoolean(this._get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined<boolean>(value, def);
        }

        return value;
    }

    public getBooleanOrThrow(key: string): boolean {
        return this._getOrThrow<boolean>(key, this.getBoolean(key));
    }

    private _processEnvMerge(env: Record<string, string>): Record<string, string> {
        return {
            ...process.env,
            ...env,
        } as Record<string, string>;
    }

    private _defaultWhenUndefined<T = string>(value: Optional<T>, def: T): T {
        return isUndefined(value) ? def : value;
    }

    private _get(key: string): Optional<string> {
        return this._configs[key];
    }

    private _getOrThrow<T>(key: string, value: Optional<T>): T {
        if (isUndefined(value)) {
            throw new Error(`Env key ${key} not found`);
        }

        return value;
    }
}
