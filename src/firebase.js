// src/firebase.js — ФИНАЛЬНАЯ ВЕРСИЯ (совмещённая + 100% рабочая)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Твоя конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCr08aVXswvpjwwLvtSbpBnPhE8dv3HWdM",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.appspot.com",
  messagingSenderId: "665606748855",
  appId: "1:665606748855:web:5e4a2865b1f26494cf2b32"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const bookingsCol = collection(db, "bookings");
export const servicesCol = collection(db, "services");

// КЛЮЧЕВАЯ ФУНКЦИЯ — добавление записи с возвратом ID
export async function addBooking(data) {
  try {
    const docRef = await addDoc(bookingsCol, {
      ...data,
      createdAt: new Date().toISOString()
    });
    // ВОЗВРАЩАЕМ ID СРАЗУ — это критично для блокировки/разблокировки!
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Ошибка в addBooking:", error);
    throw error; // чтобы toast показал ошибку
  }
}

// Обновление записи
export const updateBooking = async (id, data) => {
  try {
    await updateDoc(doc(db, "bookings", id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Ошибка обновления:", error);
    throw error;
  }
};

// Удаление записи
export const deleteBookingById = async (id) => {
  try {
    await deleteDoc(doc(db, "bookings", id));
  } catch (error) {
    console.error("Ошибка удаления:", error);
    throw error;
  }
};

// Экспортируем onSnapshot, если где-то используется напрямую
export { onSnapshot };