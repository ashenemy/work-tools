import { DynamicModule, Global, Module } from '@nestjs/common';
import { BrokerModule } from '@work-tools/broker-service';
import { LoggerModule } from '@work-tools/logger-service';
import type { QueueEventSubjects, QueueModuleOptions, QueueResolvedOptions } from '../@types';
import { QUEUE_DEFAULT_STORAGE_FILE_PATH, QUEUE_EVENT_SUBJECTS, QUEUE_MODULE_OPTIONS, QUEUE_STATE_STORE } from './queue.constants';
import { QueueService } from './queue.service';
import { QueueFileStateStore } from './utils/queue-file-state-store.class';

@Global()
@Module({})
export class QueueModule {
    public static forRoot(options: QueueModuleOptions = {}): DynamicModule {
        const resolvedOptions = QueueModule._resolveOptions(options);

        return {
            exports: [QUEUE_MODULE_OPTIONS, QUEUE_STATE_STORE, QueueService],
            imports: [LoggerModule.forRoot('queue-service'), BrokerModule.forRoot(resolvedOptions.broker)],
            module: QueueModule,
            providers: [
                { provide: QUEUE_MODULE_OPTIONS, useValue: resolvedOptions },
                {
                    inject: [QUEUE_MODULE_OPTIONS],
                    provide: QUEUE_STATE_STORE,
                    useFactory: (moduleOptions: QueueResolvedOptions) => {
                        return moduleOptions.stateStore ?? new QueueFileStateStore(moduleOptions.stateFilePath);
                    },
                },
                QueueService,
            ],
        };
    }

    private static _resolveOptions(options: QueueModuleOptions): QueueResolvedOptions {
        return {
            autoRestore: options.autoRestore !== false,
            broker: options.broker ?? {},
            eventSubjects: QueueModule._resolveEventSubjects(options.eventSubjects),
            initialQueues: options.initialQueues ?? [],
            stateFilePath: options.stateFilePath ?? QUEUE_DEFAULT_STORAGE_FILE_PATH,
            stateStore: options.stateStore,
            taskHandlers: options.taskHandlers ?? [],
        };
    }

    private static _resolveEventSubjects(subjects?: Partial<QueueEventSubjects>): QueueEventSubjects {
        return {
            queueProgress: subjects?.queueProgress ?? QUEUE_EVENT_SUBJECTS.queueProgress,
            queueRegistry: subjects?.queueRegistry ?? QUEUE_EVENT_SUBJECTS.queueRegistry,
            restoreSummary: subjects?.restoreSummary ?? QUEUE_EVENT_SUBJECTS.restoreSummary,
            taskChanged: subjects?.taskChanged ?? QUEUE_EVENT_SUBJECTS.taskChanged,
            taskError: subjects?.taskError ?? QUEUE_EVENT_SUBJECTS.taskError,
        };
    }
}
