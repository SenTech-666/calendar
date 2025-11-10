import { elements } from '../dom/elements.js';
import { isAdminMode } from './state.js';

export function updateModeButtonText() {
  if (elements.toggleAdminMode) {
    elements.toggleAdminMode.textContent = `Режим: ${isAdminMode ? 'Администратор' : 'Пользователь'}`;
  }
  if (elements.adminControls) {
    elements.adminControls.style.display = isAdminMode ? 'block' : 'none';
  }
}
