import { Dirent } from 'node:fs';
import { MediaFile } from '../primitives/media-file.class';
import { VideoFileTypeError } from '../errors/file-type/video-file-type.error';
import { File } from '../primitives/file.class';

export class VideoFile extends MediaFile {
    public static readonly EXTENSIONS: Array<string> = ['mp4', 'avi', 'mov', 'mkv'];

    constructor(filePath: string | Dirent, createNewFile: boolean = false) {
        super(filePath);

        if (!VideoFile.isVideo(filePath, createNewFile)) {
            throw new VideoFileTypeError(this.name);
        }
    }

    public static isVideo(filePath: string | Dirent, createNewFile: boolean = false): boolean {
        if (!File.isFile(filePath, createNewFile)) {
            return false;
        }

        const _file: File = new File(filePath, createNewFile);
        return VideoFile.EXTENSIONS.includes(_file.ext);
    }

    protected override assertDestinationCompatible(destination: string): void {
        this.assertAllowedExtensions(destination, VideoFile.EXTENSIONS);
    }
}
