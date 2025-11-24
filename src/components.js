// src/components.js — ФИНАЛЬНАЯ ВЕРСИЯ С CLIENTID + FINGERPRINTJS (24.11.2025)

import { store, subscribe } from "./store.js";
import { showModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";
import { addBooking, db } from "./firebase.js";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { sendTelegramNotification } from "./telegram.js";
import { sendConfirmationToClient } from "./telegram-client.js";

// ======================== FINGERPRINTJS — УНИКАЛЬНЫЙ CLIENTID ========================
let clientId = localStorage.getItem('clientId');

const initClientId = async () => {
  if (clientId) return clientId;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    clientId = result.visitorId;
    localStorage.setItem('clientId', clientId);
    console.log("Client ID сгенерирован (FingerprintJS):", clientId);
  } catch (err) {
    clientId = 'fallback_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('clientId', clientId);
    console.warn("FingerprintJS не загрузился, используется fallback ID:", clientId);
  }
  return clientId;
};

// Запускаем сразу — чтобы clientId был готов к моменту записи
initClientId();

// ======================== УСЛУГИ — РЕАЛТАЙМ ========================
let services = [];
let servicesUnsubscribe = null;

const initServices = () => {
  if (servicesUnsubscribe) return;

  const q = query(collection(db, "services"));
  servicesUnsubscribe = onSnapshot(q, (snapshot) => {
    services = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Дефолтные услуги для админа
    if (services.length === 0 && store.isAdmin) {
      const defaults = [
        { name: "Маникюр + гель-лак", duration: 120, price: 2500 },
        { name: "Комбинированный маникюр", duration: 90, price: 1800 },
        { name: "Педикюр", duration: 90, price: 2200 }
      ];
      defaults.forEach(async (s, i) => {
        await setDoc(doc(db, "services", (i + 1).toString()), s);
      });
    }

    forceUpdateClientSelect();
    updateAdminServiceEditor();
  }, (err) => {
    console.error("Ошибка загрузки услуг:", err);
    toast("Ошибка загрузки услуг", "error");
  });
};
initServices();

// ======================== ОБНОВЛЕНИЕ СЕЛЕКТА У КЛИЕНТА ========================
const forceUpdateClientSelect = () => {
  const select = document.getElementById("service");
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = `
    <option value="">${services.length === 0 ? "Загрузка услуг..." : "Выберите услугу"}</option>
    ${services.map(s => `
      <option value="${s.id}" ${s.id === currentValue ? "selected" : ""}>
        ${s.name} — ${s.price}₽ (${s.duration} мин)
      </option>
    `).join("")}
  `;

  if (services.length > 0) select.style.color = "#333";
};

// ======================== ВРЕМЯ ========================
const allTimeSlots = [];
for (let h = 9; h <= 18; h++) {
  allTimeSlots.push(`${h.toString().padStart(2, "0")}:00`, `${h.toString().padStart(2, "0")}:30`);
}
allTimeSlots.pop();

const timeToMinutes = t => t.split(":").map(Number).reduce((h, m) => h * 60 + m, 0);

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
      const bEnd = bStart + (b.duration || 60);
      return slotMin >= bStart && slotMin < bEnd;
    });
  });
};

// ======================== ГЛАВНАЯ ФУНКЦИЯ ========================
export function showBookingModal(dateISO) {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return toast("Неверная дата", "error");

  if (!store.isAdmin) {
    const limit = new Date();
    limit.setHours(limit.getHours() + (store.timeLimitHours || 2));
    if (new Date(dateISO) < limit) return toast("Запись возможна не ранее чем за 2 часа", "error");
    const blocked = store.bookings.some(b => b.date === dateISO && b.time === "00:00" && b.blocked);
    if (blocked) return toast("День заблокирован мастером", "error");
  }

  store.isAdmin ? openAdminModal(dateISO) : openClientModal(dateISO);
}

// ======================== КЛИЕНТСКАЯ МОДАЛКА ========================
const openClientModal = (dateStr) => {
  showModal(`
    <div style="position:relative;padding:20px">
      <div style="position:absolute;top:10px;right:14px;width:44px;height:44px;background:rgba(255,255,255,0.3);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;cursor:pointer;z-index:10"
           onclick="closeModal()">X</div>
      <h3 style="color:var(--primary-color,#ff6b9d);margin:0 0 24px;text-align:center;font-size:1.7rem">Запись на ${dateStr}</h3>

      <label>Ваше имя</label>
      <input type="text" id="clientName" placeholder="ФИО" value="${localStorage.getItem('clientName') || ''}" required />
      <label>Телефон</label>
      <input type="tel" id="clientPhone" placeholder="+7 (999) 123-45-67" value="${localStorage.getItem('clientPhone') || ''}" required />
      <label>Telegram ID (опционально)</label>
      <input type="text" id="telegramId" placeholder="@username или ID" />

      <label>Услуга</label>
      <select id="service" required>
        <option value="">${services.length === 0 ? "Загрузка услуг..." : "Выберите услугу"}</option>
      </select>

      <label>Время</label>
      <select id="time" required>
        <option value="">Выберите время</option>
        ${allTimeSlots.map(t => `<option value="${t}">${t}</option>`).join("")}
      </select>

      <div style="margin-top:30px;display:flex;gap:12px;justify-content:center">
        <button style="background:#888;color:white;padding:14px 28px;border:none;border-radius:50px" onclick="closeModal()">Отмена</button>
        <button style="background:var(--primary-color,#ff6b9d);color:white;padding:14px 32px;border:none;border-radius:50px;box-shadow:0 8px 25px rgba(255,107,157,0.3)"
                onclick="bookAppointment('${dateStr}')">Записаться</button>
      </div>
    </div>
  `);

  forceUpdateClientSelect();
};

// ======================== ЗАПИСЬ КЛИЕНТА — С CLIENTID!!! ========================
window.bookAppointment = async (dateStr) => {
  const clientName = document.getElementById("clientName")?.value.trim();
  const clientPhone = document.getElementById("clientPhone")?.value.trim();
  const telegramId = document.getElementById("telegramId")?.value.trim() || null;
  const serviceId = document.getElementById("service")?.value;
  const time = document.getElementById("time")?.value;

  if (!clientName || !clientPhone || !serviceId || !time) return toast("Заполните все поля", "error");

  const service = services.find(s => s.id === serviceId);
  if (!service) return toast("Выберите услугу", "error");
  if (!isRangeFree(dateStr, time, service.duration)) return toast("Время уже занято", "error");

  // Ждём готовности clientId
  const finalClientId = clientId || await initClientId();

  try {
    await addBooking({
      date: dateStr,
      time,
      clientName,
      clientPhone,
      telegramId,
      serviceId: service.id,
      serviceName: service.name,
      duration: service.duration,
      price: service.price,
      clientId: finalClientId,  // ← КЛЮЧЕВОЕ ПОЛЕ!
      timestamp: new Date().toISOString()
    });

    await sendTelegramNotification({ date: dateStr, time, clientName, serviceName: service.name, clientPhone, telegramId });
    if (telegramId) await sendConfirmationToClient(telegramId, clientName, service.name, service.duration, dateStr, time);

    localStorage.setItem('clientName', clientName);
    localStorage.setItem('clientPhone', clientPhone);

    toast("Вы успешно записаны!", "success");
    closeModal();
  } catch (e) {
    console.error(e);
    toast("Ошибка записи", "error");
  }
};

// ======================== АДМИНКА — БЕЗ ИЗМЕНЕНИЙ ========================
let currentAdminDate = null;
let adminUnsubscribe = null;

const openAdminModal = (dateStr) => {
  currentAdminDate = dateStr;
  if (adminUnsubscribe) adminUnsubscribe();

  showModal(`<div id="adminModalInner" style="position:relative"></div>`);
  renderAdminContent();
  adminUnsubscribe = subscribe(renderAdminContent);
};

const renderAdminContent = () => {
  if (!currentAdminDate) return;
  const date = currentAdminDate;
  const blocked = store.bookings.some(b => b.date === date && b.time === "00:00" && b.blocked);
  const bookings = store.bookings.filter(b => b.date === date && b.time !== "00:00" && !b.blocked);

  const container = document.getElementById("adminModalInner");
  if (!container) return;

  container.innerHTML = `
    <div style="position:absolute;top:10px;right:14px;width:44px;height:44px;background:rgba(255,255,255,0.3);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;cursor:pointer;z-index:10"
         onclick="closeAdminModal()">X</div>

    <h3 style="color:var(--primary-color,#ff6b9d);text-align:center;margin:0 0 24px;font-size:1.8rem">Управление: ${date}</h3>

    <div style="margin:20px 0;padding:20px;background:#fff0f5;border-radius:20px;text-align:center">
      ${blocked
        ? `<button onclick="unblockDay('${date}')" style="background:#4caf50;color:white;padding:18px 40px;border:none;border-radius:50px;font-size:1.2rem">Разблокировать день</button>`
        : `<button onclick="blockDay('${date}')" style="background:var(--primary-color,#ff6b9d);color:white;padding:18px 40px;border:none;border-radius:50px;font-size:1.2rem">Заблокировать день</button>`
      }
    </div>

    <div style="margin:30px 0;padding:20px;background:#f8f4fc;border-radius:20px;text-align:center">
      <button onclick="openServiceEditor()" style="background:var(--primary-color,#ff6b9d);color:white;padding:14px 30px;border:none;border-radius:50px">Редактировать услуги (${services.length})</button>
    </div>

    <h4 style="color:var(--primary-color,#ff6b9d);margin:24px 0 12px">Записи (${bookings.length})</h4>
    ${bookings.length === 0 ? `<p style="text-align:center;color:#aaa;padding:20px">Нет записей</p>` : bookings.map(b => {
      const s = services.find(x => x.id === b.serviceId) || {};
      return `<div style="background:#fff0f5;padding:18px;border-radius:20px;margin:12px 0;border-left:5px solid var(--primary-color,#ff6b9d)">
        <div style="font-weight:700;color:var(--primary-color,#ff6b9d)">${b.time} — ${b.clientName}</div>
        <div>${s.name || b.serviceName || "—"} — ${s.price || b.price || "?"}₽ (${s.duration || b.duration || "?"} мин)</div>
        <div style="margin-top:8px;color:#555;font-size:0.9rem">Тел: ${b.clientPhone || "—"} | TG: ${b.telegramId || "—"}</div>
        <div style="margin-top:12px;display:flex;gap:10px">
          <button onclick="deleteBooking('${b.id}')" style="background:#ef476f;color:white;padding:10px 20px;border:none;border-radius:50px">Удалить</button>
        </div>
      </div>`;
    }).join("")}

    <div style="margin-top:30px;text-align:center">
      <button style="background:#888;color:white;padding:14px 40px;border:none;border-radius:50px" onclick="closeAdminModal()">Закрыть</button>
    </div>
  `;
};

const updateAdminServiceEditor = () => {
  const container = document.getElementById("servicesList");
  if (!container) return;

  container.innerHTML = services.map(s => `
    <div style="background:#fff;padding:16px;border-radius:16px;margin:12px 0;box-shadow:0 4px 15px rgba(0,0,0,0.1);position:relative">
      <input type="text" value="${s.name}" data-id="${s.id}" data-field="name" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:12px;margin-bottom:8px;font-weight:600">
      <div style="display:flex;gap:10px">
        <input type="number" value="${s.duration}" data-id="${s.id}" data-field="duration" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:12px">
        <input type="number" value="${s.price}" data-id="${s.id}" data-field="price" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:12px">
      </div>
      <button onclick="deleteService('${s.id}')" style="position:absolute;top:8px;right:8px;background:#ef476f;color:white;padding:6px 12px;border:none;border-radius:50px;font-size:0.9rem">Удалить</button>
    </div>
  `).join("");

  container.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", async () => {
      const id = input.dataset.id;
      const field = input.dataset.field;
      const value = field === "price" || field === "duration" ? Number(input.value) || 0 : input.value.trim();
      if (field === "name" && !value) return toast("Название не может быть пустым", "error");
      await setDoc(doc(db, "services", id), { [field]: value }, { merge: true });
    });
  });
};

// Остальные функции (редактор услуг, блокировка и т.д.) — без изменений
window.openServiceEditor = () => {
  showModal(`
    <div style="position:relative;padding:20px">
      <div style="position:absolute;top:10px;right:14px;width:44px;height:44px;background:rgba(255,255,255,0.3);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;cursor:pointer"
           onclick="closeModal()">X</div>
      <h3 style="color:var(--primary-color,#ff6b9d);text-align:center;margin-bottom:24px">Редактор услуг</h3>
      <div id="servicesList"></div>
      <button onclick="addNewService()" style="background:var(--primary-color,#ff6b9d);color:white;padding:14px 30px;border:none;border-radius:50px;margin:20px auto;display:block">+ Добавить услугу</button>
      <div style="text-align:center">
        <button style="background:#888;color:white;padding:14px 40px;border:none;border-radius:50px" onclick="closeModal()">Закрыть</button>
      </div>
    </div>
  `);
  updateAdminServiceEditor();
};

window.addNewService = async () => {
  const newId = Date.now().toString();
  await setDoc(doc(db, "services", newId), { name: "Новая услуга", duration: 60, price: 2000 });
};

window.deleteService = async (id) => {
  if (confirm("Удалить услугу?")) await deleteDoc(doc(db, "services", id));
};

window.closeAdminModal = () => {
  if (adminUnsubscribe) { adminUnsubscribe(); adminUnsubscribe = null; }
  currentAdminDate = null;
  closeModal();
};

window.blockDay = async (dateStr) => {
  if (confirm("Заблокировать день?")) {
    await addBooking({ date: dateStr, time: "00:00", blocked: true, clientName: "Мастер" });
    toast("День заблокирован", "info");
  }
};

window.unblockDay = async (dateStr) => {
  const entry = store.bookings.find(b => b.date === dateStr && b.time === "00:00" && b.blocked);
  if (entry && confirm("Разблокировать день?")) {
    await deleteDoc(doc(db, "bookings", entry.id));
    toast("День разблокирован", "success");
  }
};

window.deleteBooking = async (id) => {
  if (confirm("Удалить запись?")) {
    await deleteDoc(doc(db, "bookings", id));
    toast("Запись удалена", "info");
  }
};

export {};