import { DynamicModule, Global, Module } from '@nestjs/common';
import type { BrokerModuleOptions } from '../@types';
import { BROKER_MODULE_OPTIONS } from './broker.constants';
import { BrokerService } from './broker.service';

@Global()
@Module({ exports: [BrokerService], providers: [BrokerService] })
export class BrokerModule {
    public static forRoot(options: BrokerModuleOptions = {}): DynamicModule {
        return {
            exports: [BROKER_MODULE_OPTIONS, BrokerService],
            module: BrokerModule,
            providers: [{ provide: BROKER_MODULE_OPTIONS, useValue: options }],
        };
    }
}
