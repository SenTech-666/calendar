import { $ } from './elements.js';

export const showModal = () => {
  $('#bookingModal').classList.remove('hidden');
};

export const hideModal = () => {
  $('#bookingModal').classList.add('hidden');
};

export const setModalDate = (dateStr) => {
  $('#selectedDateDisplay').textContent = dateStr;
};
