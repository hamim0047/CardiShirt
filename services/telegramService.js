const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, message) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
      }
    );

    console.log("✅ Telegram sent to:", chatId);
  } catch (error) {
    console.error(
      "❌ Telegram failed:",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendTelegramMessage };