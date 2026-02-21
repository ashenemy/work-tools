import { BaseLogMessage } from '@work-tools/log-message';
import { Optional } from '@work-tools/ts';

export class SaveRunnerStep {
    public static async run(logMessage: BaseLogMessage): Promise<Optional<BaseLogMessage>> {
        const _: SaveRunnerStep = new SaveRunnerStep();

        return await _._run(logMessage);
    }

    private constructor() {}

    private async _run(logMessage: BaseLogMessage): Promise<Optional<BaseLogMessage>> {
        if (logMessage.haveFile) {
            return await logMessage.forwardTo('me');
        }

        return undefined;
    }
}
