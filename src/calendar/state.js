import { formatDate } from '../utils/dateUtils.js';

// Состояние календаря
export const calendarState = {
  currentMonth: new Date().getMonth(), // 0–11
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  bookings: [],
  isAdminMode: false
};

// Получает текущую дату как объект Date
export const getCurrentDate = () => {
  return new Date(calendarState.currentYear, calendarState.currentMonth, 1);
};

// Устанавливает новый месяц/год
export const setCurrentMonthYear = (year, month) => {
  calendarState.currentYear = year;
  calendarState.currentMonth = month;
};

// Переход к следующему месяцу
export const nextMonth = () => {
  let { currentYear, currentMonth } = calendarState;
  if (currentMonth === 11) {
    currentYear++;
    currentMonth = 0;
  } else {
    currentMonth++;
  }
  setCurrentMonthYear(currentYear, currentMonth);
};

// Переход к предыдущему месяцу
export const prevMonth = () => {
  let { currentYear, currentMonth } = calendarState;
  if (currentMonth === 0) {
    currentYear--;
    currentMonth = 11;
  } else {
    currentMonth--;
  }
  setCurrentMonthYear(currentYear, currentMonth);
};

// Остальные функции
export const setSelectedDate = (date) => {
  calendarState.selectedDate = date;
};

export const updateBookings = (bookings) => {
  calendarState.bookings = bookings;
};

export const updateState = (newState) => {
  Object.assign(calendarState, newState);
};

export const getState = () => calendarState;

export const getBookingsForDate = (date) => {
  const dateStr = formatDate(date);
  return calendarState.bookings.filter(booking => booking.date === dateStr);
};

// Новые функции для управления записями
export const addBookingToState = (booking) => {
  calendarState.bookings.push(booking);
};

export const removeBookingFromState = (bookingId) => {
  calendarState.bookings = calendarState.bookings.filter(b => b.id !== bookingId);
};
