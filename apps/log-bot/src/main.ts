import { TgUserBot } from '@work-tools/tg-user';

const tgBot = new TgUserBot();

tgBot.connect().then(async (client) => {
    await tgBot.manualRun();
});
