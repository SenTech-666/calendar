// src/components.js
import { store } from "./store.js";
import { formatDate } from "./date.js";
import { showModal, toast } from "./modal.js";
import { addBooking, db } from "./firebase.js";
import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { sendTelegramNotification } from "./telegram.js";
import { sendConfirmationToClient } from "./telegram-client.js";

export const timeOptions = () => {
  let opts = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m === 30) continue;
      const t = `${h.toString().padStart(2, 0)}:${m.toString().padStart(2, 0)}`;
      opts.push(`<option value="${t}">${t}</option>`);
    }
  }
  return opts.join("");
};

const timeToMinutes = t => t.split(":").map(Number).reduce((h, m) => h * 60 + m, 0);

const allTimeSlots = [];
for (let h = 9; h <= 18; h++) {
  allTimeSlots.push(`${h.toString().padStart(2,0)}:00`, `${h.toString().padStart(2,0)}:30`);
}
allTimeSlots.pop();

// Правильная проверка свободного времени
const isRangeFree = (dateStr, startTime, duration) => {
  const start = timeToMinutes(startTime);
  const end = start + duration;

  return allTimeSlots.every(slot => {
    const slotMin = timeToMinutes(slot);
    if (slotMin < start || slotMin >= end) return true;

    const conflict = store.bookings.some(b => {
      if (b.date !== dateStr) return false;
      if (b.blocked && b.time === "00:00") return true;

      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + (b.duration || 30);
      return slotMin >= bStart && slotMin < bEnd;
    });

    return !conflict;
  });
};

// Запись клиента
export const openUserBookingModal = (date) => {
  const dateStr = formatDate(date);
  const limit = new Date();
  limit.setHours(limit.getHours() + store.timeLimitHours);
  if (date < limit) return toast("Запись слишком близко", "error");

  const blockedWholeDay = store.bookings.some(b => b.date === dateStr && b.blocked && b.time === "00:00");
  if (blockedWholeDay) return toast("День заблокирован", "error");

  const existing = store.bookings.filter(b => b.date === dateStr && !b.blocked);

showModal(`
  <h3>Запись на ${dateStr}</h3>
  
  <label>Ваше имя *</label>
  <input type="text" id="clientName" placeholder="Иван Иванов" required>

  <label>Телефон *</label>
  <input type="tel" id="clientPhone" placeholder="+7 (999) 123-45-67" required>

  <label>Telegram (для подтверждения и напоминаний)</label>
  <input 
    type="text" 
    id="clientTelegram" 
    placeholder="79161234567 или @ivanov_123" 
    style="font-size:0.95em; padding:12px; border-radius:8px; border:1px solid #ddd;"
  >

  <div style="background:#f0f8ff; padding:12px; border-radius:8px; margin:12px 0; font-size:0.9em; color:#2c5282; line-height:1.4;">
    <strong>Как получать сообщения в Telegram:</strong><br>
    1. Напишите нашему боту <strong>@ТвойБот</strong> любое сообщение (например, «Привет»)<br>
    2. Укажите здесь ваш номер Telegram (без +7) или @ник<br>
    → Вы получите подтверждение сразу и напоминание за час до записи
  </div>

  <label>Услуга</label>
  <select id="service">
    ${store.services.length === 0 
      ? "<option>Нет услуг</option>"
      : store.services.map(s => 
          `<option value="${s.id}" data-duration="${s.duration}">${s.name} (${s.duration} мин)</option>`
        ).join("")}
  </select>

  <label>Время</label>
  <select id="time">${timeOptions()}</select>

  <div id="hint" style="margin:12px 0; color:#e67e22; min-height:22px; font-weight:500;"></div>

  ${existing.length ? `
    <div style="background:#fff8e1; padding:12px; border-radius:8px; margin:12px 0; font-size:0.9em;">
      <strong>Уже занято:</strong><br>
      ${existing.map(b => `${b.clientName} — ${b.serviceName} в ${b.time}`).join("<br>")}
    </div>
  ` : ""}

  <div class="buttons">
    <button class="secondary" onclick="window.closeModal()">Отмена</button>
    <button class="primary" id="bookBtn">Записаться</button>
  </div>
`);

  const nameInput = document.getElementById("clientName");
  const phoneInput = document.getElementById("clientPhone");
  const serviceSel = document.getElementById("service");
  const timeSel = document.getElementById("time");
  const hint = document.getElementById("hint");

  const updateTimes = () => {
    if (!serviceSel.value) { hint.textContent = "Выберите услугу"; return; }
    const duration = Number(serviceSel.selectedOptions[0].dataset.duration) || 30;
    let freeCount = 0;

    Array.from(timeSel.options).forEach(opt => {
      const free = isRangeFree(dateStr, opt.value, duration);
      opt.disabled = !free;
      opt.textContent = free ? opt.value : opt.value + " (занято)";
      if (free) freeCount++;
    });

    hint.textContent = freeCount ? `Свободно: ${freeCount} слотов` : "Нет свободного времени";
  };

  serviceSel.onchange = updateTimes;
  setTimeout(updateTimes, 50);

 document.getElementById("bookBtn").onclick = async () => {
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const telegramRaw = document.getElementById("clientTelegram").value.trim();
  const service = store.services.find(s => s.id === serviceSel.value);
  const time = timeSel.value;

  // Проверка обязательных полей
  if (!name || !phone || !service || timeSel.selectedOptions[0].disabled) {
    toast("Заполните все поля и выберите свободное время", "error");
    return;
  }

  // ───── Обработка Telegram ID ─────
  let telegramId = null;
  if (telegramRaw) {
    const cleaned = telegramRaw.replace(/\D/g, "");           // оставляем только цифры
    if (cleaned.length >= 10) {
      telegramId = cleaned.startsWith("8")
        ? "7" + cleaned.slice(1)   // 8 → 7 (российский номер)
        : cleaned;
    }
  }

  try {
    // Сохраняем запись в Firestore
    await addBooking({
      date: dateStr,
      time,
      clientName: name,
      clientPhone: phone,
      clientTelegramId: telegramId || null,   // сохраняем ID или null
      serviceName: service.name,
      duration: service.duration,
      blocked: false,
      reminderSent: false                     // важно для напоминаний за час
    });

    // ───── Подтверждение клиенту в Telegram ─────
    if (telegramId) {
     sendConfirmationToClient(
        telegramId,
        name,
        service.name,
        service.duration,
        dateStr,
        time,
        false               // false = это подтверждение, а не напоминание
      );
    }

    // ───── Уведомление админу (как было раньше) ─────
    sendTelegramNotification({
      clientName: name,
      clientPhone: phone,
      serviceName: service.name,
      duration: service.duration,
      date: dateStr,
      time: time
    });

    toast(`Вы записаны!\n${name}, ${dateStr} в ${time}`, "success");
    window.closeModal();
  } catch (e) {
    console.error(e);
    toast("Ошибка записи", "error");
  }
};
};

// Админская модалка дня
export const openAdminDayModal = (date) => {
  const dateStr = formatDate(date);
  const blockedWholeDay = store.bookings.find(b => b.date === dateStr && b.blocked && b.time === "00:00");
  const timeBlocks = store.bookings.filter(b => b.date === dateStr && b.blocked && b.time !== "00:00");
  const regularBookings = store.bookings.filter(b => b.date === dateStr && !b.blocked);

  showModal(`
    <h3>Администрирование: ${dateStr}</h3>

    ${blockedWholeDay ? `
      <div style="background:#ffebee;padding:16px;border-radius:12px;margin:15px 0;color:#c62828;border:1px solid #ffcdd2;">
        <strong>День полностью заблокирован</strong><br>
        Причина: ${blockedWholeDay.name}
        <button class="danger" style="margin-top:10px;" onclick="unblockDay('${dateStr}')">
          Разблокировать весь день
        </button>
      </div>
    ` : `
      <div style="background:#e8f5e8;padding:16px;border-radius:12px;margin:15px 0;border:1px solid #c8e6c9;">
        <button class="danger" onclick="blockWholeDay('${dateStr}')">Заблокировать весь день</button>
        <button class="primary" style="margin-left:10px;" onclick="blockTimeSlot('${dateStr}')">Заблокировать время</button>
      </div>
    `}

    ${timeBlocks.length > 0 ? `
      <div style="margin:20px 0;padding:12px;background:#fff3cd;border-radius:8px;border:1px solid #ffeaa7;">
        <strong>Заблокированные слоты:</strong><br>
        ${timeBlocks.map(b => `
          <div style="margin:8px 0;padding:10px;background:white;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <span>
              <strong>${b.time}</strong> – ${window.formatTimeEnd(b.time, b.duration)}<br>
              <em>${b.name}</em>
            </span>
            <button class="danger" style="font-size:0.8rem;" onclick="unblockTimeSlot('${b.id}')">Разблокировать</button>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <h4 style="margin-top:20px;">Записи (${regularBookings.length})</h4>
    ${regularBookings.length === 0 
      ? "<p style='color:#95a5a6;'>Нет записей</p>"
      : regularBookings.map(b => `
        <div style="padding:14px;background:#f8f9fa;border-radius:12px;margin:10px 0;border-left:5px solid #4361ee;">
          <div style="font-weight:600; font-size:1.1em;">
            ${b.clientName || "Клиент"}
          </div>
          <div style="color:#3498db; margin:4px 0;">
            ${b.serviceName || "Услуга"}
          </div>
          <div style="color:#2c3e50;">
            <strong>${b.time}</strong> (${b.duration} мин)
          </div>
          <div style="color:#7f8c8d; font-size:0.9em; margin-top:4px;">
            ☎ ${b.clientPhone || "—"}
          </div>
          <div style="margin-top:10px;">
            <button onclick="window.editBooking('${b.id}')">Изменить</button>
            <button class="danger" style="margin-left:8px;" onclick="window.cancelBooking('${b.id}')">Отмена</button>
          </div>
        </div>
      `).join("")}

    <div class="buttons" style="margin-top:25px;">
      <button class="secondary" onclick="window.closeModal()">Закрыть</button>
    </div>
  `);
};

// Редактирование записи
export const openEditBookingModal = (bookingId) => {
  const booking = store.bookings.find(b => b.id === bookingId);
  if (!booking || booking.blocked) return;

  const dateStr = booking.date;

  showModal(`
    <h3>Редактирование записи</h3>
    <p><strong>Дата:</strong> ${dateStr}</p>

    <label>Имя клиента</label>
    <input type="text" id="editClientName" value="${booking.clientName || ''}">

    <label>Телефон</label>
    <input type="tel" id="editClientPhone" value="${booking.clientPhone || ''}">

    <label>Услуга</label>
    <select id="editService">
      ${store.services.map(s => `
        <option value="${s.id}" data-duration="${s.duration}" ${s.name === booking.serviceName ? "selected" : ""}>
          ${s.name} (${s.duration} мин)
        </option>
      `).join("")}
    </select>

    <label>Время</label>
    <select id="editTime">${timeOptions()}</select>

    <label>Комментарий к переносу</label>
    <input type="text" id="editComment" placeholder="Например: по просьбе клиента">

    <div id="editHint" style="margin:10px 0;color:#e67e22;min-height:20px;"></div>

    <div class="buttons">
      <button class="secondary" onclick="window.closeModal()">Отмена</button>
      <button class="primary" id="saveEditBtn">Сохранить</button>
    </div>
  `);

  const nameInput = document.getElementById("editClientName");
  const phoneInput = document.getElementById("editClientPhone");
  const serviceSel = document.getElementById("editService");
  const timeSel = document.getElementById("editTime");
  const hint = document.getElementById("editHint");

  timeSel.value = booking.time;

  const updateTimes = () => {
    const duration = Number(serviceSel.selectedOptions[0].dataset.duration);
    let free = 0;
    Array.from(timeSel.options).forEach(opt => {
      const isCurrent = opt.value === booking.time;
      const available = isCurrent || isRangeFree(dateStr, opt.value, duration);
      opt.disabled = !available;
      opt.textContent = available ? opt.value : opt.value + " (занято)";
      if (available) free++;
    });
    hint.textContent = free ? `Доступно: ${free} слотов` : "Нет свободного времени";
  };

  serviceSel.onchange = updateTimes;
  setTimeout(updateTimes, 50);

  document.getElementById("saveEditBtn").onclick = async () => {
    const newName = nameInput.value.trim();
    const newPhone = phoneInput.value.trim();
    const newService = store.services.find(s => s.id === serviceSel.value);
    const newTime = timeSel.value;
    const comment = document.getElementById("editComment").value.trim();

    if (!newName || !newPhone || !newService) {
      return toast("Заполните все поля", "error");
    }

    if (timeSel.selectedOptions[0].disabled && newTime !== booking.time) {
      return toast("Выберите свободное время", "error");
    }

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        clientName: newName,
        clientPhone: newPhone,
        serviceName: newService.name,
        duration: newService.duration,
        time: newTime,
        comment: comment || null
      });

      toast("Запись обновлена", "success");
      if (comment) toast(`Комментарий: ${comment}`, "info");
      window.closeModal();
    } catch (e) {
      toast("Ошибка сохранения", "error");
    }
  };
};