const root = document.getElementById("modal-root");

export const closeModal = () => root.innerHTML = "";

export const showModal = (content) => {
  root.innerHTML = `
    <div class="modal-backdrop" onclick="event.target === this && window.closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        ${content}
      </div>
    </div>`;
};

export const toast = (msg, type = "info") => {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const t = document.createElement("div");
  t.innerHTML = `${icons[type] || "●"} ${msg}`;
  t.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:${type==="error"?"#e74c3c":type==="success"?"#27ae60":"#3498db"};
    color:white;padding:14px 32px;border-radius:12px;z-index:10000;
    font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.2);min-width:220px;text-align:center;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
};

window.closeModal = closeModal;