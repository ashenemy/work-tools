import { Dirent } from 'node:fs';
import { File, MediaFile } from '../primitives';
import { AudioFileTypeError } from '../errors';

export class AudioFile extends MediaFile {
    public static readonly EXTENSIONS: Array<string> = ['mp3', 'wav', 'ogg'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!AudioFile.isAudioFile(filePath)) {
            throw new AudioFileTypeError(this.name);
        }
    }

    public static isAudioFile(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return AudioFile.EXTENSIONS.includes(_file.ext) || _file.name === '.env';
    }
}
