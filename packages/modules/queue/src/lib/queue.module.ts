import { DynamicModule, Global, Module } from '@nestjs/common';
import { BrokerModule } from '@work-tools/broker-service';
import { LoggerModule } from '@work-tools/logger-service';
import { QUEUE_DEFAULT_STORAGE_FILE_PATH, QUEUE_EVENT_SUBJECTS, QUEUE_MODULE_OPTIONS, QUEUE_STATE_STORE } from './queue.constants';
import { QueueFileStateStore } from './utils/queue-file-state-store.class';
import { QueueService } from './queue.service';
import type { QueueEventSubjects, QueueModuleOptions, QueueResolvedOptions } from '../@types';

@Global()
@Module({})
export class QueueModule {
    public static forRoot(options: QueueModuleOptions = {}): DynamicModule {
        const resolvedOptions = QueueModule._resolveOptions(options);

        return {
            module: QueueModule,
            imports: [LoggerModule.forRoot('queue-service'), BrokerModule.forRoot(resolvedOptions.broker)],
            providers: [
                {
                    provide: QUEUE_MODULE_OPTIONS,
                    useValue: resolvedOptions,
                },
                {
                    provide: QUEUE_STATE_STORE,
                    useFactory: (moduleOptions: QueueResolvedOptions) => {
                        return moduleOptions.stateStore ?? new QueueFileStateStore(moduleOptions.stateFilePath);
                    },
                    inject: [QUEUE_MODULE_OPTIONS],
                },
                QueueService,
            ],
            exports: [QUEUE_MODULE_OPTIONS, QUEUE_STATE_STORE, QueueService],
        };
    }

    private static _resolveOptions(options: QueueModuleOptions): QueueResolvedOptions {
        return {
            autoRestore: options.autoRestore !== false,
            eventSubjects: QueueModule._resolveEventSubjects(options.eventSubjects),
            initialQueues: options.initialQueues ?? [],
            taskHandlers: options.taskHandlers ?? [],
            stateStore: options.stateStore,
            stateFilePath: options.stateFilePath ?? QUEUE_DEFAULT_STORAGE_FILE_PATH,
            broker: options.broker ?? {},
        };
    }

    private static _resolveEventSubjects(subjects?: Partial<QueueEventSubjects>): QueueEventSubjects {
        return {
            taskChanged: subjects?.taskChanged ?? QUEUE_EVENT_SUBJECTS.taskChanged,
            taskError: subjects?.taskError ?? QUEUE_EVENT_SUBJECTS.taskError,
            queueProgress: subjects?.queueProgress ?? QUEUE_EVENT_SUBJECTS.queueProgress,
            queueRegistry: subjects?.queueRegistry ?? QUEUE_EVENT_SUBJECTS.queueRegistry,
            restoreSummary: subjects?.restoreSummary ?? QUEUE_EVENT_SUBJECTS.restoreSummary,
        };
    }
}
