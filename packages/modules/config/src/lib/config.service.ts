import { AbstractTextFile, EnvFile, TomlFile } from '@work-tools/extra-fs';
import { JsonLike, Optional } from '@work-tools/ts';
import { isDefined, isUndefined, toBoolean, toNumber, toString } from '@work-tools/utils';
import type { ConfigPath, ConfigPathValue } from '../@types';

export class ConfigService<T extends JsonLike = {}> {
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

    public static async $<T extends JsonLike>(configFilePath: string): Promise<ConfigService<T>> {
        const $ = new ConfigService<T>(configFilePath);

        await $.init();

        return $;
    }

    public async init(): Promise<void> {
        this._configData = await this._configFile.read();
    }

    public getNumber<K extends ConfigPath<T>>(key: K, def: number): number;
    public getNumber<K extends ConfigPath<T>>(key: K): Optional<number>;
    public getNumber<K extends ConfigPath<T>>(key: K, def?: number): Optional<number> {
        const value = toNumber(this.get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined(value, def);
        }

        return value;
    }

    public getNumberOrThrow<K extends ConfigPath<T>>(key: K): number {
        return this._getOrThrow(key, this.getNumber(key));
    }

    public getString<K extends ConfigPath<T>>(key: K, def: string): string;
    public getString<K extends ConfigPath<T>>(key: K): Optional<string>;
    public getString<K extends ConfigPath<T>>(key: K, def?: string): Optional<string> {
        const value = toString(this.get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined(value, def);
        }

        return value;
    }

    public getStringOrThrow<K extends ConfigPath<T>>(key: K): string {
        return this._getOrThrow(key, this.getString(key));
    }

    public getBoolean<K extends ConfigPath<T>>(key: K, def: boolean): boolean;
    public getBoolean<K extends ConfigPath<T>>(key: K): Optional<boolean>;
    public getBoolean<K extends ConfigPath<T>>(key: K, def?: boolean): Optional<boolean> {
        const value = toBoolean(this.get(key));

        if (isDefined(def)) {
            return this._defaultWhenUndefined(value, def);
        }

        return value;
    }

    public getBooleanOrThrow<K extends ConfigPath<T>>(key: K): boolean {
        return this._getOrThrow(key, this.getBoolean(key));
    }

    public get<K extends ConfigPath<T>>(key: K, def: ConfigPathValue<T, K>): ConfigPathValue<T, K>;
    public get<K extends ConfigPath<T>>(key: K): Optional<ConfigPathValue<T, K>>;
    public get<K extends ConfigPath<T>>(key: K, def?: ConfigPathValue<T, K>): Optional<ConfigPathValue<T, K>> {
        if (isUndefined(this._configData)) {
            throw new Error('ConfigService not initialized');
        }

        const value = this._resolveValue(key);

        if (isDefined(def)) {
            return this._defaultWhenUndefined<ConfigPathValue<T, K>>(value, def);
        }

        return value;
    }

    public getOrThrow<K extends ConfigPath<T>>(key: K): ConfigPathValue<T, K> {
        return this._getOrThrow(key, this.get(key));
    }

    private _getOrThrow<V>(key: string, value: Optional<V>): V {
        if (isUndefined(value)) {
            throw new Error(`Env key ${String(key)} not found`);
        }

        return value;
    }

    private _resolveValue<K extends ConfigPath<T>>(key: K): Optional<ConfigPathValue<T, K>> {
        const parts = String(key).split('.');
        let current: unknown = this._configData;

        for (const part of parts) {
            if (isUndefined(current) || current === null) {
                return undefined;
            }

            if (Array.isArray(current)) {
                const index = Number(part);

                if (!Number.isInteger(index)) {
                    return undefined;
                }

                current = current[index];
                continue;
            }

            if (typeof current !== 'object') {
                return undefined;
            }

            current = (current as Record<string, unknown>)[part];
        }

        return current as Optional<ConfigPathValue<T, K>>;
    }

    private _defaultWhenUndefined<V>(value: Optional<V>, def: V): V {
        return isDefined(value) ? value : def;
    }
}
