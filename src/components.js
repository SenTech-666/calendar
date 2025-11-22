// src/components.js — АБСОЛЮТНО ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ (22.11.2025)

import { store, subscribe } from "./store.js";
import { showModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { addBooking } from "./firebase.js";
import { db } from "./firebase.js";
import { deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { sendTelegramNotification } from "./telegram.js";
import { sendConfirmationToClient } from "./telegram-client.js";

// Временные услуги (можно будет заменить на загрузку из Firebase)
const SERVICES = [
  { id: "1", name: "Маникюр + гель-лак", duration: 120 },
  { id: "2", name: "Комбинированный маникюр", duration: 90 },
  { id: "3", name: "Педикюр", duration: 90 }
];

// Генерация времени
const allTimeSlots = [];
for (let h = 9; h <= 18; h++) {
  allTimeSlots.push(`${h.toString().padStart(2,0)}:00`, `${h.toString().padStart(2,0)}:30`);
}
allTimeSlots.pop();

const timeToMinutes = t => t.split(":").map(Number).reduce((h, m) => h * 60 + m, 0);

// Проверка свободности слота
const isRangeFree = (dateStr, startTime, duration) => {
  const start = timeToMinutes(startTime);
  const end = start + duration;
  return allTimeSlots.every(slot => {
    const slotMin = timeToMinutes(slot);
    if (slotMin < start || slotMin >= end) return true;
    return !store.bookings.some(b => {
      if (b.date !== dateStr) return false;
      if (b.time === "00:00" && b.blocked) return true;
      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + (b.duration || 30);
      return slotMin >= bStart && slotMin < bEnd;
    });
  });
};

// ГЛАВНАЯ ФУНКЦИЯ — теперь принимает ISO-строку "2025-11-23"
export function showBookingModal(dateISO) {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return toast("Неверная дата", "error");
  }

  const dateStr = dateISO;

  // Ограничения для клиентов
  if (!store.isAdmin) {
    const limit = new Date();
    limit.setHours(limit.getHours() + (store.timeLimitHours || 2));
    if (new Date(dateISO) < limit) {
      return toast("Запись возможна не ранее чем за 2 часа", "error");
    }

    const blocked = store.bookings.some(b => b.date === dateStr && b.time === "00:00" && b.blocked);
    if (blocked) return toast("День заблокирован мастером", "error");
  }

  if (store.isAdmin) {
    openAdminDayModal(dateStr);
  } else {
    openUserBookingModal(dateStr);
  }
}

// === КЛИЕНТСКАЯ МОДАЛКА ===
export const openUserBookingModal = (dateStr) => {
  const availableTimes = allTimeSlots.filter(t => isRangeFree(dateStr, t, 30));

  showModal(`
    <h3 style="color:#ff6b9d;margin-bottom:20px">Запись на ${dateStr}</h3>
    <label>Ваше имя</label>
    <input type="text" id="clientName" placeholder="ФИО" required />
    <label>Телефон</label>
    <input type="tel" id="clientPhone" placeholder="+7 (999) 123-45-67" required />
    <label>Telegram ID (опционально)</label>
    <input type="text" id="telegramId" placeholder="@username или ID" />
    <label>Услуга</label>
    <select id="service" required>
      ${SERVICES.map(s => `<option value="${s.id}">${s.name} (${s.duration} мин)</option>`).join("")}
    </select>
    <label>Время</label>
    <select id="time" required>
      <option value="">Выберите время</option>
      ${availableTimes.map(t => `<option value="${t}">${t}</option>`).join("")}
    </select>
    <div class="buttons" style="margin-top:25px;">
      <button class="secondary" onclick="closeModal()">Отмена</button>
      <button class="primary" onclick="bookAppointment('${dateStr}')">Записаться</button>
    </div>
  `);
};

// === АДМИНСКАЯ МОДАЛКА С ЖИВЫМ ОБНОВЛЕНИЕМ ===
let currentAdminModalDate = null;

const renderAdminModalContent = () => {
  if (!currentAdminModalDate) return;
  const dateStr = currentAdminModalDate;

  const blockedEntry = store.bookings.find(b => b.date === dateStr && b.time === "00:00" && b.blocked);
  const isBlocked = !!blockedEntry;

  const regular = store.bookings.filter(b =>
    b.date === dateStr &&
    b.time !== "00:00" &&
    b.blocked !== true
  );

  const modalContent = document.querySelector("#modal-root .modal > div") || document.querySelector("#modal-root .modal");
  if (!modalContent) return;

  modalContent.innerHTML = `
    <h3 style="color:#ff6b9d;margin-bottom:20px">Управление: ${dateStr}</h3>
    
    <div style="margin-bottom:30px;padding:20px;background:#fff0f5;border-radius:18px">
      <h4 style="color:#ff6b9d;margin-bottom:15px">Блокировка дня</h4>
      ${isBlocked
        ? `<button class="primary" onclick="unblockDay('${dateStr}')" style="padding:18px 32px;font-size:1.2rem;min-width:280px;border-radius:50px;box-shadow:0 10px 30px rgba(239,71,111,0.4);font-weight:600">
             Разблокировать весь день
           </button>`
        : `<button class="primary" onclick="blockDay('${dateStr}')" style="padding:18px 32px;font-size:1.2rem;min-width:280px;border-radius:50px;box-shadow:0 10px 30px rgba(255,107,157,0.3);font-weight:600">
             Заблокировать весь день
           </button>`
      }
    </div>

    <h4 style="margin:20px 0 10px;color:#ff6b9d">Записи (${regular.length})</h4>
    ${regular.length === 0
      ? `<p style="text-align:center;color:#aaa;font-style:italic">Нет записей</p>`
      : regular.map(b => `
          <div style="background:#fff0f5;padding:16px;border-radius:18px;margin:12px 0;box-shadow:0 4px 15px rgba(255,107,157,0.1);border-left:4px solid #ff6b9d">
            <div style="font-weight:600;color:#ff6b9d">${b.time} — ${b.clientName} (${b.serviceName} ${b.duration} мин)</div>
            <div style="margin:6px 0">Тел: ${b.clientPhone || "—"} | TG: ${b.telegramId || "—"}</div>
            <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
              <button onclick="editBooking('${b.id}')" style="background:#ff6b9d;color:white;padding:8px 16px;border:none;border-radius:50px;font-size:0.9rem">
                Изменить
              </button>
              <button onclick="deleteBooking('${b.id}')" style="background:#ef476f;color:white;padding:8px 16px;border:none;border-radius:50px;font-size:0.9rem">
                Отменить
              </button>
            </div>
          </div>
        `).join("")
    }

    <div class="buttons" style="margin-top:30px">
      <button class="secondary" onclick="closeModal()">Закрыть</button>
    </div>
  `;
};

const openAdminDayModal = (dateStr) => {
  currentAdminModalDate = dateStr;
  showModal(`<div></div>`);
  renderAdminModalContent();

  const unsubscribe = subscribe(() => {
    if (currentAdminModalDate) renderAdminModalContent();
  });

  const oldClose = closeModal;
  window.closeModal = () => {
    unsubscribe();
    currentAdminModalDate = null;
    oldClose();
  };
};

// === РЕДАКТИРОВАНИЕ ===
window.editBooking = (id) => {
  const b = store.bookings.find(x => x.id === id);
  if (!b) return toast("Запись не найдена", "error");

  showModal(`
    <h3 style="color:#ff6b9d;margin-bottom:20px">Редактировать запись</h3>
    <label>Дата</label>
    <input type="date" id="editDate" value="${b.date}" />
    <label>Время</label>
    <input type="time" id="editTime" value="${b.time}" step="1800" />
    <label>Услуга</label>
    <select id="editService">
      ${SERVICES.map(s => `<option value="${s.id}" ${s.id === (b.serviceId || "1") ? "selected" : ""}>${s.name} (${s.duration} мин)</option>`).join("")}
    </select>
    <label>Имя клиента</label>
    <input type="text" id="editClientName" value="${b.clientName || ""}" />
    <label>Телефон</label>
    <input type="tel" id="editClientPhone" value="${b.clientPhone || ""}" />
    <label>Telegram ID</label>
    <input type="text" id="editTelegramId" value="${b.telegramId || ""}" />
    <div class="buttons" style="margin-top:25px;">
      <button class="secondary" onclick="closeModal()">Отмена</button>
      <button class="primary" onclick="saveEdit('${id}', '${b.date}')">Сохранить</button>
    </div>
  `);
};

window.saveEdit = async (id, oldDate) => {
  const newDate = document.getElementById("editDate").value;
  const newTime = document.getElementById("editTime").value;
  const serviceId = document.getElementById("editService").value;
  const service = SERVICES.find(s => s.id === serviceId);
  const clientName = document.getElementById("editClientName").value.trim();
  const clientPhone = document.getElementById("editClientPhone").value.trim();
  const telegramId = document.getElementById("editTelegramId").value.trim();

  if (!newDate || !newTime || !clientName) return toast("Заполните обязательные поля", "error");
  if (newDate !== oldDate || newTime !== store.bookings.find(b => b.id === id).time) {
    if (!isRangeFree(newDate, newTime, service.duration)) {
      return toast("Это время уже занято", "error");
    }
  }

  try {
    await updateDoc(doc(db, "bookings", id), {
      date: newDate,
      time: newTime,
      serviceId, serviceName: service.name, duration: service.duration,
      clientName, clientPhone, telegramId: telegramId || null,
      updatedAt: new Date().toISOString()
    });

    if (telegramId) {
      await sendConfirmationToClient(telegramId, clientName, service.name, service.duration, newDate, newTime);
    }

    toast("Запись обновлена", "success");
    closeModal();
  } catch (e) {
    console.error(e);
    toast("Ошибка сохранения", "error");
  }
};

// === БЛОКИРОВКА / РАЗБЛОКИРОВКА / УДАЛЕНИЕ ===
window.blockDay = async (dateStr) => {
  if (!confirm("Заблокировать весь день?")) return;
  await addBooking({ date: dateStr, time: "00:00", blocked: true, clientName: "Мастер" });
  toast("День заблокирован", "info");
  closeModal();
};

window.unblockDay = async (dateStr) => {
  const entry = store.bookings.find(b => b.date === dateStr && b.time === "00:00" && b.blocked);
  if (!entry || !confirm("Разблокировать день?")) return;
  await deleteDoc(doc(db, "bookings", entry.id));
  toast("День разблокирован", "success");
  closeModal();
};

window.deleteBooking = async (id) => {
  if (!confirm("Удалить запись?")) return;
  await deleteDoc(doc(db, "bookings", id));
  toast("Запись удалена", "info");
  closeModal();
};

// === ЗАПИСЬ КЛИЕНТА ===
window.bookAppointment = async (dateStr) => {
  const clientName = document.getElementById("clientName").value.trim();
  const clientPhone = document.getElementById("clientPhone").value.trim();
  const telegramId = document.getElementById("telegramId").value.trim();
  const serviceId = document.getElementById("service").value;
  const time = document.getElementById("time").value;

  if (!clientName || !clientPhone || !serviceId || !time) return toast("Заполните все поля", "error");

  const service = SERVICES.find(s => s.id === serviceId);
  if (!isRangeFree(dateStr, time, service.duration)) return toast("Время занято", "error");

  try {
    const booking = await addBooking({
      date: dateStr,
      time,
      clientName,
      clientPhone,
      telegramId: telegramId || null,
      serviceId,
      serviceName: service.name,
      duration: service.duration
    });

    await sendTelegramNotification(booking);
    if (telegramId) {
      await sendConfirmationToClient(telegramId, clientName, service.name, service.duration, dateStr, time);
    }

    toast("Вы записаны!", "success");
    closeModal();
  } catch (e) {
    console.error(e);
    toast("Ошибка записи", "error");
  }
};