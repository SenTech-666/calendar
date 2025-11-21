export const formatDate = (date) => date.toISOString().split('T')[0];
export const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export const isToday = (d) => d.toDateString() === new Date().toDateString();
export const isPastDate = (d) => d.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);