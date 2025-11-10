
import { Timestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


export function timestampToString(timestamp) {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  } else if (typeof timestamp === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(timestamp)) {
      return timestamp;
    }
    try {
      return new Date(timestamp).toISOString().split('T')[0];
    } catch (e) {
      console.error('Не удалось преобразовать строку в дату:', timestamp);
      return '';
    }
  }
  console.error('Неподдерживаемый тип даты:', timestamp);
  return '';
}
