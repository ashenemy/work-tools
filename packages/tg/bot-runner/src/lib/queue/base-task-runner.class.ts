import { Task, TaskStep, TaskStepType } from '../../@types';
import { BaseLogMessage } from '@work-tools/log-message';

export class BaseTaskRunner implements Task {
    public name: string;

    constructor(protected readonly logMessage: BaseLogMessage) {
        if (!this.logMessage.isLogMessage) {
            throw new Error(`Is not Log message`);
        }

        this.name = String(this.logMessage.message.id);
    }

    public get steps(): Record<TaskStepType, TaskStep> {
        return {
            share: { name: 'Share log message', type: 'share' as TaskStepType, stepIndex: 0 },
            save: { name: 'Share log message', type: 'save' as TaskStepType, stepIndex: 1 },
            download: { name: 'Share log message', type: 'download' as TaskStepType, stepIndex: 2 },
            extract: { name: 'Share log message', type: 'extract' as TaskStepType, stepIndex: 3 },
            clean: { name: 'Share log message', type: 'clean' as TaskStepType, stepIndex: 4 },
        };
    }

    protected getTaskStep(step: TaskStepType): TaskStep {
        return this.steps[step]!;
    }

    protected getTaskEvent(step: TaskStepType): { step: TaskStep; totalSteps: number } {
        return {
            step: this.getTaskStep(step),
            totalSteps: Object.entries(this.steps).length,
        };
    }
}