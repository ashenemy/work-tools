import _7z, { getConfig, ListItem } from '7zip-min';
import { ArchiveFile } from '../archive-file.class';
import { isDefined, isType, isUndefined } from '@work-tools/utils';
import { execa } from 'execa';
import { Observable, Subject } from 'rxjs';
import { Progress } from '@work-tools/taskqueue';
import { WrongPasswordArchiveError } from '../../errors/archive/wrong-password-archive.error';
import { parse7zError } from './parse-7z-error.class';

export class ArchiveExtractor {
    private readonly _progress$: Subject<Progress> = new Subject();

    constructor(private readonly _archive: ArchiveFile) {}

    public get process$(): Observable<Progress> {
        return this._progress$.asObservable();
    }

    private get _binaryPath(): string {
        const binaryPath = getConfig().binaryPath;

        if (isUndefined(binaryPath)) {
            throw new Error('7zip binary path is not configured');
        }

        return binaryPath;
    }

    private get _errorContext() {
        return {
            archivePath: this._archive.absPath,
            isMultipart: this._archive.isPart,
            missingHint: this._archive.globPattern ?? this._archive.entryFileName ?? this._archive.name,
        };
    }

    public async listFiles(): Promise<string[]> {
        const allFiles = await this._getArchiveList();

        return allFiles
            .filter((item) => item.attr && !item.attr.includes('D'))
            .map((item) => item.name);
    }

    public async test(): Promise<void> {
        try {
            await this._testArchive();
        } catch (e) {
            if (isType(e, WrongPasswordArchiveError)) {
                const newPassword = this._archive.setNextPassword();
                if (isDefined(newPassword)) {
                    await this.test();
                } else {
                    throw e;
                }
            } else {
                throw e;
            }
        }
    }

    public async extract(): Promise<void> {
        await this._archive.extractPath.ensure();

        const args = ['x', this._archive.absPath, `-o${this._archive.extractPath.absPath}`, '-aoa'];
        if (isDefined(this._archive.password)) {
            args.push(`-p${this._archive.password}`);
        }

        const total = (await this.listFiles()).length;
        const proc = execa(this._binaryPath, args, { reject: false });

        proc.stdout?.on('data', (data: Buffer) => {
            const line = data.toString();
            const match = line.match(/(\d+)%/);

            if (match && total > 0) {
                const percent = parseInt(match[1], 10);
                const success = Math.round((percent / 100) * total);
                this._progress$.next({ total, success });
            }
        });

        const result = await proc;

        if (result.exitCode !== 0) {
            try {
                parse7zError(
                    {
                        message: result.shortMessage ?? `7-zip exited with code ${result.exitCode}.`,
                        stdout: result.stdout,
                        stderr: result.stderr,
                        code: result.exitCode,
                    },
                    this._errorContext
                );
            } catch (err) {
                this._progress$.error(err as Error);
                throw err;
            }
        }

        this._progress$.complete();
    }

    private async _testArchive(): Promise<boolean> {
        const args = this._archive.password
            ? ['t', this._archive.absPath, `-p${this._archive.password}`]
            : ['t', this._archive.absPath];

        try {
            await _7z.cmd(args);
            return true;
        } catch (e) {
            parse7zError(e, this._errorContext);
        }
    }

    private async _getArchiveList(): Promise<ListItem[]> {
        const args = this._archive.password
            ? ['l', '-slt', this._archive.absPath, `-p${this._archive.password}`]
            : ['l', '-slt', this._archive.absPath];

        try {
            return (await _7z.cmd(args)) as unknown as ListItem[];
        } catch (e) {
            parse7zError(e, this._errorContext);
        }
    }
}
