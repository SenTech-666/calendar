// /calendar/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Твой новый конфиг из Firebase Console
firebase.initializeApp({
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.appspot.com",
  messagingSenderId: "1234567890",          // ← вот этот новый
  appId: "1:1234567890:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
});

const messaging = firebase.messaging();

// Фоновые уведомления (когда приложение закрыто)
messaging.onBackgroundMessage((payload) => {
  console.log('Получено фоновое уведомление:', payload);

  const notificationTitle = payload.notification?.title || 'Новая запись!';
  const notificationOptions = {
    body: payload.notification?.body || 'У вас новая запись на маникюр',
    icon: '/calendar/icon-192.png',
    badge: '/calendar/icon-192.png',
    tag: 'booking-notification',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});