import { WrongPasswordArchiveError } from '../../errors/archive/wrong-password-archive.error';
import { MissingArchivePartError } from '../../errors/archive/missing-archive-part.error';
import { CorruptedArchiveError } from '../../errors/archive/corrupted-archive.error';
import { UnknownArchiveError } from '../../errors/archive/unknown-archive.error';
import { SevenZipMinError } from '7zip-min';
import { basename } from 'path';

type Parse7zErrorContext = {
    archivePath?: string;
    isMultipart?: boolean;
    missingHint?: string;
};

function buildOutput(err: SevenZipMinError): string {
    return [err.message, err.stdout, err.stderr].filter((part): part is string => typeof part === 'string' && part.trim().length > 0).join('\n');
}

function looksLikeMultipartPath(path?: string): boolean {
    if (!path) {
        return false;
    }

    const name = basename(path).toLowerCase();

    return /\.(7z|zip)\.\d{3,}$/.test(name) || /\.part\d+\.rar$/.test(name) || /\.r\d{2}$/.test(name) || /\.z\d{2}$/.test(name) || /\.\d{3,}$/.test(name);
}

function extractMissingPart(output: string): string | undefined {
    const patterns = [/Can not open input file\s*:\s*(.+)/i, /No more input files.*?:\s*(.+)/i, /ERROR:\s+(.+?)\s*:\s*(.+)/i];

    for (const pattern of patterns) {
        const match = output.match(pattern);
        if (!match) {
            continue;
        }

        const candidate = match[2] ?? match[1];
        if (candidate?.trim()) {
            return candidate.trim();
        }
    }

    return undefined;
}

export function parse7zError(err: unknown, context: Parse7zErrorContext = {}): never {
    const e = err as SevenZipMinError;
    const output = buildOutput(e);
    const text = output.toLowerCase();

    const isMultipart = context.isMultipart ?? looksLikeMultipartPath(context.archivePath);
    const missingPart = extractMissingPart(output) ?? context.missingHint ?? (context.archivePath ? basename(context.archivePath) : 'unknown part');

    if (text.includes('wrong password') || text.includes('data error in encrypted file') || text.includes('data error : wrong password') || text.includes('can not open encrypted archive. wrong password?')) {
        throw new WrongPasswordArchiveError();
    }

    const hasOpenInputError = text.includes('can not open input file') || text.includes('no more input files') || text.includes('no more files');

    const hasArchiveOpenError = text.includes('open error: can not open the file as [7z] archive') || text.includes('can not open the file as [7z] archive') || text.includes("can't open as archive");

    const hasUnexpectedEnd = text.includes('unexpected end of archive');

    if (isMultipart && (hasOpenInputError || hasArchiveOpenError || hasUnexpectedEnd)) {
        throw new MissingArchivePartError(missingPart);
    }

    if (text.includes('data error') || text.includes('crc failed') || text.includes('crc error') || text.includes('headers error') || hasArchiveOpenError || hasUnexpectedEnd) {
        throw new CorruptedArchiveError(output.slice(0, 500));
    }

    throw new UnknownArchiveError(output.slice(0, 500));
}