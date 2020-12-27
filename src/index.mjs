import TelegramBot from 'node-telegram-bot-api';
import config from "../config.json"
import { getFileFromStream } from "./modules/file.mjs"
import { Ibon } from "./modules/ibon.mjs"
import { Fami } from "./modules/fami.mjs"

const bot = new TelegramBot(config.token, { polling: true });

bot.on("document", async msg => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const userId = msg.from.id;
    const fileId = msg.document.file_id;
    const filename = msg.document.file_name
    const text = msg.caption;

    if (!(config.allowedUser.length === 0 || config.allowedUser.includes(userId))) {
        return
    }

    const flags = {
        isIbon: false,
        isFami: false
    };

    if (text.toLowerCase().includes("ibon")) flags.isIbon = true;
    else if (text.toLowerCase().includes("fami")) flags.isFami = true;

    if (flags.isIbon || flags.isFami) {
        const replyP = bot.sendMessage(chatId, "正在下載資料...", {
            reply_to_message_id: messageId
        });
        const fileStream = bot.getFileStream(fileId);
        const file = getFileFromStream(fileStream, filename);

        let source;
        if (flags.isIbon) source = new Ibon()
        else if (flags.isFami) source = new Fami()

        const data = await source.upload(file);

        bot.deleteMessage(chatId, (await replyP).message_id);
        bot.sendPhoto(chatId, data.image, {
            reply_to_message_id: messageId,
            caption: `PIN: \`${data.pin}\`\n\n下載期限: ${data.expiry}`,
            parse_mode: "Markdown"
        })
    }
})