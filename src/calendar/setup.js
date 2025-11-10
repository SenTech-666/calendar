
import { loadBookingsFromFirebase } from '../firebase/firestore.js';
import { initElements } from '../dom/elements.js';
import { updateModeButtonText } from './mode.js';
import { renderCalendar, updateCalendarVisuals } from './events.js';
import { isAdminMode } from './state.js';

let setupCalendarPromise = null;

export async function setupCalendar() {
  // Предотвращаем множественные параллельные вызовы
  if (setupCalendarPromise) {
    return setupCalendarPromise;
  }

  setupCalendarPromise = (async () => {
    try {
      await loadBookingsFromFirebase();
      renderCalendar();
      updateCalendarVisuals();
    } catch (error) {
      console.error('Ошибка при настройке календаря:', error);
    } finally {
      setupCalendarPromise = null;
    }
  })();

  return setupCalendarPromise;
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  initElements();

  // Обработчики для админ‑панели
  if (elements.saveThresholdBtn) {
    elements.saveThresholdBtn.addEventListener('click', () => {
      const inputValue = elements.timeThresholdInput.value;
      if (inputValue && !isNaN(inputValue) && parseInt(inputValue) > 0) {
        adminTimeThreshold = parseInt(inputValue);
        alert(`Пороговое время обновлено: ${adminTimeThreshold} мин.`);
      } else {
        alert('Введите корректное положительное число минут.');
      }
    });
  }

  if (elements.toggleAdminMode) {
    elements.toggleAdminMode.addEventListener('click', async () => {
      isAdminMode = !isAdminMode;
      updateModeButtonText();
      await setupCalendar();
    });
  }

  // Запуск календаря
  await setupCalendar();
});
