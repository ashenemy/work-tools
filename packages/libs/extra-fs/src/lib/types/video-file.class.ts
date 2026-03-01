import { MediaFile, File } from '../primitives';
import { Dirent } from 'node:fs';
import { VideoFileTypeError } from '../errors';

export class VideoFile extends MediaFile {
    public static readonly EXTENSIONS: Array<string> = ['mp4', 'avi', 'mov', 'mkv'];

    constructor(filePath: string | Dirent) {
        super(filePath);

        if (!VideoFile.isVideo(filePath)) {
            throw new VideoFileTypeError(this.name);
        }
    }

    public static isVideo(filePath: string | Dirent): boolean {
        if (!File.isFile(filePath)) {
            return false;
        }

        const _file: File = new File(filePath);
        return VideoFile.EXTENSIONS.includes(_file.ext);
    }
}
