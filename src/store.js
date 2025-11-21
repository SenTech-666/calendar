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

export const nextMonth = () => {
  if (store.month === 11) { store.month = 0; store.year++; }
  else store.month++;
};

export const prevMonth = () => {
  if (store.month === 0) { store.month = 11; store.year--; }
  else store.month--;
};

export const updateBookingInStore = (id, updates) => {
  store.bookings = store.bookings.map(b => b.id === id ? { ...b, ...updates } : b);
};

export const removeBooking = (id) => {
  store.bookings = store.bookings.filter(b => b.id !== id);
};