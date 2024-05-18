require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

let userSessions = {};
let newFiles = false;


bot.onText(/\/start/, (msg) => {
    newFiles = false;
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Выберете тип отправки истории:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🙂 Обычный', callback_data: 'anonymous' }, { text: '👀 Анонимный', callback_data: 'regular' }]
            ]
        }
    });
});

bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userName = `${callbackQuery.from.first_name} ${callbackQuery.from.last_name || ''}`.trim();
    const submissionType = callbackQuery.data;

    userSessions[userId] = {
        userId,
        userName,
        submissionType,
        text: '',
        files: []
    };

    bot.sendMessage(chatId, 'Напишите и отправьте историю, которой хотите поделиться');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userSessions[userId]) {
        const session = userSessions[userId];

        if (!session.text && msg.text && msg.text !== '/start') {
            session.text = msg.text;
            bot.sendMessage(chatId, 'Прикрепите и отправьте фото, видео или документы');
        } else if (session.text && msg.photo || msg.document || msg.video) {
            if (!newFiles) {
                setTimeout(() => {
                    bot.sendMessage(chatId, 'Ваша история успешно принята. Благодарю! Если хотите отправить еще одну историю, нажмите на /start');
                    forwardMessageToTargetUser(session);
                    delete userSessions[userId];
                }, 1500);
            }
            if (msg.photo) {
                const photoId = msg.photo[msg.photo.length - 1].file_id;
                session.files.push({type: 'photo', file_id: photoId});
                newFiles = true;
            } else if (msg.document) {
                const documentId = msg.document.file_id;
                session.files.push({type: 'document', file_id: documentId});
                newFiles = true;
            } else if (msg.video) {
                const videoId = msg.video.file_id;
                session.files.push({type: 'video', file_id: videoId});
                newFiles = true;
            }

        }
    }
});


function forwardMessageToTargetUser(session) {
    const targetUserId = process.env.TARGET_USER_ID;
    bot.sendMessage(targetUserId, "____________________________________new message for мышь!______________________________");
    const text = `User: ${session.userName}\nType: ${session.submissionType}\nMessage: \n${session.text}`;

    setTimeout(() => {
        // Отправка текстового сообщения
        bot.sendMessage(targetUserId, text);





    }, 2000);

    setTimeout(() => {



        // Отправка файлов
        session.files.forEach(file => {
            if (file.type === 'photo') {
                bot.sendPhoto(targetUserId, file.file_id);
            } else if (file.type === 'document') {
                bot.sendDocument(targetUserId, file.file_id);
            } else if (file.type === 'video') {
                bot.sendVideo(targetUserId, file.file_id);
            }
        });
    }, 6000);


}
