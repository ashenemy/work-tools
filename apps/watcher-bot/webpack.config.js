const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
    output: {
        path: join(__dirname, 'dist'),
        clean: true,
        ...(process.env.NODE_ENV !== 'production' && {
            devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        }),
    },
    plugins: [
        new NxAppWebpackPlugin({
            target: 'node',
            compiler: 'tsc',
            main: './src/main.ts',
            tsConfig: './tsconfig.app.json',
            assets: [{
                "input": "apps/config-generator/build",
                "glob": "config.toml",
                "output": "."
            }],
            optimization: false,
            outputHashing: 'none',
            generatePackageJson: false,
            sourceMap: true,
        }),
    ],
};
