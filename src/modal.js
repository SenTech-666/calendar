// src/modal.js
export const showModal = (content) => {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        ${content}
      </div>
    </div>
  `;
};

export const closeModal = () => {
  document.getElementById("modal-root").innerHTML = "";
  if (window.currentUnsubscribe) {
    window.currentUnsubscribe();
    window.currentUnsubscribe = null;
  }
};

// Один раз глобально
window.closeModal = closeModal;