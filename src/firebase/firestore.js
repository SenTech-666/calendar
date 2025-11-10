import { elements } from '../dom/elements.js';
import { db } from './firebaseConfig.js';
import { 
  collection,
  getDocs,
  addDoc,
  doc,
  Timestamp,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { timestampToString } from '../utils/dateUtils.js';

let bookings = [];

export async function loadBookingsFromFirebase() {
  try {
    elements.loading.style.display = 'block';
    const bookingsCollection = collection(db, 'bookings');
    const querySnapshot = await getDocs(bookingsCollection);

    bookings = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id;
      data.date = timestampToString(data.date);

      if (!data.date || data.date === '') {
        console.warn('Пропущена запись без даты:', data);
        return;
      }

      bookings.push(data);
    });
  } catch (error) {
    console.error('Ошибка загрузки из Firestore:', error);
    alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

export async function saveBooking(booking) {
  try {
    elements.loading.style.display = 'block';
    const bookingsCollection = collection(db, 'bookings');
    await addDoc(bookingsCollection, booking);
  } catch (error) {
    console.error('Ошибка сохранения в Firestore:', error);
    alert('Не удалось сохранить запись. Попробуйте ещё раз.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

export async function deleteBooking(bookingId) {
  try {
    elements.loading.style.display = 'block';
    await deleteDoc(doc(db, 'bookings', bookingId));
    await loadBookingsFromFirebase();
    setupCalendar();
  } catch (error) {
    console.error('Ошибка удаления записи:', error);
    alert('Не удалось удалить запись.');
  } finally {
    elements.loading.style.display = 'none';
  }
}

export async function isTimeBusy(date, time) {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      where('time', '==', time)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Ошибка проверки занятости:', error);
    return false;
  }
}

// Экспортируем bookings для доступа извне
export { bookings };
