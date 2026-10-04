import { getInstructor, saveStudents, fetchRandomName } from "./api.js";
import { getInstructorId } from "./session.js";
import { generateId, escapeHtml } from "./helpers.js";
import { initChatbot } from "./chatbot.js";

const PAGE_SIZE = 5;

const ICONS = {
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  archive: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></svg>',
  restore: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/></svg>',
};

const instructorId = getInstructorId();

const body = document.getElementById("students-body");
const empty = document.getElementById("empty");
const message = document.getElementById("message");
const pagination = document.getElementById("pagination");
const showing = document.getElementById("showing");
const dialog = document.getElementById("student-dialog");
const form = document.getElementById("student-form");
const formError = document.getElementById("form-error");
const searchInput = document.getElementById("search");
const departmentFilter = document.getElementById("department-filter");
const statusFilter = document.getElementById("status-filter");
const fields = {
  editId: document.getElementById("edit-id"),
  name: document.getElementById("name"),
  studentId: document.getElementById("student-id"),
  email: document.getElementById("email"),
  department: document.getElementById("department"),
  attendance: document.getElementById("attendance"),
};

let students = [];
let page = 1;

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
  setTimeout(() => (message.hidden = true), 4000);
}

function persist(updated) {
  return saveStudents(instructorId, updated)
    .then((instructor) => {
      students = instructor.students;
      render();
    })
    .catch(() => showMessage("Could not save. Is json-server running?"));
}

function filteredStudents() {
  const text = searchInput.value.trim().toLowerCase();
  return students.filter((s) => {
    if (statusFilter.value === "active" && s.archived) return false;
    if (statusFilter.value === "archived" && !s.archived) return false;
    if (departmentFilter.value && s.department !== departmentFilter.value) return false;
    return `${s.name} ${s.email} ${s.studentId}`.toLowerCase().includes(text);
  });
}

function actionButton(type, label, id) {
  return `<button class="act ${type}" data-action="${type}" data-id="${id}" title="${label}" aria-label="${label}">${ICONS[type]}</button>`;
}

function renderPagination(pages) {
  let html = `<button class="page" data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Previous page">&lsaquo;</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page ${i === page ? "selected" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page" data-page="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="Next page">&rsaquo;</button>`;
  pagination.innerHTML = html;
}

function render() {
  const list = filteredStudents();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const rows = list.slice(start, start + PAGE_SIZE);

  empty.hidden = list.length > 0;
  body.innerHTML = rows
    .map(
      (s, i) => `
      <tr class="${s.archived ? "archived" : ""}">
        <td>${start + i + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.department)}</td>
        <td class="actions">
          ${actionButton("edit", "Edit", s.id)}
          ${s.archived ? actionButton("restore", "Restore", s.id) : actionButton("archive", "Archive", s.id)}
          ${actionButton("delete", "Delete permanently", s.id)}
        </td>
      </tr>`
    )
    .join("");

  renderPagination(pages);
  const from = list.length ? start + 1 : 0;
  showing.textContent = `Showing ${from}-${start + rows.length} of ${list.length}`;
}

function openForm(student) {
  form.reset();
  formError.textContent = "";
  document.getElementById("dialog-title").textContent = student ? "Edit Student" : "Add Student";
  fields.editId.value = student ? student.id : "";
  if (student) {
    fields.name.value = student.name;
    fields.studentId.value = student.studentId;
    fields.email.value = student.email;
    fields.department.value = student.department;
   const att = student.attendance;
fields.attendance.value =
    typeof att === "object" ? (att.status || "present") : att;
  }
  dialog.showModal();
}

function submitForm(e) {
  e.preventDefault();
  const name = fields.name.value.trim();
  const studentId = fields.studentId.value.trim();
  const email = fields.email.value.trim();
  const editId = fields.editId.value;

  if (!name || !studentId || !email) {
    formError.textContent = "Name, student ID and email are required.";
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    formError.textContent = "Enter a valid email address.";
    return;
  }
  const duplicate = students.some(
    (s) => s.studentId.toLowerCase() === studentId.toLowerCase() && s.id !== editId
  );
  if (duplicate) {
    formError.textContent = "This student ID already exists.";
    return;
  }

    const selectedStatus = fields.attendance.value; // "present" / "late" / "absent"

  // ---- بناء attendance كـ object موحّد ----
  const existingStudent = editId
    ? students.find((s) => s.id === editId)
    : null;

  let attendanceObject;

  if (existingStudent && typeof existingStudent.attendance === "object") {
    // طالب موجود - نحافظ على العدّادات ونحدّث الـ status فقط
    attendanceObject = {
      ...existingStudent.attendance,
      status: selectedStatus,
    };
  } else if (existingStudent && typeof existingStudent.attendance === "string") {
    // ترقية من string لـ object (للطلاب القدامى)
    attendanceObject = {
      status: selectedStatus,
      present: existingStudent.attendance === "present" ? 1 : 0,
      absent: existingStudent.attendance === "absent" ? 1 : 0,
      late: existingStudent.attendance === "late" ? 1 : 0,
      lastAttendanceDate: "",
    };
  } else {
    // طالب جديد
    attendanceObject = {
      status: selectedStatus,
      present: 0,
      absent: 0,
      late: 0,
      lastAttendanceDate: "",
    };
  }

  const data = {
    name,
    studentId,
    email,
    department: fields.department.value,
    attendance: attendanceObject,
  };

  if (editId) {
    persist(students.map((s) => (s.id === editId ? { ...s, ...data } : s)));
  } else {
    const student = {
      id: generateId("stu"),
      ...data,
      archived: false,
      exams: [],
      assignments: [],
      quizzes: [],
    };
    persist([...students, student]);
  }
  dialog.close();
}

function setArchived(id, archived) {
  persist(students.map((s) => (s.id === id ? { ...s, archived } : s)));
}

function deleteStudent(id) {
  if (!confirm("Delete this student permanently?")) return;
  persist(students.filter((s) => s.id !== id));
}

function resetPageAndRender() {
  page = 1;
  render();
}

document.getElementById("add-student").addEventListener("click", () => openForm(null));
document.getElementById("cancel").addEventListener("click", () => dialog.close());
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("app").classList.toggle("nav-toggled");
});
form.addEventListener("submit", submitForm);

document.getElementById("random-name").addEventListener("click", () => {
  fetchRandomName()
    .then((name) => (fields.name.value = name))
    .catch(() => (formError.textContent = "Could not get a name. Check your internet."));
});

searchInput.addEventListener("input", resetPageAndRender);
departmentFilter.addEventListener("change", resetPageAndRender);
statusFilter.addEventListener("change", resetPageAndRender);

pagination.addEventListener("click", (e) => {
  const target = e.target.dataset.page;
  if (!target) return;
  page = Number(target);
  render();
});

body.addEventListener("click", (e) => {
  const { action, id } = e.target.dataset;
  if (!action) return;
  if (action === "edit") openForm(students.find((s) => s.id === id));
  if (action === "archive") setArchived(id, true);
  if (action === "restore") setArchived(id, false);
  if (action === "delete") deleteStudent(id);
});

initChatbot(() => students);

if (!instructorId) {
  window.location.href = "login.html";
} else {
  loadStudentsWithRetry();
}

async function loadStudentsWithRetry(attempt = 1) {
  const MAX_ATTEMPTS = 5;

  try {
    const instructor = await getInstructor(instructorId);
    students = instructor.students || [];
    const nameEl = document.getElementById("instructor-name");
    if (nameEl) {
      nameEl.textContent =
        instructor.username || instructor.firstName || "Instructor";
    }
    render();
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      // أعد المحاولة بعد فترة قصيرة
      setTimeout(() => loadStudentsWithRetry(attempt + 1), 500);
    } else {
      showMessage("Could not load data. Is json-server running?");
    }
  }
}