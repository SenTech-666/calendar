import { updateState, getState } from './state.js';
import { $ } from '../dom/elements.js';
import { renderCalendar } from './render.js';

export const toggleMode = () => {
  const isAdmin = !getState().isAdminMode;
  updateState({ isAdminMode: isAdmin });

  const btn = $('#toggleModeBtn');
  if (btn) {
    btn.textContent = isAdmin ? 'Режим администратора' : 'Режим пользователя';
      if (isAdmin) {
      btn.classList.remove('btn-user');
      btn.classList.add('btn-admin');
    } else {
      btn.classList.remove('btn-admin');
      btn.classList.add('btn-user');
    }
  }


  renderCalendar(); // Перерисовка календаря
};

// Инициализация обработчика
export const initModeToggle = () => {
  const btn = $('#toggleModeBtn');
  if (btn) {
    btn.addEventListener('click', toggleMode);
  } else {
    console.error('Кнопка #toggleModeBtn не найдена');
  }
};
