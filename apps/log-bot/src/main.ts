import process from 'process';
import { TgUserBot } from '@work-tools/tg-user';

const tgBot = new TgUserBot();

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
});

const gracefulShutdown = async (signal: string) => {
    console.info(`\nПолучен сигнал ${signal} — завершаем бота...`);

    try {
        await tgBot.shutdown();
        console.info('TgUserBot shutdown завершён успешно');
    } catch (err) {
        console.error('Ошибка при shutdown:', err);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

tgBot
    .startWithAutoReconnect(8)
    .then(async () => {
        console.info('🚀 TgUserBot запущен с авто-реконнектом');
        await tgBot.manualRun();
    })
    .catch((err: Error) => {
        console.error('Не удалось запустить бота', err);
        process.exit(1);
    });