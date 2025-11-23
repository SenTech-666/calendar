// src/calendar.js — 100% РАБОЧАЯ ВЕРСИЯ С КОНФИДЕНЦИАЛЬНОСТЬЮ ЗАПИСЕЙ

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

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  calendarEl.innerHTML = "";

  const isMobile = window.innerWidth <= 768;
  const todayISO = new Date().toISOString().split("T")[0];

  // === ФУНКЦИЯ: проверяем, принадлежит ли запись текущему пользователю ===
  const isCurrentUserBooking = (booking) => {
    if (store.isAdmin) return true;
    const savedPhone = localStorage.getItem('clientPhone');
    const savedName = localStorage.getItem('clientName');
    return booking.clientPhone === savedPhone || booking.clientName === savedName;
  };

  if (!isMobile) {
    // ДЕСКТОП
    daysOfWeek.forEach(dayName => {
      const header = document.createElement("div");
      header.textContent = dayName;
      header.style.cssText = "font-weight:600;text-align:center;padding:16px 8px;color:#ff6b9d;font-size:1rem;";
      calendarEl.appendChild(header);
    });

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = dateISO < todayISO;

      const dayEl = document.createElement("div");
      dayEl.className = "day";
      if (isPast) dayEl.classList.add("past");

      const dayBookings = store.bookings.filter(b =>
        b.date === dateISO && b.time !== "00:00" && b.blocked !== true
      );

      const bookingsHTML = dayBookings.length === 0
        ? '<div style="color:#ff6b9d;font-weight:600">Свободно</div>'
        : dayBookings.map(b => {
            if (isCurrentUserBooking(b)) {
              return `<div style="margin:6px 0;padding:10px;background:#e8f5e9;border-radius:12px;font-size:0.9rem;border-left:4px solid #4caf50;">
                        <strong>${b.time}</strong> — ${b.clientName || "Вы"} ${store.isAdmin ? `<br>☎ ${b.clientPhone}` : '(ваша запись)'}
                      </div>`;
            } else {
              return `<div style="margin:6px 0;padding:10px;background:#ffe0e0;border-radius:12px;color:#999;font-size:0.9rem;border-left:4px solid #ff6b9d;">
                        <strong>${b.time}</strong> — Занято
                      </div>`;
            }
          }).join("");

      dayEl.innerHTML = `<div style="font-weight:600;margin-bottom:8px">${day}</div>${bookingsHTML}`;

      dayEl.onclick = () => {
        if (isPast && !store.isAdmin) return;
        import("./components.js").then(mod => mod.showBookingModal(dateISO));
      };

      calendarEl.appendChild(dayEl);
    }
  } else {
    // МОБИЛЬНАЯ ВЕРСИЯ
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = dateISO < todayISO;

      if (isPast && !store.isAdmin) continue;

      const dayOfWeekIndex = (startDay + day - 1) % 7;
      const dayName = daysOfWeek[dayOfWeekIndex];

      const mobileDay = document.createElement("div");
      mobileDay.className = "mobile-day";
      if (dateISO === todayISO) mobileDay.classList.add("today");

      const dayBookings = store.bookings.filter(b =>
        b.date === dateISO && b.time !== "00:00" && b.blocked !== true
      );

      const bookingsHTML = dayBookings.length === 0
        ? '<div style="color:#ff6b9d;font-weight:600;font-size:1.1rem">Полностью свободно</div>'
        : dayBookings.map(b => {
            if (isCurrentUserBooking(b)) {
              return `<div style="margin:10px 0;padding:14px;background:#e8f5e9;border-radius:16px;font-size:0.95rem;border-left:5px solid #4caf50;">
                        <strong>${b.time}</strong> — ${b.clientName || "Вы"} (ваша запись)
                        ${store.isAdmin ? `<br>☎ ${b.clientPhone}` : ''}
                      </div>`;
            } else {
              return `<div style="margin:10px 0;padding:14px;background:#ffe0e0;border-radius:16px;font-size:0.95rem;color:#999;border-left:5px solid #ff6b9d;">
                        <strong>${b.time}</strong> — Занято
                      </div>`;
            }
          }).join("");

      mobileDay.innerHTML = `
        <div class="mobile-day-header">
          ${day} ${currentDate.toLocaleDateString("ru-RU", { month: "long" }).slice(0, 3)} • ${dayName}
          ${dateISO === todayISO ? " • Сегодня" : ""}
        </div>
        <div style="padding:18px">
          ${bookingsHTML}
        </div>
      `;

      mobileDay.onclick = () => {
        import("./components.js").then(mod => mod.showBookingModal(dateISO));
      };

      calendarEl.appendChild(mobileDay);
    }
  }
}

subscribe(renderCalendar);