const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const TELEGRAM_TOKEN = "8543613937:AAGAHTi7dC6XQv9eML9xnN7ju_CprS36OO4"; // ← ТОТ ЖЕ ТОКЕН

exports.sendReminders = functions.pubsub.schedule("every 5 minutes").onRun(async () => {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 65 * 60 * 1000);

  const snap = await db.collection("bookings")
    .where("blocked", "==", false)
    .where("reminderSent", "==", false)
    .get();

  for (const doc of snap.docs) {
    const b = doc.data();
    if (!b.clientTelegramId || !b.date || !b.time) continue;

    const [d, m, y] = b.date.split(".");
    const [h, min] = b.time.split(":");
    const bookingTime = new Date(y, m - 1, d, h, min);

    if (bookingTime > now && bookingTime <= inOneHour) {
      const success = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: b.clientTelegramId,
          text: `<b>Напоминание!</b>\n\nЧерез час у вас:\n\n${b.serviceName} (${b.duration} мин)\n${b.date}, ${b.time}\n\nЖдём вас!`,
          parse_mode: "HTML"
        })
      });

      if (success.ok) {
        await doc.ref.update({ reminderSent: true });
        console.log("Напоминание отправлено:", b.clientName);
      }
    }
  }
  return null;
});