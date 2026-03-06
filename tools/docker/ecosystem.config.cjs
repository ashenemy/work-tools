const fs = require('fs');

function resolveDockerBinary() {
    if (process.platform === 'win32') {
        const windowsDockerPath = 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe';
        if (fs.existsSync(windowsDockerPath)) {
            return windowsDockerPath;
        }
    }

    return 'docker';
}

const dockerBin = resolveDockerBinary();
const composeArgsBase = 'compose -f compose.yml --env-file .env up';

module.exports = {
    apps: [
        {
            name: 'db-mongo',
            cwd: __dirname,
            script: dockerBin,
            interpreter: 'none',
            args: `${composeArgsBase} mongo`,
            autorestart: true,
            restart_delay: 2000,
            max_restarts: 10,
        },
        {
            name: 'db-clickhouse',
            cwd: __dirname,
            script: dockerBin,
            interpreter: 'none',
            args: `${composeArgsBase} clickhouse`,
            autorestart: true,
            restart_delay: 2000,
            max_restarts: 10,
        },
        {
            name: 'db-nats',
            cwd: __dirname,
            script: dockerBin,
            interpreter: 'none',
            args: `${composeArgsBase} nats`,
            autorestart: true,
            restart_delay: 2000,
            max_restarts: 10,
        },
    ],
};
