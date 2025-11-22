// src/calendar.js — ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ (22.11.2025) с изменениями для прошедших дней

import { store, prevMonth, nextMonth, subscribe } from "./store.js";
import { isPastDate } from "./date.js"; // Добавлен импорт для проверки прошедших дат

const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Получаем текущую дату из store
const getCurrentDate = () => store.currentDate || new Date();

export function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const currentDate = getCurrentDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Обновляем заголовок месяца
  const monthTitle = document.getElementById("currentMonth");
  if (monthTitle) {
    monthTitle.textContent = currentDate
      .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
      .replace(/^\w/, c => c.toUpperCase());
  }

  const firstDay = new Date(year, month, 1).getDay(); // 0 = вс
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Пн — первый день недели

  calendarEl.innerHTML = "";

  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    // ДЕСКТОП — СЕТКА 7 колонок
    daysOfWeek.forEach(dayName => {
      const header = document.createElement("div");
      header.textContent = dayName;
      header.style.cssText = "font-weight:600; text-align:center; padding:16px 8px; color:#ff6b9d; font-size:1rem;";
      calendarEl.appendChild(header);
    });

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    // ДЕСКТОП ВЕРСИЯ
for (let day = 1; day <= daysInMonth; day++) {
  const currentDateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const dayEl = document.createElement("div");
  dayEl.className = "day";

  const dayBookings = store.bookings.filter(b => b.date === currentDateISO);

  const isToday = currentDateISO === new Date().toISOString().split('T')[0];
  const isPast = new Date(currentDateISO) < new Date().setHours(0,0,0,0);

  if (isPast) dayEl.classList.add("past");

  dayEl.innerHTML = `
    <div style="font-weight:700;font-size:1.3rem;color:${isPast ? '#aaa' : '#ff6b9d'};margin-bottom:8px">${day}</div>
    <div style="font-size:0.9rem;line-height:1.5;">
      ${dayBookings.length === 0
        ? (isPast ? '' : '<div style="color:#aaa;font-style:italic">Свободно</div>')
        : dayBookings.map(b => 
            `<div style="margin:4px 0;padding:6px 10px;background:#fff0f5;border-radius:10px;font-size:0.85rem">
              ${b.time} — ${b.name || b.clientName || "Клиент"}
            </div>`
          ).join("")
      }
    </div>
  `;

  if (isToday) {
    dayEl.style.border = "3px solid #ff6b9d";
    dayEl.style.background = "#fff0f5";
    dayEl.style.borderRadius = "16px";
  }

  // ← ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ:
  dayEl.onclick = () => {
    import("./components.js").then(mod => mod.showBookingModal(currentDateISO));
  };

  calendarEl.appendChild(dayEl);
}
  } else {
   // МОБИЛЬНАЯ ВЕРСИЯ
for (let day = 1; day <= daysInMonth; day++) {
  const currentDateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // ... весь код как был ...

  mobileDay.onclick = () => {
    import("./components.js").then(mod => mod.showBookingModal(currentDateISO));
  };

  calendarEl.appendChild(mobileDay);
}
  }
}

// Подписываемся на изменения в store — будет перерисовываться автоматически
subscribe(renderCalendar);