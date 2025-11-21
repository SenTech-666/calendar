// src/main.js
import "./telegram.js"; // просто подключи файл — уведомления заработают
import { store, prevMonth, nextMonth } from "./store.js";
import { renderCalendar } from "./calendar.js";
import { bookingsCol, servicesCol, db } from "./firebase.js";
import { onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { showModal, toast, closeModal } from "./modal.js";
import { removeBooking } from "./store.js";
import { openEditBookingModal } from "./components.js";

// Навигация
document.getElementById("prevMonth").onclick = prevMonth;
document.getElementById("nextMonth").onclick = nextMonth;

// Переключение режима — правильные подписи!
const toggleBtn = document.getElementById("toggleMode");
toggleBtn.onclick = () => {
  store.isAdmin = !store.isAdmin;
  toggleBtn.textContent = store.isAdmin ? "Перейти в режим клиента" : "Войти как администратор";
  toggleBtn.style.background = store.toggle("admin-mode", store.isAdmin);
  document.body.classList.toggle("admin", store.isAdmin);
  document.getElementById("manageServicesBtn").style.display = store.isAdmin ? "block" : "none";
};

document.getElementById("timeLimit").onchange = e => store.timeLimitHours = +e.target.value;

// Синхронизация
onSnapshot(bookingsCol, snap => {
  store.bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
});

onSnapshot(servicesCol, snap => {
  store.services = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (store.services.length === 0) {
    ["Консультация", "Массаж", "Физиотерапия"].forEach((name, i) => {
      addDoc(servicesCol, { name, duration: 30 + i * 30 });
    });
  }
});

// Глобальные функции
window.cancelBooking = async (id) => {
  if (!confirm("Отменить запись?")) return;
  await deleteDoc(doc(db, "bookings", id));
  removeBooking(id);
  toast("Запись отменена", "success");
};

window.closeModal = closeModal;

// === Управление услугами ===
window.openServicesModal = () => {
  if (!store.isAdmin) return toast("Только администратор", "error");

  showModal(`
    <h3>Управление услугами</h3>
    <div id="servicesList">
      ${store.services.length === 0 
        ? `<p style="color:#95a5a6;text-align:center;padding:30px;">Услуг пока нет</p>`
        : store.services.map(s => `
          <div class="service-item" data-id="${s.id}">
            <input type="text" value="${s.name}" data-field="name">
            <input type="number" value="${s.duration}" min="15" step="15" data-field="duration">
            <span>мин</span>
            <button class="danger" onclick="deleteService('${s.id}')">Удалить</button>
          </div>
        `).join("")}
    </div>

    <div style="margin-top:25px;padding-top:20px;border-top:1px solid #ddd;">
      <h4 style="margin-bottom:12px;">Добавить новую услугу</h4>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input type="text" id="newName" placeholder="Название услуги" style="flex:1;min-width:200px;">
        <input type="number" id="newDuration" value="30" min="15" step="15" style="width:100px;">
        <span>мин</span>
        <button class="primary" onclick="addNewService()">Добавить</button>
      </div>
    </div>

    <div class="buttons" style="margin-top:25px;">
      <button class="secondary" onclick="window.closeModal()">Закрыть</button>
    </div>
  `);

  document.querySelectorAll(".service-item input").forEach(input => {
    input.addEventListener("change", function () {
      const id = this.closest(".service-item").dataset.id;
      const field = this.dataset.field;
      const value = field === "duration" ? Number(this.value) : this.value.trim();

      if (!value || (field === "duration" && value < 15)) {
        toast("Некорректное значение", "error");
        this.focus();
        return;
      }

      updateDoc(doc(db, "services", id), { [field]: value })
        .then(() => toast("Услуга обновлена", "success"))
        .catch(() => toast("Ошибка сохранения", "error"));
    });
  });
};

window.addNewService = () => {
  const name = document.getElementById("newName").value.trim();
  const duration = Number(document.getElementById("newDuration").value);
  if (!name || duration < 15) return toast("Заполните корректно", "error");

  addDoc(servicesCol, { name, duration })
    .then(() => {
      toast("Услуга добавлена", "success");
      document.getElementById("newName").value = "";
      document.getElementById("newDuration").value = 30;
    })
    .catch(() => toast("Ошибка", "error"));
};

window.deleteService = (id) => {
  if (!confirm("Удалить услугу?")) return;
  deleteDoc(doc(db, "services", id))
    .then(() => toast("Услуга удалена", "success"))
    .catch(() => toast("Ошибка", "error"));
};

// === Блокировка ===
window.blockWholeDay = (dateStr) => {
  const reason = prompt("Причина блокировки всего дня:", "Выходной")?.trim();
  if (!reason) return toast("Укажите причину", "error");

  addDoc(bookingsCol, { date: dateStr, time: "00:00", name: reason, duration: 0, blocked: true })
    .then(() => { toast("День заблокирован", "success"); closeModal(); });
};

window.blockTimeSlot = (dateStr) => {
  const times = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14 14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];
  const options = times.map(t => `<option value="${t}">${t}</option>`).join("");

  showModal(`
    <h3>Заблокировать время</h3>
    <p><strong>Дата:</strong> ${dateStr}</p>
    <label>Начало</label>
    <select id="blockStart">${options}</select>
    <label>Длительность</label>
    <select id="blockDuration">
      <option value="30">30 мин</option>
      <option value="60" selected>1 час</option>
      <option value="90">1.5 часа</option>
      <option value="120">2 часа</option>
      <option value="180">3 часа</option>
    </select>
    <label>Причина</label>
    <input type="text" id="blockReason" placeholder="Обед / Приём у другого врача">
    <div class="buttons" style="margin-top:25px;">
      <button class="secondary" onclick="window.closeModal()">Отмена</button>
      <button class="danger" onclick="confirmBlockTime('${dateStr}')">Заблокировать</button>
    </div>
  `);
};

window.confirmBlockTime = (dateStr) => {
  const start = document.getElementById("blockStart").value;
  const duration = Number(document.getElementById("blockDuration").value);
  const reason = document.getElementById("blockReason").value.trim() || "Заблокировано";

  addDoc(bookingsCol, { date: dateStr, time: start, name: reason, duration, blocked: true })
    .then(() => {
      const end = window.formatTimeEnd(start, duration);
      toast(`Заблокировано: ${start} – ${end}`, "success");
      closeModal();
    });
};

window.unblockDay = async (dateStr) => {
  if (!confirm("Разблокировать весь день?")) return;
  const blocked = store.bookings.find(b => b.date === dateStr && b.blocked && b.time === "00:00");
  if (blocked) await deleteDoc(doc(db, "bookings", blocked.id));
  toast("День разблокирован", "success");
  closeModal();
};

window.unblockTimeSlot = async (id) => {
  if (!confirm("Разблокировать этот слот?")) return;
  await deleteDoc(doc(db, "bookings", id));
  toast("Слот разблокирован", "success");
  closeModal();
};

window.formatTimeEnd = (start, duration) => {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + duration;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${endH.toString().padStart(2,0)}:${endM.toString().padStart(2,0)}`;
};

window.editBooking = (id) => {
  if (!store.isAdmin) return toast("Только администратор", "error");
  openEditBookingModal(id);
};

document.getElementById("manageServicesBtn").onclick = window.openServicesModal;

renderCalendar();