// src/modal.js — 100% рабочая версия

export const showModal = (content) => {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal" onclick="event.stopPropagation()">
        ${content}
      </div>
    </div>
  `;

  // Закрытие по клику вне формы
  root.querySelector(".modal-backdrop").addEventListener("click", closeModal);
};

export const closeModal = () => {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";
};

// Делаем closeModal доступным глобально для кнопки "Отмена"
window.closeModal = closeModal;