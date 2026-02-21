import { BaseLogMessage } from '@work-tools/log-message';

export class CleanRunnerStep {
    public static async run(logMessage: BaseLogMessage): Promise<void> {
        const _: CleanRunnerStep = new CleanRunnerStep();
        return await _._run(logMessage);
    }

    private constructor() {}

    private async _run(logMessage: BaseLogMessage): Promise<void> {
        logMessage.logFile?.localFile?.remove();
        await logMessage.remove();
    }
}
