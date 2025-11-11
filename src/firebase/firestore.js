import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';


const firebaseConfig = {
  apiKey: "AIzaSyCr08aVXswvpjwwLvtSbpBnPhE8dv3HWdM",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.firebasestorage.app",
  messagingSenderId: "665606748855",
  appId: "1:665606748855:web:5e4a2865b1f26494cf2b32",
  measurementId: "G-2ETMLYKBJS"
};

let app;
let firestore;


try {
  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  console.log('Firebase инициализирован успешно');
  
  // Экспортируем в глобальное пространство для доступа из других модулей
  window.FIREBASE = { app, firestore };
} catch (error) {
  console.error('Ошибка инициализации Firebase:', error);
}


/**
 * Получение всех записей из Firestore
 */
export const getBookings = async () => {
  try {
    const bookingsRef = collection(firestore, 'bookings');
    const snapshot = await getDocs(bookingsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Ошибка получения записей из Firestore:', error);
    throw error;
  }
};

/**
 * Добавление новой записи
 */
export const addBooking = async (booking) => {
  try {
    const bookingsRef = collection(firestore, 'bookings');
    await addDoc(bookingsRef, booking);
  } catch (error) {
    console.error('Ошибка добавления записи в Firestore:', error);
    throw error;
  }
};

/**
 * Удаление записи по дате и времени
 */
export const removeBooking = async (date, time) => {
  try {
    const q = query(
      collection(firestore, 'bookings'),
      where('date', '==', date),
      where('time', '==', time)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => deleteDoc(doc.ref));
  } catch (error) {
    console.error('Ошибка удаления записи из Firestore:', error);
    throw error;
  }
};

/**
 * Обновление записи
 */
export const updateBooking = async (id, updates) => {
  try {
    const bookingRef = doc(firestore, 'bookings', id);
    await updateDoc(bookingRef, updates);
  } catch (error) {
    console.error('Ошибка обновления записи в Firestore:', error);
    throw error;
  }
};

/**
 * Удаление записи по ID
 */
export const deleteBooking = async (id) => {
  try {
    const bookingRef = doc(firestore, 'bookings', id);
    await deleteDoc(bookingRef);
  } catch (error) {
    console.error('Ошибка удаления записи по ID из Firestore:', error);
    throw error;
  }
};

// Экспорт основных объектов Firebase
export { app, firestore };
