// src/store.js — ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ (23.11.2025)
// Всё отрисовывается, текущий месяц НЕ блокируется, клиенты не могут в прошлое

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(), // 0–11
  currentDate: new Date(),      // ← ОБЯЗАТЕЛЬНО для отрисовки календаря!
  bookings: [],
  services: [],
  isAdmin: false,
  timeLimitHours: 2
};

const subscribers = [];

export const store = new Proxy(state, {
  set(target, prop, value) {
    target[prop] = value;
    subscribers.forEach(fn => fn());
    return true;
  }
});

export const subscribe = (fn) => {
  subscribers.push(fn);
  fn(); // вызываем сразу при подписке
};

// Обновляем все нужные поля за один раз
function updateMonth(year, month) {
  store.year = year;
  store.month = month;
  store.currentDate = new Date(year, month, 1); // ← это критично для рендера!
}

// Переход на предыдущий месяц
export function prevMonth() {
  const newDate = new Date(store.year, store.month - 1);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();

  const newYear = newDate.getFullYear();
  const newMonthIndex = newDate.getMonth();

  // Уникальный ключ месяца (чтобы сравнить)
  const currentKey = currentYear * 12 + currentMonthIndex;
  const newKey = newYear * 12 + newMonthIndex;

  // Блокируем ТОЛЬКО если месяц СТРОГО раньше текущего
  if (!store.isAdmin && newKey < currentKey) {
    if (typeof toast === 'function') {
      toast("Запись на прошедшие месяцы невозможна", "error");
    }
    return;
  }

  updateMonth(newDate.getFullYear(), newDate.getMonth());
}

// Переход на следующий месяц
export function nextMonth() {
  const newDate = new Date(store.year, store.month + 1);
  updateMonth(newDate.getFullYear(), newDate.getMonth());
}

// Остальные функции (без изменений)
export const updateBookingInStore = (id, updates) => {
  store.bookings = store.bookings.map(b => 
    b.id === id ? { ...b, ...updates } : b
  );
};

export const removeBooking = (id) => {
  store.bookings = store.bookings.filter(b => b.id !== id);
};

// Дополнительно: если нужно — можно экспортировать для админа
export const setAdminMode = (value) => {
  store.isAdmin = value;
};