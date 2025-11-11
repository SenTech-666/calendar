import { getDaysInMonth, formatDate } from '../utils/dateUtils.js';
import { getState } from './state.js';

export const isDateBooked = (dateStr, time) => {
  return getState().bookings.some(b => b.date === dateStr && b.time === time);
};

export const isDateDisabled = (date) => {
  const today = new Date();
  const limitDate = new Date(today.getTime() + getState().timeLimitHours * 60 * 60 * 1000);

  if (date < limitDate) return true; // Раньше лимита
  if (date.getDay() === 0) return true; // Воскресенье
  return false;
};

export const getBusyLevel = (dateStr) => {
  const bookings = getState().bookings.filter(b => b.date === dateStr);
  const count = bookings.length;
  if (count >= 5) return 'busy-high';
  if (count >= 3) return 'busy-medium';
  return '';
};
