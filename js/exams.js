/* ============================================================
   exams.js
   صفحة الامتحانات - موحّدة مع نظام EduTrack
   ============================================================ */

const db = "http://localhost:3000/instructors";
const instructorId = sessionStorage.getItem("instructorId");

/* ================= DOM ================= */
const form        = document.getElementById("exam-form");
const examTbody   = document.getElementById("exam-tbody");
const emptyState  = document.getElementById("empty");
const examCount   = document.getElementById("exam-count");

/* ================= ICONS ================= */
const ICONS = {
    edit: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    delete: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'
};

/* ================= API ================= */
async function getInstructor() {
    const res = await fetch(`${db}/${instructorId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Instructor not found");
    return res.json();
}

async function patchStudents(students) {
    const res = await fetch(`${db}/${instructorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students })
    });
    if (!res.ok) throw new Error("Save failed");
    return res.json();
}

/* ================= RENDER ================= */
async function renderTable() {
    try {
        const data = await getInstructor();
        const students = data.students || [];
        examTbody.innerHTML = "";
        let counter = 1;
        let total = 0;

        students.forEach(student => {
            const exams = Array.isArray(student.exams) ? student.exams : [];
            exams.forEach(exam => {
                total++;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${counter++}</td>
                    <td>${exam.name}</td>
                    <td>${exam.score}</td>
                    <td>${student.name || student.id}</td>
                    <td class="actions">
                        <button class="act-btn edit" data-action="edit"
                                data-student="${student.id}" data-exam="${exam.id}"
                                title="Edit" aria-label="Edit">${ICONS.edit}</button>
                        <button class="act-btn delete" data-action="delete"
                                data-student="${student.id}" data-exam="${exam.id}"
                                title="Delete" aria-label="Delete">${ICONS.delete}</button>
                    </td>
                `;
                examTbody.appendChild(tr);
            });
        });

        emptyState.hidden = total > 0;
        examCount.innerText = `Showing ${total} exam(s)`;

    } catch (err) {
        console.error(err);
        examCount.innerText = "Could not load exams.";
    }
}

/* ================= ADD ================= */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput   = document.getElementById("exam-name-input");
    const scoreInput  = document.getElementById("exam-score-input");
    const studentInput = document.getElementById("student-id-input");

    const examName  = nameInput.value.trim();
    const examScore = Number(scoreInput.value);
    const studentId = studentInput.value.trim();

    if (!examName || !studentId || isNaN(examScore)) {
        alert("Please fill all fields correctly.");
        return;
    }

    try {
        const data = await getInstructor();
        const idx = data.students.findIndex(s => s.id === studentId);

        if (idx === -1) {
            alert("Student not found. Check the Student ID.");
            return;
        }

        data.students[idx].exams = data.students[idx].exams || [];
        data.students[idx].exams.push({
            id: "ex_" + Date.now(),
            name: examName,
            score: examScore
        });

        await patchStudents(data.students);

        // reset form
        form.reset();
        renderTable();

    } catch (err) {
        console.error(err);
        alert("Could not save. Is json-server running?");
    }
});

/* ================= EDIT ================= */
async function editExam(studentId, examId) {
    const newName  = prompt("Enter new exam name:");
    if (newName === null) return;
    const newScore = prompt("Enter new exam score:");
    if (newScore === null) return;

    const score = Number(newScore);
    if (!newName.trim() || isNaN(score)) {
        alert("Invalid input.");
        return;
    }

    try {
        const data = await getInstructor();
        const sIdx = data.students.findIndex(s => s.id === studentId);
        if (sIdx === -1) return;

        const eIdx = data.students[sIdx].exams.findIndex(e => e.id === examId);
        if (eIdx === -1) return;

        data.students[sIdx].exams[eIdx].name = newName.trim();
        data.students[sIdx].exams[eIdx].score = score;

        await patchStudents(data.students);
        renderTable();

    } catch (err) {
        console.error(err);
        alert("Could not update.");
    }
}

/* ================= DELETE ================= */
async function deleteExam(studentId, examId) {
    if (!confirm("Delete this exam?")) return;

    try {
        const data = await getInstructor();
        const sIdx = data.students.findIndex(s => s.id === studentId);
        if (sIdx === -1) return;

        data.students[sIdx].exams = data.students[sIdx].exams.filter(e => e.id !== examId);

        await patchStudents(data.students);
        renderTable();

    } catch (err) {
        console.error(err);
        alert("Could not delete.");
    }
}

/* ================= EVENTS ================= */
examTbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".act-btn");
    if (!btn) return;

    const { action, student, exam } = btn.dataset;
    if (action === "edit")   editExam(student, exam);
    if (action === "delete") deleteExam(student, exam);
});

/* ================= SIDEBAR TOGGLE ================= */
const menuBtn = document.getElementById("menu-toggle");
if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        document.getElementById("app").classList.toggle("nav-toggled");
    });
}

/* ================= INIT ================= */
if (!instructorId) {
    window.location.href = "login.html";
} else {
    renderTable();
}