import { FsFile } from '../base/fs-file.class';
import { appendFile, readFile, writeFile } from 'fs-extra';
import { TextSearchResult } from '../../@types';

export class FsTextFile extends FsFile {
    public async readText(encoding: BufferEncoding = 'utf8'): Promise<string> {
        return readFile(this._path, encoding);
    }

    public async writeText(content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
        await writeFile(this._path, content, encoding);
    }

    public async appendText(content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
        await appendFile(this._path, content, encoding);
    }

    public async readLines(encoding: BufferEncoding = 'utf8'): Promise<string[]> {
        return (await this.readText(encoding)).split(/\r?\n/);
    }

    public async writeLines(lines: string[], encoding: BufferEncoding = 'utf8', eol = '\n'): Promise<void> {
        await this.writeText(lines.join(eol), encoding);
    }

    public async prependText(content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
        const cur = await this.readText(encoding);
        await this.writeText(content + cur, encoding);
    }

    public async clear(): Promise<void> {
        await this.truncate(0);
    }

    public async search(pattern: string | RegExp, opts: { caseSensitive?: boolean } = {}): Promise<TextSearchResult[]> {
        const text = await this.readText();
        const flags = opts.caseSensitive ? 'g' : 'gi';
        const re = typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern;
        const res: TextSearchResult[] = [];
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            let m: RegExpExecArray | null;
            re.lastIndex = 0;
            while ((m = re.exec(lines[i])) !== null) {
                res.push({ line: i + 1, column: m.index + 1, match: m[0] });
            }
        }
        return res;
    }

    public async replace(pattern: string | RegExp, replacement: string): Promise<void> {
        const text = await this.readText();
        await this.writeText(text.replace(pattern, replacement));
    }

    public async isEmpty(): Promise<boolean> {
        return (await this.size()) === 0;
    }
}
