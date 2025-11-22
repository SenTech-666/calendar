// src/calendar.js — 100% РАБОЧАЯ ВЕРСИЯ С МОБИЛЬНОЙ ПОДДЕРЖКОЙ И СКРЫТИЕМ ПРОШЕДШИХ ДНЕЙ

import { store, subscribe } from "./store.js";

const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const getCurrentDate = () => store.currentDate || new Date();

export function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  const currentDate = getCurrentDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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
  const todayISO = new Date().toISOString().split("T")[0]; // "2025-11-22"

  if (!isMobile) {
    // ДЕСКТОП — СЕТка 7 колонок
    daysOfWeek.forEach(dayName => {
      const header = document.createElement("div");
      header.textContent = dayName;
      header.style.cssText = "font-weight:600;text-align:center;padding:16px 8px;color:#ff6b9d;font-size:1rem;";
      calendarEl.appendChild(header);
    });

    // Пустые ячейки до начала месяца
    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = dateISO < todayISO;

      const dayEl = document.createElement("div");
      dayEl.className = "day";
      if (isPast) dayEl.classList.add("past");

      const dayBookings = store.bookings.filter(b => b.date === dateISO && b.time !== "00:00" && b.blocked !== true);

      dayEl.innerHTML = `
        <div style="font-weight:700;font-size:1.3rem;color:${isPast ? '#aaa' : '#ff6b9d'};margin-bottom:8px">${day}</div>
        <div style="font-size:0.9rem;line-height:1.5;">
          ${dayBookings.length === 0
            ? (isPast ? '' : '<div style="color:#aaa;font-style:italic">Свободно</div>')
            : dayBookings.map(b =>
                `<div style="margin:4px 0;padding:6px 10px;background:#fff0f5;border-radius:10px;font-size:0.85rem">
                  ${b.time} — ${b.clientName || "Клиент"}
                </div>`
              ).join("")
          }
        </div>
      `;

      if (dateISO === todayISO) {
        dayEl.style.border = "3px solid #ff6b9d";
        dayEl.style.background = "#fff0f5";
        dayEl.style.borderRadius = "16px";
      }

      // ПЕРЕДАЁМ ISO-СТРОКУ — БЕЗ СМЕЩЕНИЙ!
      dayEl.onclick = () => {
        if (!isPast || store.isAdmin) { // админ может открыть любой день
          import("./components.js").then(mod => mod.showBookingModal(dateISO));
        }
      };

      calendarEl.appendChild(dayEl);
    }
// МОБИЛЬНАЯ ВЕРСИЯ — ПРОШЕДШИЕ ДНИ ПОЛНОСТЬЮ СКРЫТЫ
} else {
  // МОБИЛЬНАЯ ВЕРСИЯ — КАРТОЧКИ (только текущие и будущие дни)
  for (let day = 1; day <= daysInMonth; day++) {
    const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isPast = dateISO < todayISO;

    // СКРЫВАЕМ ПРОШЕДШИЕ ДНИ ПОЛНОСТЬЮ
    if (isPast && !store.isAdmin) continue;

    const dayOfWeekIndex = (startDay + day - 1) % 7;
    const dayName = daysOfWeek[dayOfWeekIndex];

    const mobileDay = document.createElement("div");
    mobileDay.className = "mobile-day";
    if (dateISO === todayISO) mobileDay.classList.add("today");

    const dayBookings = store.bookings.filter(b => 
      b.date === dateISO && b.time !== "00:00" && b.blocked !== true
    );

    mobileDay.innerHTML = `
      <div class="mobile-day-header">
        ${day} ${currentDate.toLocaleDateString("ru-RU", { month: "long" }).slice(0, 3)} • ${dayName}
        ${dateISO === todayISO ? " • Сегодня" : ""}
      </div>
      <div style="padding:18px">
        ${dayBookings.length === 0
          ? '<div style="color:#ff6b9d;font-weight:600;font-size:1.1rem">Полностью свободно</div>'
          : dayBookings.map(b => `
              <div style="margin:10px 0;padding:14px;background:#fff0f5;border-radius:16px;font-size:0.95rem">
                <strong>${b.time}</strong> — ${b.clientName || "Клиент"}
              </div>
            `).join("")
        }
      </div>
    `;

    // Админ может открыть любой день, клиент — только будущие
    mobileDay.onclick = () => {
      import("./components.js").then(mod => mod.showBookingModal(dateISO));
    };

    calendarEl.appendChild(mobileDay);
  }
}
}

// Авто-перерисовка при любом изменении
subscribe(renderCalendar);