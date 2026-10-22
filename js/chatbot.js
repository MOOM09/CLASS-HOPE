/* ============================================================
   chatbot.js
   مساعد ذكي بسيط - يجاوب أسئلة عن الطلاب
   ============================================================ */

const HELP =
  "Try: how many students, archived, active, absent, late, present, CS, IT, Business, or a student name.";

const DEPARTMENTS = ["cs", "it", "business"];
const ATTENDANCE = ["absent", "late", "present"];

/* ================= HELPERS ================= */

// استخراج status من attendance (يدعم object و string)
function getStatus(student) {
  const att = student.attendance;
  if (att && typeof att === "object") return att.status || "";
  return att || "";
}

function names(list) {
  return list.length ? list.map((s) => s.name).join(", ") : "none";
}

/* ================= ANSWER LOGIC ================= */

function answer(text, students) {
  const q = text.toLowerCase().trim();
  const words = q.split(/\W+/);

  const active = students.filter((s) => !s.archived);
  const archived = students.filter((s) => s.archived);

  if (!q || q.includes("help")) return HELP;

  // ---- Department ----
  const department = DEPARTMENTS.find((d) => words.includes(d));
  if (department) {
    const list = active.filter(
      (s) => s.department && s.department.toLowerCase() === department
    );
    return `${list.length} active student(s) in ${department.toUpperCase()}: ${names(list)}.`;
  }

  // ---- Total / Count ----
  if (q.includes("how many") || q.includes("count") || q.includes("total")) {
    return `You have ${students.length} students: ${active.length} active and ${archived.length} archived.`;
  }

  // ---- Archived / Active ----
  if (q.includes("archived")) return `Archived students: ${names(archived)}.`;
  if (q.includes("active")) return `Active students: ${names(active)}.`;

  // ---- Attendance status ----
  const status = ATTENDANCE.find((a) => q.includes(a));
  if (status) {
    const list = active.filter((s) => getStatus(s) === status);
    return `Active students marked ${status}: ${names(list)}.`;
  }

  // ---- Specific student by name ----
  const student = students.find((s) => {
    if (!s.name) return false;
    const full = s.name.toLowerCase();
    return q.includes(full) || q.includes(full.split(" ")[0]);
  });

  if (student) {
    const statusDisplay = getStatus(student) || "unknown";
    return `${student.name} - ID ${student.studentId || "N/A"}, ${student.email || "N/A"}, ${student.department || "N/A"}, attendance: ${statusDisplay}, ${student.archived ? "archived" : "active"}.`;
  }

  return `I did not understand that. ${HELP}`;
}

/* ================= UI ================= */

export function initChatbot(getStudents) {
  const toggle = document.getElementById("chat-toggle");
  const panel = document.getElementById("chat-panel");
  const close = document.getElementById("chat-close");
  const messages = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  // حماية: لو العناصر ناقصة، ما نكمل
  if (!toggle || !panel || !messages || !form || !input) return;

  function addMessage(text, who) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // فتح/إغلاق البوت
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;

    if (!panel.hidden) {
      if (!messages.children.length) {
        addMessage(
          "Hi! Ask me about your students. Type help to see what I can do.",
          "bot"
        );
      }
      input.focus();
    }
  });

  // زر الإغلاق
  if (close) {
    close.addEventListener("click", () => (panel.hidden = true));
  }

  // إرسال رسالة
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    addMessage(answer(text, getStudents()), "bot");
    input.value = "";
    input.focus();
  });
}