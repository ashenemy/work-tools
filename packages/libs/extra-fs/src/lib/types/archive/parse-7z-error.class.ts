import { WrongPasswordArchiveError } from '../../errors/archive/wrong-password-archive.error';
import { MissingArchivePartError } from '../../errors/archive/missing-archive-part.error';
import { CorruptedArchiveError } from '../../errors/archive/corrupted-archive.error';
import { UnknownArchiveError } from '../../errors/archive/unknown-archive.error';

export function parse7zError(err: Error) {
    const errText = err.message?.toLowerCase();

    if (errText.includes('wrong password') || errText.includes('data error in encrypted file') || errText.includes('data error : wrong password')) {
        throw new WrongPasswordArchiveError();
    }

    if (errText.includes('can not open input file') || errText.includes('no more input files') || errText.includes('no more files')) {
        const match = err.message.match(/Can not open input file\s*:\s*(.+)/i) || err.message.match(/No more input files.*?:\s*(.+)/i);
        const missing = match ? match[1].trim() : 'unknown part';

        throw new MissingArchivePartError(missing);
    }

    if (errText.includes('data error') || errText.includes('crc failed') || errText.includes('crc error') || errText.includes('unexpected end of archive') || errText.includes('headers error') || errText.includes('can not open file as archive')) {
        throw new CorruptedArchiveError();
    }

    throw new UnknownArchiveError(err.message);
}