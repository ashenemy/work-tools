import _7z from '7zip-min';
import { ArchiveFile } from '../archive-file.class';
import { isDefined, isType } from '@work-tools/utils';
import { execa } from 'execa';
import { Observable, Subject } from 'rxjs';
import { Progress } from '@work-tools/taskqueue';
import { WrongPasswordArchiveError } from '../../errors/archive/wrong-password-archive.error';
import { CorruptedArchiveError } from '../../errors/archive/corrupted-archive.error';
import { MissingArchivePartError } from '../../errors/archive/missing-archive-part.error';
import { UnknownArchiveError } from '../../errors/archive/unknown-archive.error';

export class ArchiveExtractor {
    private readonly _progress$: Subject<Progress> = new Subject();
    constructor(private readonly _archive: ArchiveFile) {}

    public get process$(): Observable<Progress> {
        return this._progress$.asObservable();
    }

    public async listFiles(): Promise<string[]> {
        const args = this._archive.password ? ['l', '-slt', this._archive.absPath, `-p${this._archive.password}`] : ['l', '-slt', this._archive.absPath];
        const output = await _7z.cmd(args);

        const files: string[] = [];
        let inList = false;

        for (const line of output.split('\n')) {
            if (line.includes('----------')) {
                inList = !inList;
                continue;
            }
            if (inList && line.startsWith('Path = ')) {
                const p = line.slice(7).trim();
                if (p && !p.endsWith('/')) files.push(p);
            }
        }
        return files;
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

    async extract(): Promise<void> {
        await this._archive.extractPath.ensure();

        const args = ['x', this._archive.absPath, `-o${this._archive.extractPath}`, '-aoa'];
        if (isDefined(this._archive.password)) {
            args.push(`-p${this._archive.password}`);
        }

        const proc = execa('7za', args, { reject: false });

        const total = (await this.listFiles()).length;

        proc.stdout?.on('data', (data: Buffer) => {
            const line = data.toString();
            const match = line.match(/(\d+)%/);
            if (match && total > 0) {
                const percent = parseInt(match[1], 10);
                const success = Math.round((percent / 100) * total);
                this._progress$.next({ total, success });
            }
        });

        const { stdout } = await proc;
        if (!stdout?.includes('Everything is Ok')) {
            const err = new UnknownArchiveError();
            this._progress$.error(err);
            throw err;
        } else {
            this._progress$.complete();
        }
    }

    private async _testArchive(): Promise<boolean> {
        const args = this._archive.password ? ['t', this._archive.absPath, `-p${this._archive.password}`] : ['t', this._archive.absPath];
        const output = await _7z.cmd(args);

        if (output.includes('Everything is Ok')) {
            return true;
        }

        if (output.includes('Wrong password') || output.includes('Data error in encrypted file')) {
            throw new WrongPasswordArchiveError();
        }

        const missingMatch = output.match(/Can not open input file\s*:\s*(.+)/i) || output.match(/No more input files.*?:\s*(.+)/i);

        if (missingMatch || output.includes("Can't open input file") || output.includes('No more input files')) {
            const missing = missingMatch ? missingMatch[1].trim() : 'unknow part';
            const missingError = new MissingArchivePartError(missing);
            this._progress$.error(missingError);
            throw missingError;
        }

        const corruptedError = new CorruptedArchiveError(output.slice(0, 500));
        this._progress$.error(corruptedError);
        throw corruptedError;
    }
}
