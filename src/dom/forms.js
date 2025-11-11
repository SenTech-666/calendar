import { $ } from './elements.js';
import { renderCalendar } from '../calendar/render.js';

/**
 * Генерирует опции для select времени
 * @param {HTMLSelectElement} select - элемент select для заполнения
 * @param {number} startHour - начальный час (по умолчанию 9)
 * @param {number} endHour - конечный час (по умолчанию 18)
 * @param {number} interval - интервал в минутах (по умолчанию 30)
 */
const populateTimeOptions = (select, startHour = 9, endHour = 18, interval = 30) => {
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const option = document.createElement('option');
      option.value = timeStr;
      option.textContent = timeStr;
      select.appendChild(option);
    }
  }
};

/**
 * Генерирует опции для select услуг
 * @param {HTMLSelectElement} select - элемент select для заполнения
 * @param {string[]} services - массив названий услуг
 */
const populateServiceOptions = (select, services) => {
  services.forEach(service => {
    const option = document.createElement('option');
    option.value = service;
    option.textContent = service;
    select.appendChild(option);
  });
};

/**
 * Настройка формы бронирования
 * @param {function} onSubmit - обработчик отправки формы
 * @param {function} onCancel - обработчик отмены
 * @param {Object} options - дополнительные настройки
 */
export const setupBookingForm = (onSubmit, onCancel, options = {}) => {
  const form = $('#bookingForm');
  const timeSelect = $('#timeSelect');
  const serviceSelect = $('#serviceSelect');
  const cancelBtn = $('#cancelBookingBtn');
  const closeBtn = $('#closeModalBtn');


  // Настройки по умолчанию
  const defaultOptions = {
    startHour: 9,
    endHour: 18,
    timeInterval: 30,
    services: ['Стрижка', 'Окрашивание', 'Укладка', 'Массаж']
  };

  // Объединяем настройки пользователя с дефолтными
  const config = { ...defaultOptions, ...options };

  // Заполняем опции времени
  populateTimeOptions(timeSelect, config.startHour, config.endHour, config.timeInterval);

  // Заполняем опции услуг
  populateServiceOptions(serviceSelect, config.services);

  // Обработчик отправки формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedDateStr = $('#selectedDateDisplay').textContent;
    const timeStr = timeSelect.value;
    const service = serviceSelect.value;


    // Преобразуем выбранное время в дату для проверки
    const [hours, minutes] = timeStr.split(':').map(Number);
    const selectedDateTime = new Date(`${selectedDateStr} ${hours}:${minutes}:00`);


    // Проверка: дата/время не в прошлом
    if (selectedDateTime < new Date()) {
      alert('Нельзя записаться на прошедшее время.');
      return;
    }

    const data = {
      date: selectedDateStr,
      time: timeStr,
      service
    };

    onSubmit(data);
    renderCalendar(); // Перерисовка календаря после отправки
  });

  // Обработчики кнопок
  cancelBtn.addEventListener('click', () => {
    onCancel();
    renderCalendar(); // Перерисовка после отмены
  });
  
  closeBtn.addEventListener('click', () => {
    form.reset();
    $('#bookingModal').classList.add('hidden');
    renderCalendar(); // Перерисовка при закрытии
  });
};
