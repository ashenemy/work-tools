export declare const configToml: {
    scope: string;
    main: {
        name: string;
        dist: string;
    };
    mode: string;
    root: string;
    fs: {
        fileSaveTo: string;
        fileExtractTo: string;
        passSaveTo: string;
    };
    mongoDB: {
        connectionUri: string;
    };
    nats: {
        server: string;
        monitoring: string;
    };
    clickHouse: {
        connectionUri: string;
    };
    apps: {
        'cc-buyer-bot': {
            name: string;
            dist: string;
            schedule: boolean;
            every: number;
            disable: boolean;
        };
        'installer-bot': {
            name: string;
            dist: string;
            onEvent: string;
            disable: boolean;
        };
        'helper-bot': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'notify-bot': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'doc-loader-bot': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'watcher-bot': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'optimizer-queuee': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'download-queue': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'extractor-queue': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
        'analize-queue': {
            name: string;
            dist: string;
            autoLoad: boolean;
            priority: number;
            disable: boolean;
        };
    };
    tg: {
        bot: {
            watcher: {
                appId: number;
                apiHash: string;
                phoneNumber: string;
                password: string;
            };
            docLoader: {
                appId: number;
                apiHash: string;
                phoneNumber: string;
                password: string;
            };
            installer: {
                appId: number;
                apiHash: string;
                phoneNumber: string;
                password: string;
            };
            notify: {
                name: string;
                token: string;
            };
            helper: {
                name: string;
                token: string;
            };
        };
        groups: {
            tmp: string;
            notifications: number;
        };
        logsFrom: {
            watching: {
                bots: string[];
                groups: string[];
            };
            run: string[];
        };
    };
    container: {
        mongo: {
            port: number;
            internalPort: number;
            docker: {
                image: string;
                container: string;
            };
            root: {
                username: string;
                password: string;
            };
            app: {
                db: string;
                collection: string;
                username: string;
                password: string;
            };
            fs: {
                data: {
                    dir: string;
                    targetDir: string;
                };
                initob: {
                    targetDir: string;
                };
            };
        };
        clickHouse: {
            docker: {
                image: string;
                container: string;
            };
            ports: {
                http: {
                    port: number;
                    internalPort: number;
                };
                tcp: {
                    port: number;
                    internalPort: number;
                };
            };
            app: {
                db: string;
                username: string;
                password: string;
            };
            fs: {
                data: {
                    targetDir: string;
                    dir: string;
                };
                log: {
                    targetDir: string;
                    dir: string;
                };
                config: {
                    targetDir: string;
                };
                initob: {
                    targetDir: string;
                };
            };
        };
        nats: {
            port: number;
            internalPort: number;
            serverName: string;
            docker: {
                container: string;
            };
            monitor: {
                port: number;
                internalPort: number;
            };
            fs: {
                data: {
                    dir: string;
                };
                store: {
                    dir: string;
                };
            };
        };
    };
};
export type AppConfigToml = typeof configToml;
