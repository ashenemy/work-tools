import { Global, Module } from '@nestjs/common';
import { JsonLike } from '@work-tools/ts';
import { CONFIG_SERVICE } from './config.constants';
import { ConfigService } from './config.service';

@Global()
@Module({})
export class ConfigModule {
    public static forRoot<T extends JsonLike>(configFilePath: string) {
        return {
            exports: [CONFIG_SERVICE],
            module: ConfigModule,
            providers: [
                {
                    provide: CONFIG_SERVICE,
                    useFactory: async () => {
                        return await ConfigService.$<T>(configFilePath);
                    },
                },
            ],
        };
    }
}
