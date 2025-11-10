// Импорт модулей Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  Timestamp,
  deleteDoc,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCr08aVXswvpjwwLvtSbpBnPhE8dv3HWdM",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.firebasestorage.app",
  messagingSenderId: "665606748855",
  appId: "1:665606748855:web:5e4a2865b1f26494cf2b32",
  measurementId: "G-2ETMLYKBJS"
};

// Инициализация приложения
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Элементы DOM
const elements = {};

function initElements() {
  const selectors = {
    calendar: '#calendar',
    toggleAdminMode: '#toggleAdminMode',
    loading: '#loading',
    adminControls: '#adminControls',
    timeThresholdInput: '#timeThresholdInput',
    saveThresholdBtn: '#saveThresholdBtn',
    bookingsList: '#bookingsList',
    selectedDateDisplay: '#selectedDateDisplay',
    timeSelect: '#timeSelect',
    serviceSelect: '#serviceSelect',
    bookingForm: '#bookingForm',
    dateDetailsModal: '#dateDetailsModal',
    modalDateTitle: '#modalDateTitle',
    dateBookingsList: '#dateBookingsList',
    bookingModal: '#bookingModal',
    busyTimeModal: '#busyTimeModal'
  };

  Object.keys(selectors).forEach(key => {
    const el = document.querySelector(selectors[key]);
    if (!el) console.error(`Элемент ${selectors[key]} не найден!`);
    elements[key] = el;
  });
}

// Глобальные переменные
let bookings = [];
const services = ['Консультация', 'Диагностика', 'Ремонт', 'Настройка'];
const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
let isAdminMode = true;
let adminTimeThreshold = 60; // минут

// Преобразование Timestamp в строку YYYY-MM-DD
function timestampToString(timestamp) {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  } else if (typeof timestamp === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(timestamp)) {
      return timestamp;
    }
    try {
      return new Date(timestamp).toISOString().split('T')[0];
    } catch (e) {
      console.error('Не удалось преобразовать строку в дату:', timestamp);
      return '';
    }
  }
  console.error('Неподдерживаемый тип даты:', timestamp);
  return '';
}

// Загрузка записей из Firestore
async function loadBookingsFromFirebase() {
  try {
    elements.loading.style.display = 'block';
    const bookingsCollection = collection(db, 'bookings');
    const querySnapshot = await getDocs(bookingsCollection);

    bookings = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      data.date = timestampToString(data.date);

      // Пропускаем записи без даты
      if (!data.date || data.date === '') {
        console.warn('Пропущена запись без даты:', data);
        return;
      }

      bookings.push(data);
    });
  } catch (error) {
    console.error('Ошибка загрузки из Firestore:', error);
    alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

// Сохранение записи в Firestore
async function saveBooking(booking) {
  try {
    elements.loading.style.display = 'block';
    const bookingsCollection = collection(db, 'bookings');
    await addDoc(bookingsCollection, booking);
  } catch (error) {
    console.error('Ошибка сохранения в Firestore:', error);
    alert('Не удалось сохранить запись. Попробуйте ещё раз.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

// Удаление записи из Firestore
async function deleteBooking(bookingId) {
  try {
    elements.loading.style.display = 'block';
    await deleteDoc(doc(db, 'bookings', bookingId));
    await loadBookingsFromFirebase();
    setupCalendar();
  } catch (error) {
    console.error('Ошибка удаления записи:', error);
    alert('Не удалось удалить запись.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

// Проверка занятости времени
async function isTimeBusy(date, time) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      where('time', '==', time)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Ошибка проверки занятости:', error);
    return false;
  }
}

// Обновление кнопки режима
function updateModeButtonText() {
  if (elements.toggleAdminMode) {
    elements.toggleAdminMode.textContent = `Режим: ${isAdminMode ? 'Администратор' : 'Пользователь'}`;
  }
  if (elements.adminControls) {
    elements.adminControls.style.display = isAdminMode ? 'block' : 'none';
  }
}

// Проверка, занят ли день полностью
function isDayFullyBooked(dateStr) {
  const availableSlots = timeSlots.length;
  const bookedSlots = bookings.filter(b => b.date === dateStr).length;
  return bookedSlots >= availableSlots;
}

// Получение уровня занятости дня
function getBookingLevel(dateStr) {
  const bookedCount = bookings.filter(b => b.date === dateStr).length;
  const totalSlots = timeSlots.length;

  if (bookedCount === 0) return 0;
  if (bookedCount >= totalSlots) return 'full';

  return Math.min(4, Math.ceil(bookedCount / (totalSlots / 4)));
}

// Форматирование даты для отображения
function formatDate(dateString) {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    console.warn('Некорректная дата:', dateString);
    return 'Неизвестная дата';
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn('Неверный формат даты:', dateString);
    return 'Неверная дата';
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  } catch (error) {
    console.error('Ошибка форматирования даты:', error, dateString);
    return 'Ошибка даты';
  }
}

// Открытие модального окна для деталей даты (админ)
function openDateDetailsModal(dateStr) {
  elements.modalDateTitle.textContent = formatDate(dateStr);
  renderAdminBookings(dateStr);
  elements.dateDetailsModal.style.display = 'block';
}

// Рендеринг записей для выбранной даты в админ‑режиме
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

// Закрытие модальных окон
function closeModals() {
  if (elements.bookingModal) {
    elements.bookingModal.style.display = 'none';
  }
  if (elements.dateDetailsModal) {
    elements.dateDetailsModal.style.display = 'none';
  }
  if (elements.busyTimeModal) {
    elements.busyTimeModal.style.display = 'none';
  }

  // Сбрасываем форму записи при закрытии
  resetBookingForm();
}

// Сброс формы записи
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

// Обработчики закрытия модальных окон
document.addEventListener('click', (e) => {
  // Закрываем по клику на оверлей модального окна
  if (
    e.target === elements.bookingModal ||
    e.target === elements.dateDetailsModal ||
    e.target === elements.busyTimeModal
  ) {
    closeModals();
  }

  // Закрываем по клику на кнопку закрытия внутри модального окна (класс .btn-close)
  if (e.target.classList.contains('btn-close')) {
    closeModals();
  }
});

// Закрытие по клавише Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.keyCode === 27) {
    closeModals();
  }
});


// Функции закрытия конкретных модальных окон (для onclick в HTML)
function closeDateDetailsModal() {
  closeModals();
}

function closeBookingModal() {
  closeModals();
}

function closeBusyTimeModal() {
  closeModals();
}

// Обновление визуальных состояний календаря
function updateCalendarVisuals() {
  const dayCells = document.querySelectorAll('.day-cell');

  dayCells.forEach(cell => {
    const dateStr = cell.dataset.date;

    // Сбрасываем классы уровней занятости (1–4)
    for (let i = 1; i <= 4; i++) {
      cell.classList.remove(`bookings-${i}`);
    }

    // Сбрасываем классы полной занятости
    cell.classList.remove('fully-booked-admin', 'fully-booked');


    // Разрешаем клики по ячейке
    cell.style.pointerEvents = 'auto';

    // Применяем стили в зависимости от режима
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
        cell.style.pointerEvents = 'none'; // Блокируем клики
      }
    }
  });
}

// Настройка календаря (загрузка данных + рендеринг)
async function setupCalendar() {
  await loadBookingsFromFirebase();
  renderCalendar();
  updateCalendarVisuals();
}

// Обработка отправки формы записи
elements.bookingForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const date = elements.selectedDateDisplay.textContent;
  const time = elements.timeSelect.value;
  const service = elements.serviceSelect.value;

  // Валидация полей
  if (!date || !time || !service) {
    alert('Пожалуйста, заполните все поля формы.');
    return;
  }

  // Проверка занятости времени
  const isBusy = await isTimeBusy(date, time);
  if (isBusy) {
    elements.busyTimeModal.style.display = 'block';
    return;
  }

  // Создание записи
  const booking = {
    date: date,
    time: time,
    service: service,
    userId: 'guest-' + Date.now(), // Временный ID для гостей
    createdAt: Timestamp.now()
  };

  try {
    await saveBooking(booking);
    alert('Запись успешно создана!');
    closeModals();
    await setupCalendar();
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    alert('Не удалось создать запись. Попробуйте ещё раз.');
  }
});

// Обновление списка доступных временных слотов при выборе даты
function updateTimeSlots(dateStr) {
  const availableSlots = [];

  for (const slot of timeSlots) {
    const isBusy = bookings.some(b => b.date === dateStr && b.time === slot);
    if (!isBusy) {
      availableSlots.push(slot);
    }
  }

  elements.timeSelect.innerHTML = '';
  if (availableSlots.length === 0) {
    elements.timeSelect.insertAdjacentHTML('beforeend', '<option>Нет свободных слотов</option>');
  } else {
    availableSlots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      elements.timeSelect.appendChild(option);
    });
  }
}

// Открытие модального окна записи
function openBookingModal(dateStr) {
  elements.selectedDateDisplay.textContent = formatDate(dateStr);
  updateTimeSlots(dateStr);
  elements.bookingModal.style.display = 'block';
}

// Рендеринг календаря (упрощённый вариант)
function renderCalendar() {
  const calendar = elements.calendar;
  calendar.innerHTML = '';

  // Получаем текущий месяц и год
    const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Создаём заголовок месяца
  const monthHeader = document.createElement('div');
  monthHeader.className = 'month-header';
  monthHeader.textContent = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric'
  }).format(today);
  calendar.appendChild(monthHeader);

  // Создаём сетку дней
  const daysGrid = document.createElement('div');
  daysGrid.className = 'days-grid';

  // Определяем первый день месяца (0 — воскресенье, 6 — суббота)
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startingDay = firstDay.getDay();


  // Заполняем пустые ячейки до первого дня месяца
  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  // Количество дней в месяце
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();


  // Создаём ячейки для каждого дня
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    
    // Формируем дату в формате YYYY-MM-DD
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayCell.dataset.date = dateStr;
    dayCell.textContent = day;

    // Проверяем занятость дня
    if (isDayFullyBooked(dateStr)) {
      dayCell.classList.add('fully-booked');
      if (!isAdminMode) {
        dayCell.style.pointerEvents = 'none';
      }
    }

    // Обработчик клика по дню
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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  initElements();

  // Обработчики для админ‑панели
  if (elements.saveThresholdBtn) {
    elements.saveThresholdBtn.addEventListener('click', () => {
      const inputValue = elements.timeThresholdInput.value;
      if (inputValue && !isNaN(inputValue) && parseInt(inputValue) > 0) {
        adminTimeThreshold = parseInt(inputValue);
        alert(`Пороговое время обновлено: ${adminTimeThreshold} мин.`);
      } else {
        alert('Введите корректное положительное число минут.');
      }
    });
  }

  if (elements.toggleAdminMode) {
    elements.toggleAdminMode.addEventListener('click', async () => {
      isAdminMode = !isAdminMode;
      updateModeButtonText();
      await setupCalendar();
    });
  }

  // Запуск календаря
  await setupCalendar();
});

// Дополнительные утилиты

// Функция для проверки валидности даты
function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
}

// Функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Функция для проверки, является ли дата сегодняшней
function isToday(dateStr) {
  return dateStr === getCurrentDateString();
}

// Функция для подсветки текущей даты (опционально)
function highlightToday() {
  const todayStr = getCurrentDateString();
  const todayCell = document.querySelector(`.day-cell[data-date="${todayStr}"]`);
  if (todayCell) {
    todayCell.classList.add('today');
  }
}

// Добавляем вызов подсветки сегодня после рендеринга календаря

  // ... (предыдущий код функции renderCalendar)


