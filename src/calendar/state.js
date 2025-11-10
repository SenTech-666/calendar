// Глобальные переменные состояния
export let isAdminMode = true;
export let adminTimeThreshold = 60; // минут
// ./src/calendar/state.js

// Текущее состояние режима


/**
 * Переключает режим администратора
 */
export function toggleAdminMode() {
  isAdminMode = !isAdminMode;
  console.log('Режим администратора:', isAdminMode ? 'ВКЛ' : 'ВЫКЛ');
  // Здесь можно добавить логику обновления интерфейса
}

/**
 * Возвращает текущий режим
 * @returns {boolean}
 */
export function getAdminMode() {
  return isAdminMode;
}

