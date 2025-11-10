import { elements } from './elements.js';
import { services, timeSlots, formatDate } from '../calendar/utils.js';
import { bookings } from '../firebase/firestore.js';

/**
 * Сброс формы записи к исходному состоянию
 */
function resetBookingForm() {
  if (elements.timeSelect) {
    elements.timeSelect.innerHTML = '';
  }
  
  if (elements.serviceSelect) {
    elements.serviceSelect.innerHTML = '';
    services.forEach(service => {
      const option = document.createElement('option');
      option.value = service;
      option.textContent = service;
      elements.serviceSelect.appendChild(option);
    });
  }
}

/**
 * Обновление списка доступных временных слотов для выбранной даты
 * @param {string} dateStr - Дата в формате YYYY-MM-DD
 */
function updateTimeSlots(dateStr) {
  const availableSlots = [];

  for (const slot of timeSlots) {
    // Проверяем, есть ли запись на это время
    const isBusy = bookings.some(b => b.date === dateStr && b.time === slot);
    if (!isBusy) {
      availableSlots.push(slot);
    }
  }

  // Очищаем список временных слотов
  elements.timeSelect.innerHTML = '';

  // Если нет свободных слотов
  if (availableSlots.length === 0) {
    elements.timeSelect.insertAdjacentHTML('beforeend', '<option>Нет свободных слотов</option>');
  } else {
    // Добавляем доступные слоты
    availableSlots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      elements.timeSelect.appendChild(option);
    });
  }
}

/**
 * Открытие модального окна записи на выбранную дату
 * @param {string} dateStr - Дата в формате YYYY-MM-DD
 */
function openBookingModal(dateStr) {
  // Устанавливаем отображаемую дату
  elements.selectedDateDisplay.textContent = formatDate(dateStr);
  
  // Обновляем список доступных временных слотов
  updateTimeSlots(dateStr);
  
  // Показываем модальное окно
  elements.bookingModal.style.display = 'block';
}

/**
 * Обработка отправки формы записи
 */
function setupBookingFormHandler() {
  elements.bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = elements.selectedDateDisplay.textContent;
    const time = elements.timeSelect.value;
    const service = elements.serviceSelect.value;

    // Валидация обязательных полей
    if (!date || !time || !service) {
      alert('Пожалуйста, заполните все поля формы.');
      return;
    }

    try {
      // Проверяем занятость времени
      const isBusy = await isTimeBusy(date, time);
      if (isBusy) {
        elements.busyTimeModal.style.display = 'block';
        return;
      }

      // Создаем новую запись
      const booking = {
        date: date,
        time: time,
        service: service,
        userId: 'guest-' + Date.now(), // Временный ID для гостей
        createdAt: Timestamp.now()
      };

      await saveBooking(booking);
      alert('Запись успешно создана!');
      closeModals();
      await setupCalendar();
    } catch (error) {
      console.error('Ошибка при создании записи:', error);
      alert('Не удалось создать запись. Попробуйте ещё раз.');
    }
  });
}

export {
  resetBookingForm,
  updateTimeSlots,
  openBookingModal,
  setupBookingFormHandler
};
