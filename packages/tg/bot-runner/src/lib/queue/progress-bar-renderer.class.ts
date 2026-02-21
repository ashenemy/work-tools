import * as cliProgress from 'cli-progress';
import chalk from 'chalk';
import { QueueStatus, StepEvent } from '../../@types';

export class ProgressBarRenderer {
    private multibar: cliProgress.MultiBar;
    private queueBar: cliProgress.SingleBar;
    private taskBar: cliProgress.SingleBar;
    private downloadBar: cliProgress.SingleBar | null = null;

    constructor() {
        this.multibar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            format: ' {bar} {percentage}% | {value}/{total} | {name}',
            barCompleteChar: '█',
            barIncompleteChar: '░',
            autopadding: true,
        });

        this.queueBar = this.multibar.create(100, 0, { name: chalk.cyan('Article queues') });
        this.taskBar = this.multibar.create(100, 0, { name: chalk.magenta('Current task') });
    }

    public update(status: QueueStatus): void {
        const queuePercent = status.total ? Math.floor((status.completed / status.total) * 100) : 0;
        this.queueBar.update(queuePercent, {
            name: chalk.cyan(`Article queues  (${status.completed}/${status.total})`),
        });

        if (status.currentTask) {
            const ct: StepEvent = status.currentTask;

            this.taskBar.update(ct.taskProgress ?? 0, {
                name: chalk.magenta(`Task: ${ct.name || '—'}  |  Step ${ct.stepIndex! + 1}/${ct.totalSteps} — ${ct.stepName}`),
            });

            if (ct.progress !== null && ct.progress !== undefined) {
                if (!this.downloadBar) {
                    this.downloadBar = this.multibar.create(100, 0, { name: chalk.yellow('Downloading') });
                }
                this.downloadBar.update(ct.progress);
            } else if (this.downloadBar) {
                this.downloadBar.stop();
                this.multibar.remove(this.downloadBar);
                this.downloadBar = null;
            }
        } else {
            this.taskBar.update(0, { name: chalk.gray('Waiting for next task...') });

            if (this.downloadBar) {
                this.downloadBar.stop();
                this.multibar.remove(this.downloadBar);
                this.downloadBar = null;
            }

            if (status.completed === status.total && status.total > 0) {
                this.multibar.stop();
                console.log(chalk.green.bold('\n✅ All tasks completed successfully!'));
            }
        }
    }

    public stop(): void {
        this.multibar.stop();
    }
}
