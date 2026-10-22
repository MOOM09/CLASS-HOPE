export function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}