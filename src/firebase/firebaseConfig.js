import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";


// /src/firebase/firebaseConfig.js



const firebaseConfig = {
  apiKey: "AIzaSyCr08aVXswvpjwwLvtSbpBnPhE8dv3HWdM",
  authDomain: "calendar-666-5744f.firebaseapp.com",
  projectId: "calendar-666-5744f",
  storageBucket: "calendar-666-5744f.firebasestorage.app",
  messagingSenderId: "665606748855",
  appId: "1:665606748855:web:5e4a2865b1f26494cf2b32",
  measurementId: "G-2ETMLYKBJS"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, db, analytics };
 // Инициализация Firebase
firebase.initializeApp(firebaseConfig);

