/*
export type ConfigFSType = 'fileSaveTo' | 'fileExtractTo' | 'passSaveTo'

export type AppNames = 'cc-buyer-bot' | 'installer-bot' | 'helper-bot' | 'notify-bot' | 'doc-loader-bot' | 'watcher-bot' | 'optimizer-queuee' | 'download-queue' | 'extractor-queue' | 'analize-queue';
import { type ContainerConfigType, ContainersConfig } from './parts/03-containers';
import { AppsConfig, type ConfigApps } from './parts/01-apps';
import { type ConfigTg, TgConfig } from './parts/02-tg';

export type ConfigToml = {
    mode: 'dev' | 'prod';
    root: string;
    fs: Record<'fileSaveTo' | 'fileExtractTo' | 'passSaveTo', string>;
    nats: {
        server: string;
        monitoring: string;
    };
    clickHouse: {
        url: string;
    };
    mongo: {
        url: string;
    };
    app: ConfigApps;
    tg: ConfigTg;
    container: ContainerConfigType;
};


export type ConfigToml = {

}*/
