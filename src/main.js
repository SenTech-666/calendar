// src/main.js — 100% рабочая версия (ошибка импорта toast исправлена)

import { showModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";                 // ← ИСПРАВЛЕНО: теперь из toast.js
import { renderCalendar } from "./calendar.js";
import { store, prevMonth, nextMonth, subscribe } from "./store.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { updateBookingInStore } from "./store.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";


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
export const auth = getAuth(app);
export const bookingsCol = collection(db, "bookings");
export const servicesCol = collection(db, "services");

// Подписки на Firebase
// src/main.js — ОБЯЗАТЕЛЬНО ТАК!
onSnapshot(bookingsCol, (snap) => {
  store.bookings = snap.docs.map(doc => ({
    id: doc.id,                 // ← ЭТО САМОЕ ВАЖНОЕ!
    ...doc.data()
  }));
  renderCalendar?.();
});

onSnapshot(servicesCol, (snap) => {
  store.services = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCalendar?.();
});

// Админ-панель
onAuthStateChanged(auth, (user) => {
  store.isAdmin = !!user;
  const adminControls = document.querySelector(".admin-controls");
  if (adminControls) adminControls.style.display = user ? "block" : "none";
  renderCalendar?.();
});


function updateMonthTitle() {
  const el = document.getElementById("currentMonth");
  if (el) {
    const date = new Date(store.year, store.month);
    el.textContent = date.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric"
    }).replace(/^\w/, w => w.toUpperCase());
  }
}

// Перерисовка календаря + заголовка
function fullRender() {
  renderCalendar();
  updateMonthTitle();
}

// Кнопки ← и →
document.getElementById("prevMonth")?.addEventListener("click", () => {
  prevMonth();      // меняем store.month и store.year
  fullRender();
});

document.getElementById("nextMonth")?.addEventListener("click", () => {
  nextMonth();
  fullRender();
});

// Авто-рендер при любых изменениях в store (брони, блокировка и т.д.)
subscribe(() => {
  fullRender();
});

// Первая отрисовка при загрузке страницы
fullRender();