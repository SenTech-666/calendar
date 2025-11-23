// src/calendar.js — С КНОПКОЙ "НАВЕРХ" В МОБИЛЬНОЙ ВЕРСИИ (23.11.2025)

import { store, subscribe } from "./store.js";

const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const getCurrentDate = () => store.currentDate || new Date();

// === КНОПКА "НАВЕРХ" ===
const createScrollToTopButton = () => {
  const btn = document.createElement("div");
  btn.innerHTML = "↑";
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: #ff6b9d;
    color: white;
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: bold;
    box-shadow: 0 4px 20px rgba(255, 107, 157, 0.5);
    z-index: 1000;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
  `;
  btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      btn.style.display = "flex";
      btn.style.transform = "scale(1)";
    } else {
      btn.style.transform = "scale(0.8)";
      setTimeout(() => {
        if (window.scrollY <= 400) btn.style.display = "none";
      }, 300);
    }
  });
};

// === ПРОВЕРКА СВОЕЙ ЗАПИСИ ===
const isCurrentUserBooking = (booking) => {
  if (store.isAdmin) return true;
  try {
    const savedPhone = localStorage.getItem('clientPhone');
    const savedName = localStorage.getItem('clientName');
    if (!savedPhone && !savedName) return false;
    if (savedPhone && booking.clientPhone === savedPhone) return true;
    if (savedName && booking.clientName) {
      const n1 = savedName.trim().toLowerCase();
      const n2 = booking.clientName.trim().toLowerCase();
      return n1.includes(n2) || n2.includes(n1);
    }
    return false;
  } catch (e) {
    return false;
  }
};

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
  const todayISO = new Date().toISOString().split("T")[0];
  const isMobile = window.innerWidth <= 768;

  calendarEl.innerHTML = "";

  // Создаём кнопку "Наверх" только в мобильной версии
  if (isMobile && !document.querySelector("#scrollToTopBtn")) {
    createScrollToTopButton();
  }

  if (!isMobile) {
    // Десктоп — без изменений
    daysOfWeek.forEach(dayName => {
      const header = document.createElement("div");
      header.textContent = dayName;
      header.style.cssText = "font-weight:600;text-align:center;padding:16px 8px;color:#ff6b9d;font-size:1rem;";
      calendarEl.appendChild(header);
    });
    for (let i = 0; i < startDay; i++) calendarEl.appendChild(document.createElement("div"));

    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayBookings = store.bookings.filter(b => b.date === dateISO && b.time !== "00:00" && b.blocked !== true);

      const bookingsHTML = dayBookings.length === 0
        ? '<div style="color:#ff6b9d;font-weight:600">Свободно</div>'
        : dayBookings.map(b => isCurrentUserBooking(b)
            ? `<div style="margin:6px 0;padding:10px;background:#e8f5e9;border-radius:12px;border-left:4px solid #4caf50;">
                 <strong>${b.time}</strong> — ${b.clientName || "Вы"} ${store.isAdmin ? `<br>Тел: ${b.clientPhone}` : '(ваша запись)'}
               </div>`
            : `<div style="margin:6px 0;padding:10px;background:#ffe0e0;border-radius:12px;color:#999;border-left:4px solid #ff6b9d;">
                 <strong>${b.time}</strong> — Занято
               </div>`
        ).join("");

      const dayEl = document.createElement("div");
      dayEl.className = "day";
      dayEl.innerHTML = `<div style="font-weight:600;margin-bottom:8px">${day}</div>${bookingsHTML}`;
      dayEl.onclick = () => {
        if (dateISO < todayISO && !store.isAdmin) return;
        import("./components.js").then(m => m.showBookingModal(dateISO));
      };
      calendarEl.appendChild(dayEl);
    }
  } else {
    // МОБИЛЬНАЯ ВЕРСИЯ
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dateISO < todayISO && !store.isAdmin) continue;

      const dayOfWeekIndex = (startDay + day - 1) % 7;
      const dayName = daysOfWeek[dayOfWeekIndex];

      const dayBookings = store.bookings.filter(b => b.date === dateISO && b.time !== "00:00" && b.blocked !== true);

      const bookingsHTML = dayBookings.length === 0
        ? '<div style="color:#ff6b9d;font-weight:600;font-size:1.1rem">Полностью свободно</div>'
        : dayBookings.map(b => isCurrentUserBooking(b)
            ? `<div style="margin:10px 0;padding:14px;background:#e8f5e9;border-radius:16px;border-left:5px solid #4caf50;">
                 <strong>${b.time}</strong> — ${b.clientName || "Вы"} (ваша запись)${store.isAdmin ? `<br>Тел: ${b.clientPhone}` : ''}
               </div>`
            : `<div style="margin:10px 0;padding:14px;background:#ffe0e0;border-radius:16px;color:#999;border-left:5px solid #ff6b9d;">
                 <strong>${b.time}</strong> — Занято
               </div>`
        ).join("");

      const mobileDay = document.createElement("div");
      mobileDay.className = "mobile-day";
      if (dateISO === todayISO) mobileDay.classList.add("today");
      mobileDay.innerHTML = `
        <div class="mobile-day-header">
          ${day} ${currentDate.toLocaleDateString("ru-RU", { month: "long" }).slice(0, 3)} • ${dayName}
          ${dateISO === todayISO ? " • Сегодня" : ""}
        </div>
        <div style="padding:18px">${bookingsHTML}</div>
      `;
      mobileDay.onclick = () => import("./components.js").then(m => m.showBookingModal(dateISO));
      calendarEl.appendChild(mobileDay);
    }
  }
}

subscribe(renderCalendar);