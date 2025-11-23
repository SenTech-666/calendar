// src/store.js — ФИНАЛЬНАЯ ВЕРСИЯ: текущий месяц НЕ считается прошедшим

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(), // 0–11
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

export const subscribe = fn => { subscribers.push(fn); fn(); };

export function prevMonth() {
  const newDate = new Date(store.year, store.month - 1);

  // Разрешаем переход назад ТОЛЬКО если:
  // 1. Это админ ИЛИ
  // 2. Новый месяц — это текущий месяц или будущий
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth(); // 0–11

  const newYear = newDate.getFullYear();
  const newMonthIndex = newDate.getMonth();

  // Формируем "ключ" месяца: 2025-10 для октября 2025 и т.д.
  const currentMonthKey = currentYear * 12 + currentMonthIndex;
  const newMonthKey = newYear * 12 + newMonthIndex;

  // Запрещаем только если новый месяц СТРОГО раньше текущего (например, октябрь, когда сейчас ноябрь)
  if (!store.isAdmin && newMonthKey < currentMonthKey) {
    if (typeof toast === 'function') {
      toast("Запись на прошедшие месяцы невозможна", "error");
    }
    return; // блокируем переход
  }

  // Всё остальное разрешено: текущий месяц и будущие — всегда можно
  store.year = newDate.getFullYear();
  store.month = newDate.getMonth();
  notify();
}

export function nextMonth() {
  const newDate = new Date(store.year, store.month + 1);
  store.year = newDate.getFullYear();
  store.month = newDate.getMonth();
  notify();
}

function notify() {
  subscribers.forEach(fn => fn());
}

export const updateBookingInStore = (id, updates) => {
  store.bookings = store.bookings.map(b => b.id === id ? { ...b, ...updates } : b);
};

export const removeBooking = (id) => {
  store.bookings = store.bookings.filter(b => b.id !== id);
};