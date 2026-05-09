const { sendTelegramMessage } = require("./telegramService");

async function notifyFamily(contacts, message) {
  if (!contacts || contacts.length === 0) return;

  for (const contact of contacts) {
    if (!contact.telegramChatId) continue;

    try {
      await sendTelegramMessage(contact.telegramChatId, message);
      console.log("✅ Family Telegram sent to:", contact.telegramChatId);
    } catch (error) {
      console.error("❌ Telegram error:", error.message);
    }
  }
}

async function notifyUser(user, message) {
  console.log("📲 Notify user:", user.email, message);
}

async function notifyEmergency(message) {
  console.log("🚨 EMERGENCY:", message);
}

module.exports = {
  notifyFamily,
  notifyUser,
  notifyEmergency,
};