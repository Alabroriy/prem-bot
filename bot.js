const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.BOT_TOKEN;
const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000';

function createWebAppButton(text, url) {
  if (url && url.startsWith('https://')) {
    return { text: text, web_app: { url: url } };
  }
  return { text: text, url: url };
}

let bot;

function initBot() {
  if (!token) {
    console.error('❌ BOT_TOKEN environment variable topilmadi!');
    return null;
  }

  // Create bot instance polling mode
  bot = new TelegramBot(token, { polling: true });

  console.log(`🤖 Telegram Bot muvaffaqiyatli ishga tushirildi!`);

  // Handler for /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Foydalanuvchi';

    const welcomeMessage =
      `👋 <b>Salom, ${firstName}!</b>\n\n` +
      `🚀 <b>Telegram Digital Services Do'koniga xush kelibsiz!</b>\n\n` +
      `Bizning botimiz orqali siz quyidagi xizmatlarni qulay va tezkor xarid qilishingiz mumkin:\n\n` +
      `⭐️ <b>Telegram Stars</b> — Eng arzon narxlarda instant yulduzlar\n` +
      `👑 <b>Telegram Premium</b> — 3, 6, 12 oylik rasmiy obunalar\n` +
      `🎁 <b>Telegram Gifts</b> — Eksklyuziv kolleksiya sovg'alari\n` +
      `📱 <b>Telegram Numbers</b> — Anonymous (+888) virtual raqamlar\n\n` +
      `⚡️ Premium va Stars xizmatlari <b>fragment-api.uz</b> API tizimi orqali tezkor va xavfsiz taqdim etiladi.\n\n` +
      `👇 Xaridlarni amalga oshirish uchun pastdagi <b>Web App do'konini ochish</b> tugmasini bosing:`;

    const options = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            createWebAppButton('🛍 Do\'konni Ochish (Web App)', webappUrl)
          ],
          [
            { text: '⭐️ Stars', callback_data: 'cat_stars' },
            { text: '👑 Premium', callback_data: 'cat_premium' }
          ],
          [
            { text: '🎁 Gifts', callback_data: 'cat_gifts' },
            { text: '📱 Numbers', callback_data: 'cat_numbers' }
          ],
          [
            { text: 'ℹ️ Yordam / Qo\'llab-quvvatlash', callback_data: 'help_info' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, welcomeMessage, options);
  });

  // Handler for /help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpText =
      `❓ <b>Qanday foydalaniladi?</b>\n\n` +
      `1️⃣ <b>"Do'konni Ochish"</b> tugmasini bosing.\n` +
      `2️⃣ O'zingizga kerakli bo'limni tanlang (Stars, Premium, Gifts, Numbers).\n` +
      `3️⃣ Kerakli paket va Telegram useringizni kiritib buyurtma bering.\n` +
      `4️⃣ Stars va Premium okamertan <b>fragment-api.uz</b> orqali yetkazib beriladi.\n\n` +
      `📞 Qo'llab-quvvatlash: Admin bilan bog'lanish uchun WebApp ichidagi yordam tugmasidan foydalaning.`;

    bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
  });

  // Handle Callback Queries from inline buttons
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    bot.answerCallbackQuery(query.id);

    if (data.startsWith('cat_')) {
      const category = data.replace('cat_', '').toUpperCase();
      bot.sendMessage(chatId, `🛍 <b>${category}</b> bo'limi bo'yicha xaridlarni Web App ilovasida tezkor bajarishingiz mumkin!`, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            createWebAppButton('📱 Web App do\'konini ochish', webappUrl)
          ]]
        }
      });
    } else if (data === 'help_info') {
      bot.sendMessage(chatId, `💬 <b>Savol va murojaatlar uchun:</b>\nTelegram WebApp orqali to'g'ridan-to'g mezonizni tanlab buyurtma bering. Reallik va tezkorlik kafolatlanadi.`, { parse_mode: 'HTML' });
    }
  });

  // Handle WebApp Data sent from WebApp
  bot.on('message', (msg) => {
    if (msg.web_app_data) {
      try {
        const data = JSON.parse(msg.web_app_data.data);
        const chatId = msg.chat.id;

        const confirmationMsg =
          `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n` +
          `📦 <b>Xizmat:</b> ${data.service_name}\n` +
          `👤 <b>Qabul qiluvchi:</b> @${data.target_username}\n` +
          `💰 <b>Summa:</b> ${data.price_formatted}\n` +
          `🔢 <b>Order ID:</b> <code>${data.order_id}</code>\n\n` +
          `✨ Buyurtma holati haqida bot orqali xabar berib boriladi. Rahmat!`;

        bot.sendMessage(chatId, confirmationMsg, { parse_mode: 'HTML' });

        // Notify Admin if ADMIN_CHAT_ID is set
        if (process.env.ADMIN_CHAT_ID) {
          const adminNotice =
            `🔔 <b>Yangi Buyurtma Keldi!</b>\n\n` +
            `👤 Foydalanuvchi: ${msg.from.first_name} (@${msg.from.username || 'yoq'})\n` +
            `📦 Xizmat: ${data.service_name}\n` +
            `🎯 Qabul qiluvchi: @${data.target_username}\n` +
            `💰 Narxi: ${data.price_formatted}\n` +
            `🆔 Order ID: ${data.order_id}`;

          bot.sendMessage(process.env.ADMIN_CHAT_ID, adminNotice, { parse_mode: 'HTML' });
        }
      } catch (err) {
        console.error('Error handling web_app_data:', err);
      }
    }
  });

  return bot;
}

/**
 * Send notification message to telegram user
 */
function sendUserNotification(chatId, text) {
  if (bot && chatId) {
    bot.sendMessage(chatId, text, { parse_mode: 'HTML' }).catch(err => {
      console.error('Failed to send telegram notification:', err.message);
    });
  }
}

module.exports = { initBot, sendUserNotification };
