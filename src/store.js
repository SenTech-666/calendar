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

export const subscribe = (fn) => { subscribers.push(fn); fn(); };

// src/store.js — ИСПРАВЛЕННЫЕ prevMonth и nextMonth (это всё, что нужно!)

export function prevMonth() {
  const newDate = new Date(store.year, store.month - 1);
  store.year = newDate.getFullYear();
  store.month = newDate.getMonth();
  store.currentDate = newDate;        // ← ЭТО САМОЕ ВАЖНОЕ!
  notifySubscribers();                // ← принудительно вызываем обновление
}

export function nextMonth() {
  const newDate = new Date(store.year, store.month + 1);
  store.year = newDate.getFullYear();
  store.month = newDate.getMonth();
  store.currentDate = newDate;        // ← ЭТО САМОЕ ВАЖНОЕ!
  notifySubscribers();                // ← принудительно вызываем обновление
}

export const updateBookingInStore = (id, updates) => {
  store.bookings = store.bookings.map(b => b.id === id ? { ...b, ...updates } : b);
};

export const removeBooking = (id) => {
  store.bookings = store.bookings.filter(b => b.id !== id);
};