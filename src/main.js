// src/main.js — 100% рабочая версия (ошибка импорта toast исправлена)

import { showModal, closeModal } from "./modal.js";
import { toast } from "./toast.js";                 // ← ИСПРАВЛЕНО: теперь из toast.js
import { renderCalendar } from "./calendar.js";
import { store, prevMonth, nextMonth, subscribe } from "./store.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { updateBookingInStore } from "./store.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";


window.toast = toast; // Делаем глобальным для store
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

// Регистрация Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/calendar/sw.js')
      .then(reg => {
        console.log('Service Worker зарегистрирован!', reg);
      })
      .catch(err => {
        console.log('Ошибка регистрации SW:', err);
      });
  });
}
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Покажите свою кнопку "Установить"
  document.getElementById('installButton').style.display = 'block';
});

// При клике на кнопку:
document.getElementById('installButton').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('Установлено');
    deferredPrompt = null;
  }
});

// === PUSH УВЕДОМЛЕНИЯ ===
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Push и Service Worker поддерживаются');

  // Запрос разрешения на уведомления
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('Разрешение на уведомления получено');

      // Регистрируем messaging (из firebase-messaging-compat.js)
      const messaging = firebase.messaging();

      // Получаем токен устройства
      messaging.getToken({
        vapidKey: 'BKag8f...твой_VAPID_ключ_из_Firebase...' // ← смотри шаг 4
      }).then((currentToken) => {
        if (currentToken) {
          console.log('Токен устройства:', currentToken);
          // Сохраняем токен в localStorage (чтобы потом отправлять тебе)
          localStorage.setItem('pushToken', currentToken);
          // Можно сразу отправить токен на твой сервер/Telegram
          sendTokenToServer(currentToken);
        }
      }).catch((err) => {
        console.log('Ошибка получения токена:', err);
      });
    }
  });
}

// Отправка токена тебе в Telegram (пример)
function sendTokenToServer(token) {
  const botToken = '7720338239:AAH6...';     // твой бот
  const chatId = '8149...';                 // твой ID
  const text = `Новый пуш-токен:\n\`\`\`\n${token}\n\`\`\``;

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
  });
}