import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_NAME } from './logger.constants';
import { LoggerService } from './logger.service';

@Global()
@Module({})
export class LoggerModule {
    public static forRoot(appName?: string): DynamicModule {
        return {
            module: LoggerModule,
            providers: [
                {
                    provide: APP_NAME,
                    useValue: appName,
                },
                LoggerService,
            ],
            exports: [LoggerService],
        };
    }
}
