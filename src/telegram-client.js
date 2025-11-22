// src/telegram-client.js
const TELEGRAM_TOKEN = "8543613937:AAGAHTi7dC6XQv9eML9xnN7ju_CprS36OO4"; // ← ТОТ ЖЕ ТОКЕН, ЧТО И ДЛЯ ТЕБЯ

export const sendConfirmationToClient = async (telegramId, name, service, duration, date, time) => {
  if (!telegramId || !telegramId.toString().match(/^-?\d+$/)) {
    console.log("Telegram ID не указан — подтверждение не отправлено");
    return;
  }

  const text = `
${name}, ваша запись подтверждена! 

${service} (${duration} мин)
${date}, ${time}

Спасибо! До встречи ❤️
  `.trim();

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: text,
        parse_mode: "HTML"
      })
    });

    if (!res.ok) {
      const err = await res.json();
      console.warn("Не удалось отправить клиенту:", err.description);
    } else {
      console.log("Подтверждение отправлено клиенту в Telegram:", name);
    }
  } catch (err) {
    console.warn("Ошибка отправки в Telegram клиенту:", err);
  }
};