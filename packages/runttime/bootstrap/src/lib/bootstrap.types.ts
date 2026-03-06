import type { ModuleMetadata, Type } from '@nestjs/common';
import type { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';

export type ConsoleAppModule = Type<unknown>;
export type BootstrapImportModule = NonNullable<ModuleMetadata['imports']>[number];

export type ConsoleBootstrapNatsOptions = {
    enabled?: boolean;
    servers?: string[];
    queue?: string;
    name?: string;
};

export type ConsoleBootstrapOptions = NestApplicationContextOptions & {
    shutdownSignals?: NodeJS.Signals[];
    nats?: ConsoleBootstrapNatsOptions;
};
