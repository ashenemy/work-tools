import { TgUserBot } from '@work-tools/tg-user';

const tgBot = new TgUserBot();

tgBot.connect().then(async (client) => {
    await tgBot.manualRun();
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    setTimeout(() => process.exit(1), 1000);
});