import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@work-tools/config-service';
import { DbModule } from '@work-tools/db-service';
import { LoggerModule } from '@work-tools/logger-service';
import type { ConsoleAppModule, BootstrapImportModule } from '../@types';

@Global()
@Module({})
export class BootstrapModule {
    public static createAppModule(customModules: BootstrapImportModule[] = []): ConsoleAppModule {
        @Module({
            imports: [ConfigModule, DbModule, LoggerModule, ...customModules],
        })
        class AppModule {}

        return AppModule;
    }
}
