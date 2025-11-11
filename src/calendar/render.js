import { $, createElement } from '/src/dom/elements.js';
import { getDaysInMonth, formatDate, isToday } from '/src/utils/dateUtils.js';
import {
  calendarState,
  setSelectedDate,
  updateState,
  getState,
  getBookingsForDate,
  nextMonth,
  prevMonth
} from '/src/calendar/state.js';
import { showBookingModal } from '/src/calendar/modal.js';
import { showEditModal } from '/src/calendar/editModal.js';

// Функция удаления записи (примерная реализация)
const deleteBooking = async (bookingId) => {
  try {
    // Здесь должен быть вызов API для удаления записи
    // Например: await removeBookingFromFirestore(bookingId);
    
    // Обновление локального состояния
    calendarState.bookings = calendarState.bookings.filter(
      (b) => b.id !== bookingId
    );
    
    // Перерисовка календаря
    renderCalendar();
    alert('Запись удалена');
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    alert('Не удалось удалить запись. Попробуйте ещё раз.');
  }
};

export const renderCalendar = () => {
  const calendarGrid = $('#calendarGrid');
  if (!calendarGrid) {
    console.error('Элемент #calendarGrid не найден');
    return;
  }

  // Обновление заголовка месяца
  const currentMonthEl = $('#currentMonth');
  if (currentMonthEl) {
    currentMonthEl.textContent = new Date(
      calendarState.currentYear,
      calendarState.currentMonth,
      1
    ).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }

  calendarGrid.innerHTML = '';

  const daysInMonth = getDaysInMonth(
    calendarState.currentYear,
    calendarState.currentMonth
  );

  if (!daysInMonth || daysInMonth <= 0) {
    calendarGrid.innerHTML = '<p>Ошибка: не удалось определить дни месяца.</p>';
    return;
  }

  // Заголовок календаря
  const header = createElement('div', { className: 'calendar-header' }, [
    createElement('h2', {}, [
      new Date(calendarState.currentYear, calendarState.currentMonth, 1)
        .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    ])
  ]);
  calendarGrid.appendChild(header);

  // Сетка дней
  const daysGrid = createElement('div', { className: 'days-grid' });

  for (let day = 1; day <= daysInMonth; day++) {
  
const date = new Date(Date.UTC(
  calendarState.currentYear,
  calendarState.currentMonth,
  day
));
    const bookings = getBookingsForDate(date);

    // Проверка на прошедшую дату
    const isPast = date < new Date().setHours(0, 0, 0, 0);

    const dayCell = createElement('div', {
      className: `day-cell ${isToday(date) ? 'today' : ''} ${isPast ? 'past-day' : ''}`
    }, [
      createElement('span', { className: 'day-number' }, [`${day}`]),
      createElement('div', { className: 'bookings-list' })
    ]);

    const bookingsList = dayCell.querySelector('.bookings-list');
    if (bookingsList) {
      if (calendarState.isAdminMode) {
        // Режим администратора: редактируемые записи
        bookings.forEach(booking => {
          const bookingEl = createElement('div', {
            className: 'booking-item admin',
            dataset: { bookingId: booking.id }
          }, [
            createElement('span', {}, [`${booking.name} (${booking.time})`]),
            createElement('button', {
              className: 'edit-btn',
              title: 'Редактировать'
            }, ['✏']),
            createElement('button', {
              className: 'delete-btn',
              title: 'Удалить'
            }, ['×'])
          ]);

          bookingEl.querySelector('.edit-btn').addEventListener('click', () =>
            showEditModal(booking)
          );
          bookingEl.querySelector('.delete-btn').addEventListener('click', () =>
            deleteBooking(booking.id)
          );

          bookingsList.appendChild(bookingEl);
        });
      } else {
        // Режим пользователя: только просмотр
        bookings.forEach(booking => {
          const bookingEl = createElement('div', { className: 'booking-item' }, [
            `${booking.name} (${booking.time})`
          ]);
          bookingsList.appendChild(bookingEl);
        });

        // Клик по ячейке открывает форму записи, если дата не прошла
        if (!isPast) {
          dayCell.addEventListener('click', () => showBookingModal(date));
        } else {
          // Для прошедших дней меняем курсор и добавляем подсказку
          dayCell.style.cursor = 'not-allowed';
          dayCell.title = 'Запись на прошедшую дату невозможна';
        }
      }
    }

    daysGrid.appendChild(dayCell);
  }

  calendarGrid.appendChild(daysGrid);
};
