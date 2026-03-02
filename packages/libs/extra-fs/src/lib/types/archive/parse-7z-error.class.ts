import { WrongPasswordArchiveError } from '../../errors/archive/wrong-password-archive.error';
import { MissingArchivePartError } from '../../errors/archive/missing-archive-part.error';
import { CorruptedArchiveError } from '../../errors/archive/corrupted-archive.error';
import { UnknownArchiveError } from '../../errors/archive/unknown-archive.error';
import { SevenZipMinError } from '7zip-min';

export function parse7zError(err: unknown): never {
    const e = err as SevenZipMinError;

    const output = [e.message, e.stdout, e.stderr].filter((part): part is string => typeof part === 'string' && part.length > 0).join('\n');

    const text = output.toLowerCase();

    if (text.includes('wrong password') || text.includes('data error in encrypted file') || text.includes('data error : wrong password')) {
        throw new WrongPasswordArchiveError();
    }

    const missingMatch = output.match(/Can not open input file\s*:\s*(.+)/i) || output.match(/No more input files.*?:\s*(.+)/i);

    if (missingMatch || text.includes('can not open input file') || text.includes('no more input files') || text.includes('no more files') || text.includes('unexpected end of archive') || text.includes('open error: can not open the file as [7z] archive') || text.includes('can not open the file as [7z] archive')) {
        throw new MissingArchivePartError(missingMatch?.[1]?.trim() ?? 'unknown part');
    }

    if (text.includes('data error') || text.includes('crc failed') || text.includes('crc error') || text.includes('headers error')) {
        throw new CorruptedArchiveError(output.slice(0, 500));
    }

    throw new UnknownArchiveError(output.slice(0, 500));
}