export type TaskStepType = 'share' | 'save' | 'download' | 'extract' | 'clean';

export type FileDownloadProgress = {
    downloaded: number;
    total: number;
};

export type QueueStatus = {
    total: number;
    completed: number;
    currentTask: StepEvent | null;
};

export type TaskStep = {
    name: string;
    type: TaskStepType;
    stepIndex: number;
};

export type Task = {
    name: string;
    steps?: Record<TaskStepType, TaskStep>;
};

export type StepEvent = {
    step: string | undefined;
    stepIndex: number;
    stepName: string;
    totalSteps: number;
    taskProgress: number;
    progress: number | null;
    name: string;
};