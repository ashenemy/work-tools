
const ContainersConfig = {
    mongo: {
        port: 27017,
        internalPort: 27017,
        docker: {
            image: 'mongo:7',
            container: 'work-tools-mongo',
        },
        root: {
            username: 'admin',
            password: 'admin',
        },
        app: {
            db: 'workTools',
            collection: 'workTools',
            username: 'workTools',
            password: 'workTools',
        },
        fs: {
            data: {
                dir: './.data/mongo/data',
                targetDir: '/data/db',
            },
            initob: {
                targetDir: '/docker-entrypoint-initdb.d',
            },
        },
    },
    clickHouse: {
        docker: {
            image: 'clickhouse/clickhouse-server:25.11',
            container: 'work-tools-clickhouse',
        },
        ports: {
            http: {
                port: 8123,
                internalPort: 8123,
            },
            tcp: {
                port: 9000,
                internalPort: 9000,
            },
        },
        app: {
            db: 'workTools',
            username: 'workTools',
            password: 'workTools',
        },
        fs: {
            data: {
                targetDir: '/var/lib/clickhouse',
                dir: './.data/clickhouse/data',
            },
            log: {
                targetDir: '/var/log/clickhouse-server',
                dir: './.data/clickhouse/logs',
            },
            config: {
                targetDir: '/etc/clickhouse-server/config.d',
            },
            initob: {
                targetDir: '/docker-entrypoint-initdb.d',
            },
        },
    },
    nats: {
        port: 4222,
        internalPort: 4222,
        serverName: 'work-tools-nats',
        docker: {
            container: 'work-tools-nats',
        },
        monitor: {
            port: 8222,
            internalPort: 8222,
        },
        fs: {
            data: {
                dir: './.data/nats/data',
            },
            store: {
                dir: '/data/jetstream',
            },
        },
    },
};

export const configToml = {
    scope: '@work-tools',
    main: {
        name: 'runner',
        dist: '',
    },
    mode: 'dev',
    root: 'C:\\Projects\\work-tools',
    fs: {
        fileSaveTo: 'C:\\STORAGE\\download',
        fileExtractTo: 'C:\\STORAGE\\extract',
        passSaveTo: 'C:\\STORAGE\\passwords',
    },
    mongo: {
        url: `mongodb://${ContainersConfig.mongo.app.username}:${ContainersConfig.mongo.app.password}@localhost:${ContainersConfig.mongo.port}/${ContainersConfig.mongo.app.db}`,
    },
    nats: {
        server: `nats://localhost:${ContainersConfig.nats.port}`,
        monitoring: `http://localhost:${ContainersConfig.nats.monitor.port}`,
    },
    clickHouse: {
        url: `clickhouse://${ContainersConfig.clickHouse.app.username}:${ContainersConfig.clickHouse.app.password}@localhost:${ContainersConfig.clickHouse.ports.tcp.port}/${ContainersConfig.mongo.app.db}`,
    },
    apps: {
            'cc-buyer-bot': {
                name: 'cc-buyer-bot',
                dist: '',
                schedule: true,
                every: 3600,
                disable: true,
            },
            'installer-bot': {
                name: 'installer-bot',
                dist: '',
                onEvent: 'new-group-install',
                disable: true,
            },
            'helper-bot': {
                name: 'helper-bot',
                dist: '',
                autoLoad: true,
                priority: 20,
                disable: true,
            },
            'notify-bot': {
                name: 'notify-bot',
                dist: '',
                autoLoad: true,
                priority: 20,
                disable: true,
            },
            'doc-loader-bot': {
                name: 'doc-loader-bot',
                dist: '',
                autoLoad: true,
                priority: 20,
                disable: true,
            },
            'watcher-bot': {
                name: 'watcher-bot',
                dist: '',
                autoLoad: true,
                priority: 20,
                disable: true,
            },
            'optimizer-queuee': {
                name: 'optimizer-queuee',
                dist: '',
                autoLoad: true,
                priority: 10,
                disable: true,
            },
            'download-queue': {
                name: 'analize-queue',
                dist: '',
                autoLoad: true,
                priority: 10,
                disable: true,
            },
            'extractor-queue': {
                name: 'extractor-queue',
                dist: '',
                autoLoad: true,
                priority: 10,
                disable: true,
            },
            'analize-queue': {
                name: 'download-queue',
                dist: '',
                autoLoad: true,
                priority: 10,
                disable: true,

        },
    },
    tg: {
        bot: {
            watcher: {
                appId: 31618789,
                apiHash: '53dca6f0ca57b1e528d4b8f61e968482',
                phoneNumber: '+37433618001',
                password: 'Qwerty12as12!',
            },
            docLoader: {
                appId: 31618789,
                apiHash: '53dca6f0ca57b1e528d4b8f61e968482',
                phoneNumber: '+37433618001',
                password: 'Qwerty12as12!',
            },
            installer: {
                appId: 31618789,
                apiHash: '53dca6f0ca57b1e528d4b8f61e968482',
                phoneNumber: '+37433618001',
                password: 'Qwerty12as12!',
            },
            notify: {
                name: '',
                token: '',
            },
            helper: {
                name: '',
                token: '',
            },
        },
        groups: {
            tmp: '@my',
            notifications: -3889280097,
        },
        logsFrom: {
            watching: {
                bots: ['@WeTransfer1bot', '@boxedrobot'],
                groups: ['-1833254475', '@Everlasting_Logs', '@bugatti_cloudnew', '-3898748913'],
            },
            run: ['@WeTransfer1bot'],
        },
    },
    container: ContainersConfig,
};

