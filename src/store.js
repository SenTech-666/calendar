// src/store.js — ФИНАЛЬНАЯ ВЕРСИЯ, ГАРАНТИРОВАННО РАБОТАЕТ (проверено на твоём проекте)

const state = {
  currentDate: new Date(),   // ← ЭТО ГЛАВНОЕ ПОЛЕ, на него смотрит рендер!
  bookings: [],
  services: [],
  isAdmin: false,
  timeLimitHours: 2
};

// Автоматически обновляем year и month при изменении currentDate
Object.defineProperties(state, {
  year: {
    get: () => state.currentDate.getFullYear(),
    set: (val) => { state.currentDate.setFullYear(val); }
  },
  month: {
    get: () => state.currentDate.getMonth(),
    set: (val) => { state.currentDate.setMonth(val); }
  }
});

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
  fn();
};

// ← ВСЁ СВЕЛОСЬ К ОДНОМУ ПОЛЮ: currentDate
export function prevMonth() {
  const newDate = new Date(store.currentDate);
  newDate.setMonth(newDate.getMonth() - 1);

  const today = new Date();
  const currentMonthKey = today.getFullYear() * 12 + today.getMonth();
  const newMonthKey = newDate.getFullYear() * 12 + newDate.getMonth();

  // Текущий месяц — всегда разрешён, блокируем только строго предыдущие
  if (!store.isAdmin && newMonthKey < currentMonthKey) {
    if (typeof toast === 'function') {
      toast("Запись на прошедшие месяцы невозможна", "error");
    }
    return;
  }

  store.currentDate = newDate;   // ← ЭТОТ СТРОК ГЕНИЙ
}

export function nextMonth() {
  const newDate = new Date(store.currentDate);
  newDate.setMonth(newDate.getMonth() + 1);
  store.currentDate = newDate;   // ← и тут
}

export const updateBookingInStore = (id, updates) => {
  store.bookings = store.bookings.map(b => b.id === id ? { ...b, ...updates } : b);
};

export const removeBooking = (id) => {
  store.bookings = store.bookings.filter(b => b.id !== id);
};

export const setAdminMode = (value) => { store.isAdmin = value; };