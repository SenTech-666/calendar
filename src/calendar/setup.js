import { initModeToggle } from '/src/calendar/mode.js';
import { setupBookingForm } from '/src/dom/forms.js';
import { renderCalendar } from '/src/calendar/render.js';
import { addBooking } from '/src/firebase/firestore.js';
import { formatDate } from '/src/utils/dateUtils.js';
import {
  calendarState,
  nextMonth,
  prevMonth,
  getCurrentDate,
  setCurrentMonthYear
} from './state.js';

const $ = (selector) => document.querySelector(selector);

const hideModal = () => {
  const modal = $('#bookingModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.reset();
  }
};

export const initApp = () => {
  console.log('Инициализация приложения...');
  initModeToggle();

  setupBookingForm(
    (data) => {
      addBooking(data);
      hideModal();
    },
    () => {
      hideModal();
    }
  );

  setupMonthNavigation();
  setupTimeLimitControl();
  renderCalendar();
  console.log('Приложение инициализировано');
};

const formatMonthYear = (date) => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const updateMonthDisplay = () => {
  const currentMonthEl = $('#currentMonth');
  if (!currentMonthEl) {
    console.error('Элемент #currentMonth не найден в DOM');
    return;
  }

  const currentDate = getCurrentDate();
  currentMonthEl.textContent = formatMonthYear(currentDate);
};

const setupMonthNavigation = () => {
  const prevBtn = $('#prevMonthBtn');
  const nextBtn = $('#nextMonthBtn');

  if (!prevBtn) console.error('Кнопка #prevMonthBtn не найдена');
  if (!nextBtn) console.error('Кнопка #nextMonthBtn не найдена');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      console.log('Переход к предыдущему месяцу');
      prevMonth();
      updateMonthDisplay();
      try {
        renderCalendar();
      } catch (error) {
        console.error('Ошибка при перерисовке календаря:', error);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      console.log('Переход к следующему месяцу');
      nextMonth();
      updateMonthDisplay();
      try {
        renderCalendar();
      } catch (error) {
        console.error('Ошибка при перерисовке календаря:', error);
      }
    });
  }

  updateMonthDisplay();
};

const setupTimeLimitControl = () => {
  const timeLimitInput = $('#timeLimitHours');
  if (!timeLimitInput) {
    console.error('Элемент #timeLimitHours не найден в DOM');
    return;
  }

  // Функция для установки лимита времени записи
  const setTimeLimit = (hours) => {
    if (typeof hours !== 'number' || hours < 0 || hours > 24) {
      console.warn('Некорректное значение лимита времени:', hours);
      return false;
    }
    calendarState.timeLimitHours = hours;
    console.log('Лимит времени записи установлен:', hours, 'часов');
    return true;
  };

  // Обработчик изменения значения в поле ввода
  timeLimitInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setTimeLimit(value);
      try {
        renderCalendar();
      } catch (error) {
        console.error('Ошибка при перерисовке календаря после изменения лимита:', error);
      }
    } else {
      console.warn('Введено некорректное значение:', e.target.value);
    }
  });

  // Инициализация текущего значения из состояния (если оно есть)
  if (calendarState.timeLimitHours) {
    timeLimitInput.value = calendarState.timeLimitHours;
  }
};

// Вызов инициализации при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM загружен, начало инициализации приложения...');
  initApp();
});

export default {
  initApp,
  setupMonthNavigation,
  setupTimeLimitControl
};
