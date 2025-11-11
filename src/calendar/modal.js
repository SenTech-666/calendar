import { createElement, $ } from '../dom/elements.js';
import { formatDate } from '../utils/dateUtils.js';
import { addBooking } from '../firebase/firestore.js';
import { renderCalendar } from './render.js';
import { addBookingToState } from './state.js';
// ДОБАВИТЬ ИМПОРТ НИЖЕ:
import { calendarState } from './state.js';  // ← Важно!

// Список услуг
const SERVICES = [
  'Консультация врача',
  'Массаж',
  'Диагностика',
  'Анализы',
  'Физиотерапия',
  'УЗИ-диагностика',
  'Приём терапевта',
  'Лабораторные исследования'
];

let modalInstance = null;

// ... остальной код (без изменений до showBookingModal)
 // Храним экземпляр модального окна

// Обработчик закрытия по Esc
const handleEscape = (e) => {
  if (e.key === 'Escape' && modalInstance) {
    closeModal();
  }
};

export const showBookingModal = (date) => {
  const now = new Date();
  const selectedDate = new Date(calendarState.currentYear, calendarState.currentMonth, date.getDate());

  // Если выбранная дата — в прошлом, не открываем модалку
  if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    alert('Нельзя записаться на прошедшую дату.');
    return;
  }

  // Создаём контейнер модального окна
  modalInstance = createElement('div', { className: 'modal' }, [
    createElement('div', { className: 'modal-content' }, [
      createElement('h3', {}, ['Запись на услугу']),
      createElement('p', {}, [`Дата: ${formatDate(date)}`]),

      // Блок выбора услуги
      createElement('div', {}, [
        createElement('label', { htmlFor: 'serviceSelect' }, ['Услуга:']),
        createElement('select', { id: 'serviceSelect' }, [])
      ]),

      // Блок выбора времени
      createElement('div', {}, [
        createElement('label', { htmlFor: 'timeInput' }, ['Время:']),
        createElement('input', {
          type: 'time',
          id: 'timeInput',
          min: '09:00',
          max: '18:00',
          required: true
        })
      ]),

      // Кнопки
      createElement('div', { style: 'margin-top: 20px;' }, [
        createElement('button', {
          id: 'submitBooking',
          type: 'button',
          style: 'margin-right: 10px;'
        }, ['Записать']),
        createElement('button', {
          id: 'closeModal',
          type: 'button',
          className: 'btn-secondary'
        }, ['Закрыть'])
      ])
    ])
  ]);

  document.body.appendChild(modalInstance);

  // Сохраняем дату для использования в обработчике отправки
  modalInstance.dataset.bookingDate = formatDate(date);

  // Заполняем выпадающий список услуг
  const select = modalInstance.querySelector('#serviceSelect');
  SERVICES.forEach(service => {
    const option = document.createElement('option');
    option.value = service;
    option.textContent = service;
    select.appendChild(option);
  });

  // Навешиваем обработчики событий
  const submitBtn = modalInstance.querySelector('#submitBooking');
  submitBtn.addEventListener('click', handleSubmit);

  const closeBtn = modalInstance.querySelector('#closeModal');
  closeBtn.addEventListener('click', closeModal);

  // Добавляем обработчик закрытия по Esc
  document.addEventListener('keydown', handleEscape);
};

// Обработчик отправки формы
const handleSubmit = async () => {
  const serviceSelect = modalInstance.querySelector('#serviceSelect');
  const timeInput = modalInstance.querySelector('#timeInput');

  if (!serviceSelect || !timeInput) {
    alert('Элементы формы не найдены');
    return;
  }

  const service = serviceSelect.value;
  const time = timeInput.value;
  const bookingDate = modalInstance.dataset.bookingDate;

  const [hours, minutes] = time.split(':').map(Number);
  const bookingDateTime = new Date(`${bookingDate} ${hours}:${minutes}:00`);

  // Проверка: время не должно быть в прошлом
  if (bookingDateTime < new Date()) {
    alert('Нельзя записаться на прошедшее время.');
    return;
  }

  if (service && time && bookingDate) {
    try {
      const newBooking = {
        date: bookingDate,
        time,
        name: service,
        status: 'ожидает',
        id: Date.now() + Math.random() // Временный ID
      };

      await addBooking(newBooking); // Сохранение в Firebase
      addBookingToState(newBooking); // Обновление локального состояния
      renderCalendar(); // Перерисовка календаря
      alert('Запись успешно добавлена!');
      closeModal();
    } catch (error) {
      console.error('Ошибка при добавлении записи:', error);
      alert('Не удалось добавить запись. Попробуйте ещё раз.');
    }
  } else {
    alert('Пожалуйста, заполните все поля!');
  }
};

// Функция закрытия модального окна
const closeModal = () => {
  if (modalInstance) {
    modalInstance.remove();
    modalInstance = null;
    // Удаляем обработчик закрытия по Esc
    document.removeEventListener('keydown', handleEscape);
  }
};
