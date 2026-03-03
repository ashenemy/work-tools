import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    roots: ['<rootDir>/packages'],
    // Ищем тесты только в папках /tests/ внутри пакетов
    testMatch: ['**/tests/**/*.test.ts'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.base.json',
            },
        ],
    },
    testTimeout: 30000,
};

export default config;
