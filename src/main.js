
import { initElements } from './dom/elements.js';
import { setupCalendar } from './calendar/events.js';
import { loadBookingsFromFirebase } from './firebase/firestore.js';
import { updateModeButtonText } from './calendar/utils.js'; // если есть

document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  await loadBookingsFromFirebase();
  setupCalendar();

  // Обработчики кнопок и т.п.
});