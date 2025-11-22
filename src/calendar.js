// src/calendar.js
import { store, subscribe } from "./store.js";
import { getDaysInMonth, formatDate, isToday, isPastDate } from "./date.js";
import { openUserBookingModal, openAdminDayModal } from "./components.js";

const calendarEl = document.getElementById("calendar");
const monthTitle = document.getElementById("currentMonth");

const render = () => {
  const { year, month, bookings, isAdmin } = store;
  const current = new Date(year, month, 1);
  monthTitle.textContent = current.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayWeekday = (current.getDay() + 6) % 7;

  calendarEl.innerHTML = "";

  /* ===================== ДЕСКТОП — СЕТКА ===================== */
  if (window.innerWidth > 768) {
    // названия дней недели
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((day, i) => {
      const el = document.createElement("div");
      el.textContent = day;
      el.style.color = i >= 5 ? "#c0392b" : "inherit";
      calendarEl.appendChild(el);
    });

    // пустые ячейки до первого дня
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    // дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const dayBookings = bookings.filter((b) => b.date === dateStr);
      const hasWholeDayBlock = dayBookings.some(
        (b) => b.blocked && b.time === "00:00"
      );
      const visible = isAdmin
        ? dayBookings
        : dayBookings.filter((b) => !b.blocked);

      const dayEl = document.createElement("div");
      dayEl.className = `day ${isToday(date) ? "today" : ""} ${
        isPastDate(date) ? "past" : ""
      } ${hasWholeDayBlock ? "blocked" : ""}`;

      dayEl.innerHTML = `
        <div class="day-number">${day}</div>
        ${hasWholeDayBlock && !isAdmin
          ? `<div style="background:#e74c3c;color:white;padding:4px 8px;border-radius:4px;font-size:0.8rem;margin:4px 0;text-align:center;">День заблокирован</div>`
          : ""
        }
        <div class="bookings">
          ${visible
            .map(
              (b) => `
            <div class="booking ${b.blocked && b.time !== "00:00" ? "blocked-slot" : isAdmin ? "admin" : ""
                }">
              <div style="line-height:1.35;">
                ${b.blocked
                  ? `<em style="color:#e74c3c;font-weight:600;">${b.name || "Заблокировано"}</em>`
                  : `
                    <div style="font-weight:600;color:#2c3e50;">${b.clientName || "Клиент"}</div>
                    <div style="font-size:0.9em;color:#3498db;">${b.serviceName || "Услуга"}</div>
                    <div style="font-size:0.85em;color:#7f8c8d;">${b.time} • ☎ ${b.clientPhone || "—"}</div>
                  `
                }
              </div>
              ${isAdmin && !b.blocked
                  ? `<div class="admin-actions">
                      <button onclick="window.editBooking('${b.id}')">Изменить</button>
                      <button class="danger" onclick="window.cancelBooking('${b.id}')">Отмена</button>
                    </div>`
                  : ""
                }
            </div>
          `
            )
            .join("")}
        </div>
      `;

      if (!isPastDate(date) || isAdmin) {
        dayEl.style.cursor = "pointer";
        dayEl.onclick = () =>
          isAdmin ? openAdminDayModal(date) : openUserBookingModal(date);
      }

      calendarEl.appendChild(dayEl);
    }
  }

  /* ===================== МОБИЛЬНАЯ ВЕРСИЯ ===================== */
  else {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // скрываем прошедшие дни (кроме админа)
      if (date < todayMidnight && !isAdmin) continue;

      const dateStr = formatDate(date);
      const dayBookings = bookings.filter((b) => b.date === dateStr);
      const hasWholeDayBlock = dayBookings.some(
        (b) => b.blocked && b.time === "00:00"
      );
      const visible = isAdmin
        ? dayBookings
        : dayBookings.filter((b) => !b.blocked);

      const dayEl = document.createElement("div");
      dayEl.className = `day mobile-day ${isToday(date) ? "today" : ""} ${hasWholeDayBlock ? "blocked" : ""
        }`;

      const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
      const dayNum = date.getDate();
      const monthName = date.toLocaleDateString("ru-RU", { month: "long" });

      dayEl.innerHTML = `
        <div class="mobile-day-header">
          <div>
            <strong>${dayNum} ${monthName}</strong><br>
            <span style="opacity:0.9;font-size:0.9em;">${weekday}</span>
            ${isToday(date) ? ' <span style="color:#ffb3b3;">· Сегодня</span>' : ""}
          </div>
        </div>
        <div class="mobile-bookings">
          ${hasWholeDayBlock && !isAdmin
          ? `<div class="blocked-message">День заблокирован</div>`
          : visible.length === 0
            ? `<div class="mobile-free-day">Свободный день → Нажмите, чтобы записаться</div>`
            : visible
              .map(
                (b) => `
              <div class="mobile-booking ${b.blocked ? "blocked-slot" : ""}">
                ${b.blocked
                  ? `<em style="color:#e74c3c;">${b.name || "Заблокировано"}</em>`
                  : `
                    <div class="time">${b.time}</div>
                    <div class="client">${b.clientName || "Клиент"}</div>
                    <div class="service">${b.serviceName}</div>
                  `
                }
              </div>
            `
              )
              .join("")
        }
        </div>
      `;

      // ---------- КЛИК ПО ДНЮ (главное исправление) ----------
      dayEl.addEventListener("click", (e) => {
        // не открываем модалку, если тапнули прямо по отдельной записи
        if (e.target.closest(".mobile-booking")) return;
        if (e.target.closest(".blocked-message")) return;

        if (isAdmin) openAdminDayModal?.(date);
        else openUserBookingModal(date);
      });

      dayEl.style.cursor = "pointer";

      calendarEl.appendChild(dayEl);
    }

    // Кнопка «Сегодня» (плавающая)
    if (!document.getElementById("scrollToToday")) {
      const btn = document.createElement("div");
      btn.id = "scrollToToday";
      btn.innerHTML = "↑";
      btn.title = "Сегодня";
      btn.onclick = () => {
        const todayEl = document.querySelector(".mobile-day.today");
        todayEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      document.body.appendChild(btn);
    }
  }
};

subscribe(render);
export const renderCalendar = render;