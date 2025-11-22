// src/calendar.js
import { store, subscribe } from "./store.js";
import { getDaysInMonth, formatDate, isToday, isPastDate } from "./date.js";
import { openUserBookingModal, openAdminDayModal } from "./components.js";

const calendarEl = document.getElementById("calendar");
const monthTitle = document.getElementById("currentMonth");

// src/calendar.js — ОБНОВЛЁННАЯ ВЕРСИЯ С СКРЫТИЕМ ПРОШЕДШИХ ДНЕЙ НА МОБИЛЬНЫХ
const render = () => {
  const { year, month, bookings, isAdmin } = store;
  const current = new Date(year, month, 1);
  monthTitle.textContent = current.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayWeekday = (current.getDay() + 6) % 7;

  calendarEl.innerHTML = "";

  // === Десктоп — старый вид (сетка) ===
  if (window.innerWidth > 768) {
    // (твой старый код сетки — оставляем без изменений)
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((day, i) => {
      const el = document.createElement("div");
      el.textContent = day;
      el.style.color = i >= 5 ? "#c0392b" : "inherit";
      calendarEl.appendChild(el);
    });

    for (let i = 0; i < firstDayWeekday; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const dayBookings = bookings.filter(b => b.date === dateStr);
      const hasWholeDayBlock = dayBookings.some(b => b.blocked && b.time === "00:00");
      const visible = isAdmin ? dayBookings : dayBookings.filter(b => !b.blocked);

      const dayEl = document.createElement("div");
      dayEl.className = `day ${isToday(date) ? "today" : ""} ${isPastDate(date) ? "past" : ""} ${hasWholeDayBlock ? "blocked" : ""}`;

      dayEl.innerHTML = `
        <div class="day-number">${day}</div>
        ${hasWholeDayBlock && !isAdmin ? `<div style="background:#e74c3c;color:white;padding:4px 8px;border-radius:4px;font-size:0.8rem;margin:4px 0;text-align:center;">День заблокирован</div>` : ""}
        <div class="bookings">
          ${visible.map(b => `
            <div class="booking ${b.blocked && b.time !== "00:00" ? "blocked-slot" : isAdmin ? "admin" : ""}">
              <div style="line-height:1.35;">
                ${b.blocked 
                  ? `<em style="color:#e74c3c; font-weight:600;">${b.name || "Заблокировано"}</em>`
                  : `
                    <div style="font-weight:600; color:#2c3e50;">${b.clientName || "Клиент"}</div>
                    <div style="font-size:0.9em; color:#3498db;">${b.serviceName || "Услуга"}</div>
                    <div style="font-size:0.85em; color:#7f8c8d;">${b.time} • ☎ ${b.clientPhone || "—"}</div>
                  `
                }
              </div>
              ${isAdmin && !b.blocked ? `
                <div class="admin-actions">
                  <button onclick="window.editBooking('${b.id}')">Изменить</button>
                  <button class="danger" onclick="window.cancelBooking('${b.id}')">Отмена</button>
                </div>
              ` : ""}
            </div>
          `).join("")}
        </div>
      `;

      if (!isPastDate(date) || isAdmin) {
        dayEl.style.cursor = "pointer";
        dayEl.onclick = () => isAdmin ? openAdminDayModal(date) : openUserBookingModal(date);
      }

      calendarEl.appendChild(dayEl);
    }
  } 
  // === МОБИЛЬНАЯ ВЕРСИЯ — ВЕРТИКАЛЬНЫЙ СПИСОК БЕЗ ПРОШЕДШИХ ДНЕЙ ===
  else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // СКРЫВАЕМ ПРОШЕДШИЕ ДНИ
      if (date < today && !isAdmin) continue;

      const dateStr = formatDate(date);
      const dayBookings = bookings.filter(b => b.date === dateStr);
      const hasWholeDayBlock = dayBookings.some(b => b.blocked && b.time === "00:00");
      const visible = isAdmin ? dayBookings : dayBookings.filter(b => !b.blocked);

      const dayEl = document.createElement("div");
      dayEl.className = `day mobile-day ${isToday(date) ? "today" : ""} ${hasWholeDayBlock ? "blocked" : ""}`;

      const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNum = date.getDate();
      const monthName = date.toLocaleDateString("ru-RU", { month: "long" });

      dayEl.innerHTML = `
        <div class="mobile-day-header">
          <div>
            <strong>${dayNum} ${monthName}</strong><br>
            <span style="color:#7f8c8d;font-size:0.9em;">${weekday}</span>
            ${isToday(date) ? ' <span style="color:#e74c3c;font-weight:700;">· Сегодня</span>' : ''}
          </div>
        </div>
        <div class="mobile-bookings">
          ${hasWholeDayBlock && !isAdmin
            ? `<div style="text-align:center;padding:30px;color:#e74c3c;font-weight:600;background:#fdf2f2;border-radius:12px;">День заблокирован</div>`
            : visible.length === 0
              ? `<div class="mobile-free-day" onclick="openUserBookingModal(new Date('${dateStr}'))">
                   <div>Свободный день → Нажмите, чтобы записаться</div>
                 </div>`
              : visible.map(b => `
                <div class="mobile-booking ${b.blocked ? 'blocked-slot' : ''}" 
                     ${!b.blocked ? `onclick="openUserBookingModal(new Date('${dateStr}'))"` : ''}>
                  ${b.blocked
                    ? `<em style="color:#e74c3c;">${b.name || "Заблокировано"}</em>`
                    : `
                      <div><strong>${b.time}</strong></div>
                      <div style="font-size:0.95em;">${b.clientName || "Клиент"}</div>
                      <div style="font-size:0.9em;color:#3498db;">${b.serviceName}</div>
                    `
                  }
                </div>
              `).join("")
          }
        </div>
      `;

      calendarEl.appendChild(dayEl);
    }
  }

  // Кнопка "Сегодня" на мобильных
  if (window.innerWidth <= 768) {
    let btn = document.getElementById("scrollToToday");
    if (!btn) {
      btn = document.createElement("div");
      btn.id = "scrollToToday";
      btn.innerHTML = "↑";
      btn.onclick = () => document.querySelector(".day.today")?.scrollIntoView({ behavior: "smooth" });
      document.body.appendChild(btn);
    }
  }
};


subscribe(render);
export const renderCalendar = render;