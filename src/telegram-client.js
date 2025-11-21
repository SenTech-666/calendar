// src/telegram-client.js
const TELEGRAM_TOKEN = "8543613937:AAGAHTi7dC6XQv9eML9xnN7ju_CprS36OO4"; // ← ВСТАВЬ СВОЙ ТОКЕН

export const sendTelegramToClient = async (chatId, name, service, duration, date, time, isReminder = false) => {
  if (!chatId || !/^\d+$/.test(chatId)) {
    console.log("Telegram ID не указан или некорректен");
    return false;
  }

  const text = isReminder 
    ? `<b>Напоминание!</b>\n\nЧерез час у вас запись:\n\n${service} (${duration} мин)\n${date}, ${time}\n\nЖдём вас!`
    : `Запись подтверждена!\n\n${service} (${duration} мин)\n${date}, ${time}\n\nСпасибо! До встречи`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
      })
    });

    if (res.ok) {
      console.log(`${isReminder ? "Напоминание" : "Подтверждение"} отправлено клиенту:`, name);
      return true;
    } else {
      const err = await res.json();
      console.warn("Ошибка Telegram:", err.description);
      return false;
    }
  } catch (err) {
    console.warn("Ошибка сети при отправке в Telegram:", err);
    return false;
  }
};