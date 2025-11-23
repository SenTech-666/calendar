// src/store.js — ЗАПРЕТ НА ПРОШЛОЕ ДЛЯ КЛИЕНТОВ + ТОСТ

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfNewMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);

  // ЗАПРЕТ ДЛЯ КЛИЕНТОВ: нельзя в прошедший месяц
  if (!store.isAdmin && firstDayOfNewMonth < today) {
    if (typeof toast === 'function') {
      toast("Запись на прошедшие даты невозможна", "error");
    }
    return;
  }

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