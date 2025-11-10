const services = ['Консультация', 'Диагностика', 'Ремонт', 'Настройка'];
const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];


function formatDate(dateString) {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    console.warn('Некорректная дата:', dateString);
    return 'Неизвестная дата';
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn('Неверный формат даты:', dateString);
    return 'Неверная дата';
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  } catch (error) {
    console.error('Ошибка форматирования даты:', error, dateString);
    return 'Ошибка даты';
  }
}

function isDayFullyBooked(dateStr) {
  const availableSlots = timeSlots.length;
  const bookedSlots = bookings.filter(b => b.date === dateStr).length;
  return bookedSlots >= availableSlots;
}

function getBookingLevel(dateStr) {
  const bookedCount = bookings.filter(b => b.date === dateStr).length;
  const totalSlots = timeSlots.length;

  if (bookedCount === 0) return 0;
  if (bookedCount >= totalSlots) return 'full';

  return Math.min(4, Math.ceil(bookedCount / (totalSlots / 4)));
}

function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
}

function getCurrentDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(dateStr) {
  return dateStr === getCurrentDateString();
}

export {
  services,
  timeSlots,
  formatDate,
  isDayFullyBooked,
  getBookingLevel,
  isValidDateString,
  getCurrentDateString,
  isToday
};
