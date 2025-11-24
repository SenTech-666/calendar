// src/calendar.js — ФИНАЛЬНАЯ ВЕРСИЯ С РАБОЧИМ ОТОБРАЖЕНИЕМ СВОИХ ЗАПИСЕЙ (24.11.2025)

import { store, subscribe } from "./store.js";

const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const getCurrentDate = () => store.currentDate || new Date();

// ======================== ПОЛНЫЕ ЦВЕТОВЫЕ ТЕМЫ ========================
const themes = {
  pink:   { p: "#ff6b9d", a: "#ff8fb3", s: "#4caf50", d: "#ff6b9d", bg: "#fff8fb", text: "#333333", card: "#ffffff", border: "rgba(255,107,157,0.15)", shadow: "rgba(255,107,157,0.25)" },
  purple: { p: "#9c27b0", a: "#c969d7", s: "#66bb6a", d: "#e91e63", bg: "#f8f4fc", text: "#333333", card: "#ffffff", border: "rgba(156,39,176,0.15)", shadow: "rgba(156,39,176,0.25)" },
  teal:   { p: "#00bcd4", a: "#4dd0e1", s: "#66bb6a", d: "#ff5252", bg: "#f0fffe", text: "#333333", card: "#ffffff", border: "rgba(0,188,212,0.15)", shadow: "rgba(0,188,212,0.25)" },
  peach:  { p: "#ff8a65", a: "#ffb74d", s: "#81c784", d: "#e57373", bg: "#fff8f5", text: "#333333", card: "#ffffff", border: "rgba(255,138,101,0.15)", shadow: "rgba(255,138,101,0.25)" },
  dark:   { p: "#e91e63", a: "#f06292", s: "#66bb6a", d: "#ff5252", bg: "#121212", text: "#e0e0e0", card: "#1e1e1e", border: "rgba(233,30,99,0.2)", shadow: "rgba(233,30,99,0.3)" },
  light:  { p: "#ec407a", a: "#f06292", s: "#66bb6a", d: "#ff6b9d", bg: "#ffffff", text: "#333333", card: "#ffffff", border: "rgba(236,64,122,0.15)", shadow: "rgba(236,64,122,0.25)" }
};

// Глобальная функция — чтобы работала из модалки
window.applyTheme = (name) => {
  const t = themes[name] || themes.pink;
  const root = document.documentElement;

  root.style.setProperty('--primary-color', t.p);
  root.style.setProperty('--accent-color', t.a);
  root.style.setProperty('--success-color', t.s);
  root.style.setProperty('--danger-color', t.d);
  root.style.setProperty('--bg-color', t.bg);
  root.style.setProperty('--text-color', t.text);
  root.style.setProperty('--card-bg', t.card);
  root.style.setProperty('--border-color', t.border);
  root.style.setProperty('--shadow-color', t.shadow);

  document.body.style.background = t.bg;
  document.body.style.color = t.text;

  const upBtn = document.getElementById("scrollToTopBtn");
  const paletteBtn = document.getElementById("themePickerBtn");
  if (upBtn) upBtn.style.background = t.p;
  if (paletteBtn) paletteBtn.style.background = t.p;

  localStorage.setItem('selectedTheme', name);
};

const loadSavedTheme = () => {
  const saved = localStorage.getItem('selectedTheme');
  if (saved && themes[saved]) window.applyTheme(saved);
};

// ======================== FINGERPRINTJS — УНИКАЛЬНЫЙ ID ДАЖЕ В ИНКОГНИТО ========================
let clientId = localStorage.getItem('clientId');

const initClientId = async () => {
  if (clientId) return clientId;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    clientId = result.visitorId;
    localStorage.setItem('clientId', clientId);
    console.log("Client ID сгенерирован (FingerprintJS):", clientId);
  } catch (e) {
    clientId = 'fallback_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('clientId', clientId);
    console.warn("FingerprintJS не загрузился → fallback ID:", clientId);
  }
  return clientId;
};

// Запускаем сразу — клиент будет готов к моменту рендера
initClientId();

// ======================== ПРОВЕРКА СВОЕЙ ЗАПИСИ — ТОЛЬКО ПО CLIENTID ========================
const isCurrentUserBooking = (booking) => {
  if (store.isAdmin) return true;
  if (!clientId || !booking.clientId) return false;
  return booking.clientId === clientId;
};

// ======================== КНОПКА ПАЛИТРЫ (только админ) ========================
const createThemePicker = () => {
  if (!store.isAdmin || document.getElementById("themePickerBtn")) return;

  const btn = document.createElement("div");
  btn.id = "themePickerBtn";
  btn.innerHTML = "Palette";
  btn.title = "Сменить цветовую тему";
  btn.style.cssText = `
    position:fixed;top:12px;right:12px;width:54px;height:54px;
    background:var(--primary-color);color:white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;font-size:28px;
    box-shadow:0 6px 25px var(--shadow-color);z-index:10000;cursor:pointer;
    transition:transform 0.3s ease, box-shadow 0.3s ease;
  `;
  btn.onmouseover = () => { btn.style.transform = "scale(1.2) rotate(15deg)"; btn.style.boxShadow = "0 10px 35px var(--shadow-color)"; };
  btn.onmouseout  = () => { btn.style.transform = "scale(1)"; btn.style.boxShadow = "0 6px 25px var(--shadow-color)"; };
  document.body.appendChild(btn);

  btn.onclick = () => {
    const overlay = document.createElement("div");
    overlay.id = "themeOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:10001;";
    overlay.innerHTML = `
      <div style="background:var(--card-bg);padding:32px;border-radius:28px;max-width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;">
        <h3 style="margin:0 0 28px;color:var(--primary-color);font-size:1.6rem;">Выберите тему</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
          ${Object.keys(themes).map(n => `
            <div onclick="window.applyTheme('${n}');document.getElementById('themeOverlay')?.remove();"
                 style="width:96px;height:96px;background:${themes[n].p};border-radius:24px;
                        display:flex;align-items:center;justify-content:center;color:white;
                        font-weight:bold;font-size:14px;cursor:pointer;
                        box-shadow:0 10px 30px ${themes[n].shadow};
                        border:6px solid ${localStorage.getItem('selectedTheme')===n ? '#ffffff' : 'transparent'};
                        transition:all 0.4s ease;">
              ${n === 'pink' ? 'Розовая' : n === 'purple' ? 'Фиолет' : n === 'teal' ? 'Бирюза' : n === 'peach' ? 'Персик' : n === 'dark' ? 'Тёмная' : 'Светлая'}
            </div>
          `).join("")}
        </div>
        <button onclick="document.getElementById('themeOverlay')?.remove()"
                style="margin-top:28px;padding:14px;background:#888;color:white;border:none;border-radius:50px;width:100%;font-size:1.2rem;cursor:pointer;">
          Отмена
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  };
};

// ======================== КНОПКА "НАВЕРХ" ========================
const initScrollToTopButton = () => {
  if (document.getElementById("scrollToTopBtn")) return;

  const btn = document.createElement("div");
  btn.id = "scrollToTopBtn";
  btn.innerHTML = "Up";
  btn.style.cssText = `
    position:fixed;bottom:20px;right:20px;width:58px;height:58px;
    background:var(--primary-color);color:white;border-radius:50%;
    display:flex;align-items:center;justify-content:center;font-size:36px;
    box-shadow:0 10px 35px var(--shadow-color);z-index:9999;cursor:pointer;
    opacity:0;visibility:hidden;transition:all 0.4s ease;
  `;
  btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 350) {
      btn.style.opacity = "1";
      btn.style.visibility = "visible";
    } else {
      btn.style.opacity = "0";
      btn.style.visibility = "hidden";
    }
  });
};

// ======================== РЕНДЕР КАЛЕНДАРЯ ========================
export function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const currentDate = getCurrentDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayISO = new Date().toISOString().split("T")[0];
  const isMobile = window.innerWidth <= 768;

  // Заголовок месяца
  const titleEl = document.getElementById("currentMonth");
  if (titleEl) {
    titleEl.textContent = currentDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
      .replace(/^\w/, c => c.toUpperCase());
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  calendarEl.innerHTML = "";

  // Инициализация фич
  loadSavedTheme();
  if (isMobile) initScrollToTopButton();
  if (store.isAdmin) createThemePicker();

  if (!isMobile) {
    // Десктоп версия
    daysOfWeek.forEach(d => {
      const h = document.createElement("div");
      h.textContent = d;
      h.style.cssText = "font-weight:600;text-align:center;padding:16px;color:var(--primary-color);";
      calendarEl.appendChild(h);
    });
    for (let i = 0; i < startDay; i++) calendarEl.appendChild(document.createElement("div"));

    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = dateISO < todayISO;

      const dayEl = document.createElement("div");
      dayEl.className = "day";
      if (isPast) dayEl.classList.add("past");

      const bookings = store.bookings.filter(b => b.date === dateISO && b.time !== "00:00" && b.blocked !== true);

      const html = bookings.length === 0
        ? `<div style="color:var(--primary-color);font-weight:600">Свободно весь день</div>`
        : bookings.map(b => isCurrentUserBooking(b)
            ? `<div style="margin:8px 0;padding:12px;background:#e8f5e9;border-radius:14px;border-left:5px solid var(--success-color);font-size:0.95rem;">
                 <strong>${b.time}</strong> — Ваша запись${store.isAdmin ? "<br><small>Имя: " + b.clientName + "<br>Тел: " + b.clientPhone + "</small>" : ""}
               </div>`
            : `<div style="margin:8px 0;padding:12px;background:rgba(255,107,157,0.08);border-radius:14px;color:#aaa;font-size:0.95rem;">
                 <strong>${b.time}</strong> — Занято
               </div>`
        ).join("");

      dayEl.innerHTML = `<div style="font-weight:700;margin-bottom:10px;font-size:1.1rem">${day}</div>${html}`;
      dayEl.onclick = () => { if (isPast && !store.isAdmin) return; import("./components.js").then(m => m.showBookingModal(dateISO)); };
      calendarEl.appendChild(dayEl);
    }
  } else {
    // Мобильная версия
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dateISO < todayISO && !store.isAdmin) continue;

      const dayOfWeekIndex = (startDay + day - 1) % 7;
      const dayName = daysOfWeek[dayOfWeekIndex];

      const bookings = store.bookings.filter(b => b.date === dateISO && b.time !== "00:00" && b.blocked !== true);

      const html = bookings.length === 0
        ? `<div style="color:var(--primary-color);font-weight:600;font-size:1.3rem">Свободно</div>`
        : bookings.map(b => isCurrentUserBooking(b)
            ? `<div style="margin:14px 0;padding:18px;background:#e8f5e9;border-radius:20px;border-left:6px solid var(--success-color);">
                 <strong>${b.time}</strong> — Ваша запись${store.isAdmin ? "<br><small>Имя: " + b.clientName + "<br>Тел: " + b.clientPhone + "</small>" : ""}
               </div>`
            : `<div style="margin:14px 0;padding:18px;background:rgba(255,107,157,0.08);border-radius:20px;color:#999;">
                 <strong>${b.time}</strong> — Занято
               </div>`
        ).join("");

      const mobileDay = document.createElement("div");
      mobileDay.className = "mobile-day";
      if (dateISO === todayISO) mobileDay.classList.add("today");

      mobileDay.innerHTML = `
        <div class="mobile-day-header" style="color:var(--primary-color);">
          ${day} ${currentDate.toLocaleDateString("ru-RU", { month: "long" }).slice(0, 3)} • ${dayName}
          ${dateISO === todayISO ? " • Сегодня" : ""}
        </div>
        <div style="padding:20px 16px">${html}</div>
      `;
      mobileDay.onclick = () => import("./components.js").then(m => m.showBookingModal(dateISO));
      calendarEl.appendChild(mobileDay);
    }
  }
}

subscribe(renderCalendar);