
import { elements } from '../dom/elements.js';
import { formatDate, isDayFullyBooked, getBookingLevel } from './utils.js';
import { bookings } from '../firebase/firestore.js';

import { openDateDetailsModal } from '../dom/modals.js';



function renderAdminBookings(dateStr) {
  const bookingsList = elements.dateBookingsList;
  bookingsList.innerHTML = '';


  const filteredBookings = bookings.filter(b => b.date === dateStr);


  filteredBookings.forEach(booking => {
    const item = document.createElement('div');
    item.className = 'booking-item';


    const formattedDate = booking.date
      ? formatDate(booking.date)
      : 'Дата отсутствует';

    item.innerHTML = `
      <div class="booking-info">
        <strong>Дата:</strong> ${formattedDate}<br>
        <strong>Время:</strong> ${booking.time}<br>
        <strong>Услуга:</strong> ${booking.service}
      </div>
      <button class="delete-btn btn btn-danger" data-id="${booking.id}" aria-label="Удалить запись">Удалить</button>
    `;

    item.querySelector('.delete-btn').addEventListener('click', () => {
      deleteBooking(booking.id);
    });

    bookingsList.appendChild(item);
  });

  if (filteredBookings.length === 0) {
    bookingsList.innerHTML = '<p>Нет записей на эту дату.</p>';
  }
}

function updateCalendarVisuals() {
  const dayCells = document.querySelectorAll('.day-cell');


  dayCells.forEach(cell => {
    const dateStr = cell.dataset.date;


    for (let i = 1; i <= 4; i++) {
      cell.classList.remove(`bookings-${i}`);
    }

    cell.classList.remove('fully-booked-admin', 'fully-booked');
    cell.style.pointerEvents = 'auto';

    if (isAdminMode) {
      const level = getBookingLevel(dateStr);
      if (level === 'full') {
        cell.classList.add('fully-booked-admin');
      } else if (level > 0) {
        cell.classList.add(`bookings-${level}`);
      }
    } else {
      if (isDayFullyBooked(dateStr)) {
        cell.classList.add('fully-booked');
        cell.style.pointerEvents = 'none';
      }
    }
  });
}

function renderCalendar() {
  const calendar = elements.calendar;
  calendar.innerHTML = '';

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthHeader = document.createElement('div');
  monthHeader.className = 'month-header';
  monthHeader.textContent = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(today);
  calendar.appendChild(monthHeader);

  const daysGrid = document.createElement('div');
  daysGrid.className = 'days-grid';

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDay = firstDay.getDay();


  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayCell.dataset.date = dateStr;
    dayCell.textContent = day;

    if (isDayFullyBooked(dateStr)) {
      dayCell.classList.add('fully-booked');
      if (!isAdminMode) {
        dayCell.style.pointerEvents = 'none';
      }
    }

    dayCell.addEventListener('click', () => {
      if (isAdminMode) {
        openDateDetailsModal(dateStr);
      } else {
        if (!dayCell.classList.contains('fully-booked')) {
          openBookingModal(dateStr);
        }
      }
    });

    daysGrid.appendChild(dayCell);
  }

  calendar.appendChild(daysGrid);
}

export { renderAdminBookings, updateCalendarVisuals, renderCalendar };
