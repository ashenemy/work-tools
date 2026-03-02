import { Injectable } from '@nestjs/common';
import { AbstractTextFile, EnvFile, TomlFile } from '@work-tools/extra-fs';
import { JsonLike, Optional } from '@work-tools/ts';
import { isDefined, isUndefined, toBoolean, toNumber, toString } from '@work-tools/utils';

@Injectable()
export class ConfigService<T extends JsonLike, K extends keyof T = keyof T> {

    public static async $<T extends JsonLike, K extends keyof T = keyof T>(configFilePath: string): Promise<ConfigService<T, K>> {
        const $ = new ConfigService<T, K>(configFilePath);

        await $.init();

        return $;
    }

    private readonly _configFile: AbstractTextFile<T>;
    private _configData: Optional<T> = undefined;

    protected constructor(configFilePath: string) {
        if (EnvFile.isEnvFile(configFilePath)) {
            this._configFile = new EnvFile<T>(configFilePath);
        } else if (TomlFile.isTomlFile(configFilePath)) {
            this._configFile = new TomlFile<T>(configFilePath);
        } else {
            throw new Error('Invalid config file path');
        }
    }

    public async init(): Promise<void> {
        this._configData = await this._configFile.read();
    }

    public getNumber(key: K, def: number): number;
    public getNumber(key: K): Optional<number>;
    public getNumber(key: K, def?: number): Optional<number> {
        let value: Optional<T[K]>;

        if (isDefined(def)) {
            value = this.get(key, def);
        } else {
            value = this.get(key);
        }

        return toNumber(value);
    }

    public getNumberOrThrow(key: K): number {
        return this._getOrThrow(key, this.getNumber(key));
    }

    public getString(key: K, def: string): string;
    public getString(key: K): Optional<string>;
    public getString(key: K, def?: string): Optional<string> {
        let value: Optional<T[K]>;

        if (isDefined(def)) {
            value = this.get(key, def);
        } else {
            value = this.get(key);
        }

        return toString(value);
    }

    public getStringOrThrow(key: K): string {
        return this._getOrThrow(key, this.getString(key));
    }

    public getBoolean(key: K, def: boolean): boolean;
    public getBoolean(key: K): Optional<boolean>;
    public getBoolean(key: K, def?: boolean): Optional<boolean> {
        let value: Optional<T[K]>;

        if (isDefined(def)) {
            value = this.get(key, def);
        } else {
            value = this.get(key);
        }

        return toBoolean(value);
    }

    public getBooleanOrThrow(key: K): boolean {
        return this._getOrThrow(key, this.getBoolean(key));
    }

    public get(key: K, def: T[K]): T[K];
    public get(key: K): Optional<T[K]>;
    public get(key: K, def?: T[K]): Optional<T[K]> {
        if (isUndefined(this._configData)) {
            throw new Error('ConfigService not initialized');
        }

        const value = this._configData[key];

        if (isDefined(def)) {
            return this._defaultWhenUndefined<T[K]>(value, def);
        }

        return value;
    }

    public getOrThrow(key: K): T[K] {
        return this._getOrThrow(key, this.get(key));
    }

    private _getOrThrow(key: K, value: Optional<T[K]>): T[K] {
        if (isUndefined(value)) {
            throw new Error(`Env key ${String(key)} not found`);
        }

        return value;
    }

    private _defaultWhenUndefined<V>(value: Optional<V>, def: V): V {
        return isDefined(value) ? value : def;
    }
}