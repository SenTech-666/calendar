import { renderCalendar } from './calendar/render.js';
import { updateBookings } from './calendar/state.js';
import { getBookings } from './firebase/firestore.js';
import { initModeToggle } from './calendar/mode.js';

const MESSAGES = {
  INIT: 'Инициализация приложения...',
  LOADING: 'Загрузка записей из Firestore...',
  NO_BOOKINGS: 'Нет записей для отображения',
  ERROR_INVALID_DATA: 'Ошибка: ожидался массив записей. Получено:',
  ERROR_TIMEOUT: 'Ошибка: запрос превысил допустимое время ожидания',
  FIREBASE_NOT_INIT: 'Ошибка: Firebase не инициализирован. Проверьте конфигурацию.'
};

const LOAD_TIMEOUT = 10000;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(MESSAGES.ERROR_TIMEOUT)), ms))
  ]);

const showLoading = (isLoading) => {
  document.body.classList.toggle('loading', isLoading);
};

const loadData = async () => {
  console.log(MESSAGES.LOADING);
  console.time('Загрузка данных');

  try {
    const bookings = await withTimeout(getBookings(), LOAD_TIMEOUT);
    console.timeEnd('Загрузка данных');

    if (!Array.isArray(bookings)) {
      throw new Error(`${MESSAGES.ERROR_INVALID_DATA}: ${JSON.stringify(bookings)}`);
    }

    return bookings;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    throw error;
  }
};

const initApp = async () => {
  console.log(MESSAGES.INIT);

  // Проверка инициализации Firebase
  if (!window.FIREBASE || !window.FIREBASE.firestore) {
    console.error(MESSAGES.FIREBASE_NOT_INIT);
    alert(MESSAGES.FIREBASE_NOT_INIT);
    return;
  }

  showLoading(true);

  try {
    const bookings = await loadData();
    console.log(`Загружено ${bookings.length} записей`);

    if (bookings.length === 0) {
      console.info(MESSAGES.NO_BOOKINGS);
    }

    // Обновляем состояние календаря
    updateBookings(bookings);

    // Инициализируем календарь
    renderCalendar();

    // Инициализируем переключатель режима
    initModeToggle();

  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
  } finally {
    showLoading(false);
  }
};

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
