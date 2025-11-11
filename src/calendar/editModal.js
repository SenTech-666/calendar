
import { createElement, $ } from '/src/dom/elements.js';
import { updateBooking } from '/src/firebase/firestore.js';
import { renderCalendar } from './render.js';

let editModalInstance = null;

export const showEditModal = (booking) => {
  if (editModalInstance) return;

  editModalInstance = createElement('div', { className: 'modal edit-modal' }, [
    createElement('div', { className: 'modal-content' }, [
      createElement('h3', {}, ['Редактирование записи']),
      createElement('p', {}, [`Дата: ${booking.date}`]),


      createElement('div', {}, [
        createElement('label', { htmlFor: 'editTime' }, ['Новое время:']),
        createElement('input', {
          type: 'time',
          id: 'editTime',
          value: booking.time,
          required: true
        })
      ]),

      createElement('button', { id: 'saveEdit', type: 'button' }, ['Сохранить']),
      createElement('button', {
        id: 'closeEditModal',
        type: 'button',
        className: 'btn-secondary'
      }, ['Закрыть'])
    ])
  ]);

  document.body.appendChild(editModalInstance);


  // Обработчики событий
  $('#saveEdit').addEventListener('click', async () => {
    const newTime = $('#editTime').value;
    try {
      await updateBooking(booking.id, { time: newTime });
      alert('Запись обновлена!');
      closeEditModal();
      renderCalendar(); // Перерисовываем календарь
    } catch (error) {
      console.error('Ошибка при обновлении записи:', error);
      alert('Не удалось обновить запись.');
    }
  });

  $('#closeEditModal').addEventListener('click', closeEditModal);
};

const closeEditModal = () => {
  if (editModalInstance) {
    editModalInstance.remove();
    editModalInstance = null;
  }
};