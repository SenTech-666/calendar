// Инициализация Firebase
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
  where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCr08aVXswvpjwwLvtSbpBnPhE8dv3HWdM",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.firebasestorage.app",
  messagingSenderId: "665606748855",
  appId: "1:665606748855:web:5e4a2865b1f26494cf2b32",
  measurementId: "G-2ETMLYKBJS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Кэшированные DOM-элементы
const elements = {
  calendar: document.getElementById('calendar'),
  toggleAdminMode: document.getElementById('toggleAdminMode'),
  dateDetailsModal: document.getElementById('dateDetailsModal'),
  bookingModal: document.getElementById('bookingModal'),
  busyTimeModal: document.getElementById('busyTimeModal'),
  loading: document.getElementById('loading')
};

// Глобальные переменные
let bookings = [];
const services = ['Консультация', 'Диагностика', 'Ремонт', 'Настройка'];
const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
let isAdminMode = true;

// Преобразование Timestamp в строку YYYY-MM-DD
function timestampToString(timestamp) {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  }
  return timestamp;
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
      data.id = doc.id; // Сохраняем ID документа
      data.date = timestampToString(data.date);
      bookings.push(data);
    });

    console.log('Данные загружены из Firestore:', bookings);
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
    const bookingsCollection = collection(db, 'bookings');
    await addDoc(bookingsCollection, booking);
    console.log('Запись сохранена:', booking);
  } catch (error) {
    console.error('Ошибка сохранения в Firestore:', error);
    alert('Не удалось сохранить запись. Попробуйте ещё раз.');
  }
}

// Удаление записи из Firestore
async function deleteBooking(bookingId) {
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
    console.log('Запись удалена:', bookingId);
    await loadBookingsFromFirebase(); // Обновляем данные
    setupCalendar();
  } catch (error) {
    console.error('Ошибка удаления записи:', error);
    alert('Не удалось удалить запись.');
  }
}

// Проверка занятости времени (с запросом в Firestore)
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

// Обновление текста кнопки режима
function updateModeButtonText() {
  elements.toggleAdminMode.textContent = `Режим: ${isAdminMode ? 'Администратор' : 'Пользователь'}`;
}

// Проверка, занят ли день полностью
function isDayFullyBooked(dateStr) {
  const availableSlots = timeSlots.length;
  const bookedSlots = bookings.filter(b => b.date === dateStr).length;
  return bookedSlots >= availableSlots;
}

// Форматирование даты для отображения
function formatDate(dateString) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
}

// Переключение режима (админ/пользователь)
elements.toggleAdminMode.addEventListener('click', async () => {
  isAdminMode = !isAdminMode;
  updateModeButtonText();
  await setupCalendar();
});

// Рендеринг календаря
function renderCalendar() {
  elements.calendar.innerHTML = '';

  const year = 2025;
  const month = 10;
  const daysInMonth = 30;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.dataset.date = dateStr;
    dayCell.textContent = day;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(dateStr);
    if (cellDate < today) {
      dayCell.classList.add('past');
      dayCell.style.pointerEvents = 'none';
    }

    elements.calendar.appendChild(dayCell);
  }
}

// Открытие модального окна с записями на день
function openDateDetailsModal(dateStr) {
  const title = document.getElementById('modalDateTitle');
  const list = document.getElementById('dateBookingsList');

  title.textContent = formatDate(dateStr);
  list.innerHTML = '';

  const dayBookings = bookings.filter(b => b.date === dateStr);

  if (dayBookings.length === 0) {
    list.innerHTML = '<p>Нет записей на этот день.</p>';
  } else {
    dayBookings.forEach(booking => {
      const item = document.createElement('div');
      item.className = 'booking-item';
      item.innerHTML = `
        <div class="booking-time">${booking.time}</div>
        <div class="booking-service">${booking.service}</div>
        ${isAdminMode ? `<button class="delete-btn" data-id="${booking.id}">Удалить</button>` : ''}
      `;
      list.appendChild(item);
    });

    // Обработчик удаления (для админа)
    if (isAdminMode) {
      list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          deleteBooking(e.target.dataset.id);
        });
      });
    }
  }

  elements.dateDetailsModal.style.display = 'flex';
}

// Закрытие модального окна записей
function closeDateDetailsModal() {
  elements.dateDetailsModal.style.display = 'none';
}

// Открытие формы записи
function openBookingModal(date) {
  const selectedDateDisplay = document.getElementById('selectedDateDisplay');

  // Сохраняем исходную дату в dataset (в формате YYYY-MM-DD)
  selectedDateDisplay.dataset.rawDate = date;
  selectedDateDisplay.textContent = formatDate(date);

  const timeSelect = document.getElementById('timeSelect');
  const serviceSelect = document.getElementById('serviceSelect');

  // Очищаем и заполняем выпадающие списки
  timeSelect.value = '';
  serviceSelect.value = '';
  populateSelect(timeSelect, timeSlots);
  populateSelect(serviceSelect, services);


  elements.bookingModal.style.display = 'flex';
}

// Заполнение выпадающих списков
function populateSelect(selectElement, options) {
  selectElement.innerHTML = '<option value="">Выберите время</option>';
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    selectElement.appendChild(opt);
  });
}

// Проверка занятости времени при выборе (с запросом в Firestore)
document.getElementById('timeSelect')?.addEventListener('change', async () => {
  const date = document.getElementById('selectedDateDisplay').dataset.rawDate;
  const time = document.getElementById('timeSelect').value;


  if (!date || !time) return;

  try {
    const isBusy = await isTimeBusy(date, time);
    if (isBusy) {
      showBusyTimeModal();
      document.getElementById('timeSelect').value = '';
    }
  } catch (error) {
    console.error('Ошибка проверки занятости времени:', error);
  }
});

// Отправка формы записи
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const selectedDateDisplay = document.getElementById('selectedDateDisplay');
  const timeSelect = document.getElementById('timeSelect');
  const serviceSelect = document.getElementById('serviceSelect');


  // Проверка существования элементов
  if (!selectedDateDisplay || !timeSelect || !serviceSelect) {
    alert('Элементы формы не найдены!');
    return;
  }

  const date = selectedDateDisplay.dataset.rawDate; // Исходная дата в формате YYYY-MM-DD
  const time = timeSelect.value;
  const service = serviceSelect.value;


  // Валидация: проверяем заполнение полей
  if (!date || !time || !service) {
    alert('Заполните все поля!');
    return;
  }

  // Проверяем занятость времени через Firestore
  const isBusy = await isTimeBusy(date, time);
  if (isBusy) {
    showBusyTimeModal();
    return;
  }

  // Создаем новую запись
  const newBooking = {
    date: date,
    time: time,
    service: service,
    userId: isAdminMode ? 'admin' : 'user_' + Date.now(),
    createdAt: Timestamp.now()
  };

  try {
    await saveBooking(newBooking);
    await loadBookingsFromFirebase(); // Обновляем данные из Firestore
    setupCalendar();
    closeBookingModal();
  } catch (error) {
    console.error('Ошибка сохранения записи:', error);
    alert('Не удалось сохранить запись. Попробуйте ещё раз.');
  }
});

// Закрытие формы записи
function closeBookingModal() {
  elements.bookingModal.style.display = 'none';
}

// Открытие модального окна «Время занято»
function showBusyTimeModal() {
  elements.busyTimeModal.style.display = 'flex';
}

// Закрытие модального окна «Время занято»
function closeBusyTimeModal() {
  elements.busyTimeModal.style.display = 'none';
}

// Получение уровня занятости дня (для подсветки)
function getBookingLevel(dateStr) {
  const bookedCount = bookings.filter(b => b.date === dateStr).length;
  const totalSlots = timeSlots.length;

  if (bookedCount === 0) return 0;
  if (bookedCount >= totalSlots) return 'full';


  return Math.min(4, Math.ceil(bookedCount / (totalSlots / 4)));
}

// Обновление визуальных состояний календаря
function updateCalendarVisuals() {
  const dayCells = document.querySelectorAll('.day-cell');

  dayCells.forEach(cell => {
    const dateStr = cell.dataset.date;


    // Сбрасываем все классы подсветки
    for (let i = 1; i <= 4; i++) {
      cell.classList.remove(`bookings-${i}`);
    }
    cell.classList.remove('fully-booked-admin', 'fully-booked');

    cell.style.pointerEvents = 'auto'; // Возвращаем кликабельность


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
        cell.style.pointerEvents = 'none'; // Блокируем клик
      }
    }

    // Обновляем обработчики кликов
    cell.removeEventListener('click', cell.clickHandler);
    if (!cell.classList.contains('fully-booked') && !cell.classList.contains('past')) {
      cell.clickHandler = () => {
        if (isAdminMode) {
          openDateDetailsModal(dateStr);
        } else {
          openBookingModal(dateStr);
        }
      };
      cell.addEventListener('click', cell.clickHandler);
    }
  });
}

// Настройка обработчиков кликов для ячеек календаря
function setupCalendarClickHandlers() {
  updateCalendarVisuals();
}

// Инициализация календаря
async function setupCalendar() {
  try {
    await loadBookingsFromFirebase();
    renderCalendar();
    setupCalendarClickHandlers();
  } catch (error) {
    console.error('Ошибка инициализации календаря:', error);
    alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
  }
}

// Инициализация при загрузке страницы
window.addEventListener('load', async () => {
  await setupCalendar();
});

// Обработчики закрытия модальных окон по клику вне содержимого
elements.dateDetailsModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeDateDetailsModal();
});

elements.bookingModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeBookingModal();
});

elements.busyTimeModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeBusyTimeModal();
});

// Дополнительная функция: подтверждение удаления записи
async function confirmDeleteBooking(bookingId) {
  if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
    return;
  }
  await deleteBooking(bookingId);
}
