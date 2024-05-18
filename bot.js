require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

let userSessions = {};
let newFiles = false;

bot.onText(/\/start/, (msg) => {
    resetNewFiles();
    const chatId = msg.chat.id;
    sendStartMessage(chatId);
});

bot.on('callback_query', handleCallbackQuery);
bot.on('message', handleMessage);

function resetNewFiles() {
    newFiles = false;
}

function sendStartMessage(chatId) {
    bot.sendMessage(chatId, '👩‍💻Привет!\n' +
        '\n' +
        'Сюда можно прислать историю своего предка: текст, фото, видео и аудио.\n' +
        '\n' +
        '💁‍♀️Расскажите историю его/ее жизни, опишите необычный или удивительный случай, поделитесь историей любви или преодоления. Если Ваш предок участвовал в войне - расскажите о его подвигах или увиденных на фронте событиях.  О чем мечтал ваш предок? Какие ценности у него были в жизни? Как его существование повлияло на всю семью? Обязательно прикрепите визуальные материалы, ведь фото и видео будут в 10 раз нагляднее, чем просто текст.\n' +
        '\n' +
        '⌨️ Выберете тип отправки истории:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🙂 Обычный', callback_data: 'anonymous' }, { text: '👀 Анонимный', callback_data: 'regular' }]
            ]
        }
    });
}

function handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const userName = `${callbackQuery.from.first_name} ${callbackQuery.from.last_name || ''}`.trim();
    const usernametg = callbackQuery.from.username;
    const submissionType = callbackQuery.data;

    if (submissionType === 'skip_files') {
        bot.sendMessage(chatId, 'Ваша история успешно принята. Благодарю! Если хотите отправить еще одну историю, нажмите на /start');
        delete userSessions[userId];
        return;
    }

    userSessions[userId] = {
        userId,
        userName,
        usernametg,
        submissionType,
        text: '',
        files: []
    };

    bot.sendMessage(chatId, 'Напишите и отправьте историю, которой хотите поделиться👇');
}

function handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userSessions[userId]) {
        const session = userSessions[userId];


        if (!session.text && msg.text && msg.text !== '/start') {
            session.text = msg.text;

            bot.sendMessage(chatId, 'Прикрепите и отправьте фото и видео👇 Если хотите отправить историю без иллюстрации – нажмите кнопку «не прикреплять файлы»', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Не прикреплять файлы', callback_data: 'skip_files' }]
                    ]
                }
            });

            forwardTextToTargetUser(session);
        } else if (session.text && (msg.photo || msg.document || msg.video)) {
            handleFileUpload(msg, session, chatId);
        }
    }
}

function forwardTextToTargetUser(session) {
    const targetUserId = process.env.TARGET_USER_ID;
    const text = `User: ${session.userName}\nType: ${session.submissionType}\nUsername: @${session.usernametg}\nMessage: \n`;

    bot.sendMessage(targetUserId, "____________________________________new message for мышь!______________________________");
    setTimeout(() => {
        bot.sendMessage(targetUserId, text);
    }, 2000);

    setTimeout(() => {
        bot.sendMessage(targetUserId, `${session.text}`);
    }, 3000);
}

function handleFileUpload(msg, session, chatId) {
    if (!newFiles) {
        setTimeout(() => {
            bot.sendMessage(chatId, 'Ваша история успешно принята. Благодарю! Если хотите отправить еще одну историю, нажмите на /start');
            forwardMessageToTargetUser(session);
            delete userSessions[session.userId];
        }, 1500);
    }

    if (msg.photo) {
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        session.files.push({ type: 'photo', file_id: photoId });
        newFiles = true;
    } else if (msg.document) {
        const documentId = msg.document.file_id;
        session.files.push({ type: 'document', file_id: documentId });
        newFiles = true;
    } else if (msg.video) {
        const videoId = msg.video.file_id;
        session.files.push({ type: 'video', file_id: videoId });
        newFiles = true;
    }
}

function forwardMessageToTargetUser(session) {
    const targetUserId = process.env.TARGET_USER_ID;

    setTimeout(() => {
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

bot.on('polling_error', (error) => {
    console.error(error.code);  // => 'EFATAL'
});
