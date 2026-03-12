const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
    output: {
        clean: true,
        path: join(__dirname, 'dist'),
        ...(process.env.NODE_ENV !== 'production' && { devtoolModuleFilenameTemplate: '[absolute-resource-path]' }),
    },
    plugins: [
        new NxAppWebpackPlugin({
            assets: [{ glob: 'config.toml', input: 'apps/config-generator/build', output: '.' }],
            compiler: 'tsc',
            generatePackageJson: false,
            main: './src/main.ts',
            optimization: false,
            outputHashing: 'none',
            sourceMap: true,
            target: 'node',
            tsConfig: './tsconfig.app.json',
        }),
    ],
};
