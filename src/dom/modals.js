import { elements } from './elements.js';
import { renderAdminBookings } from '../calendar/events.js';
import { formatDate } from '../calendar/utils.js';


function openDateDetailsModal(dateStr) {
  elements.modalDateTitle.textContent = formatDate(dateStr);
  renderAdminBookings(dateStr);
  elements.dateDetailsModal.style.display = 'block';
}

function closeDateDetailsModal() {
  closeModals();
}

function closeBookingModal() {
  closeModals();
}

function closeBusyTimeModal() {
  closeModals();
}

// Обработчики закрытия
document.addEventListener('click', (e) => {
  if (
    e.target === elements.bookingModal ||
    e.target === elements.dateDetailsModal ||
    e.target === elements.busyTimeModal
  ) {
    closeModals();
  }
  if (e.target.classList.contains('btn-close')) {
    closeModals();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.keyCode === 27) {
    closeModals();
  }
});

export {
  openDateDetailsModal,
  closeDateDetailsModal,
  closeBookingModal,
  closeBusyTimeModal
};
