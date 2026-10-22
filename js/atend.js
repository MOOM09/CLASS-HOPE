const DATABASE_API_URL = "http://localhost:3000/instructors";
const CURRENT_INSTRUCTOR_ID = sessionStorage.getItem("instructorId");
let loadedStudentsArray = [];
let searchTerm = "";

/* ============================================================
   Normalize attendance
   ============================================================ */
function normalizeAttendance(att) {
    if (att && typeof att === "object") {
        return {
            status: att.status || "present",
            present: Number(att.present) || 0,
            absent:  Number(att.absent)  || 0,
            late:    Number(att.late)    || 0,
            lastAttendanceDate: att.lastAttendanceDate || ""
        };
    }
    return {
        status: att || "present",
        present: att === "present" ? 1 : 0,
        absent:  att === "absent"  ? 1 : 0,
        late:    att === "late"    ? 1 : 0,
        lastAttendanceDate: ""
    };
}

async function fetchInstructorStudents(id) {
    try {
        const res = await fetch(`${DATABASE_API_URL}/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const students = data.students || [];
        return students.map(s => ({
            ...s,
            attendance: normalizeAttendance(s.attendance)
        }));
    } catch {
        return [];
    }
}

async function persistStudents() {
    try {
        const res = await fetch(`${DATABASE_API_URL}/${CURRENT_INSTRUCTOR_ID}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: loadedStudentsArray })
        });
        if (!res.ok) throw new Error();
    } catch {
        alert("Could not save. Is json-server running?");
    }
}

function calculateClassAverage() {
    const el = document.getElementById("class-average-display");
    if (!el) return;

    if (loadedStudentsArray.length === 0) {
        el.innerText = "0.0%";
        return;
    }

    let totalPresents = 0;
    let totalSegment = 0;

    loadedStudentsArray.forEach(s => {
        const { present, absent, late } = s.attendance;
        totalPresents += present + (late * 0.5);
        totalSegment  += present + absent + late;
    });

    if (totalSegment === 0) {
        el.innerText = "0.0%";
        return;
    }

    el.innerText = `${((totalPresents / totalSegment) * 100).toFixed(1)}%`;
}

/* ============================================================
   Helper: فلترة الطلاب حسب البحث
   ============================================================ */
function getVisibleStudents() {
    return loadedStudentsArray.filter(s =>
        !searchTerm || s.name.toLowerCase().includes(searchTerm)
    );
}

function renderStudentsTable() {
    const tbody = document.getElementById("student-table-body");
    const empty = document.getElementById("empty");
    const showing = document.getElementById("showing");

    tbody.innerHTML = "";

    const list = getVisibleStudents();

    if (list.length === 0) {
        empty.hidden = false;
        if (showing) showing.textContent = "";
        return;
    }
    empty.hidden = true;
    if (showing) showing.textContent = `Showing ${list.length} student(s)`;

    list.forEach((student, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>
                <div class="student-name-cell">
                    <span class="student-avatar">👤</span>
                    <span class="student-name">${student.name}</span>
                </div>
            </td>
            <td>
                <div class="attendance-radio-group">
                    <label class="present">
                        <input type="radio" name="att_${student.id}" value="present"> Present
                    </label>
                    <label class="late">
                        <input type="radio" name="att_${student.id}" value="late"> Late
                    </label>
                    <label class="absent">
                        <input type="radio" name="att_${student.id}" value="absent"> Absent
                    </label>
                </div>
            </td>
            <td class="count-cell present" id="p_${student.id}">${student.attendance.present}</td>
            <td class="count-cell absent"  id="a_${student.id}">${student.attendance.absent}</td>
            <td class="count-cell late"    id="l_${student.id}">${student.attendance.late}</td>
        `;
        tbody.appendChild(row);
    });
}

async function handleSaveAttendance() {
    // ✨ الإصلاح: نفحص فقط الطلاب الظاهرين (بعد الفلترة)
    const visibleStudents = getVisibleStudents();

    if (visibleStudents.length === 0) {
        alert("No students to save attendance for.");
        return;
    }

    for (const student of visibleStudents) {
        const selected = document.querySelector(`input[name="att_${student.id}"]:checked`);
        if (!selected) {
            alert("Please mark attendance for all visible students before saving.");
            return;
        }
    }

    const today = new Date().toISOString().split("T")[0];
    let updated = false;

    // ✨ الإصلاح: نعدل فقط الطلاب الظاهرين
    for (const student of visibleStudents) {
        if (student.attendance.lastAttendanceDate === today) continue;

        const selected = document.querySelector(`input[name="att_${student.id}"]:checked`);
        const status = selected.value;

        student.attendance[status] += 1;
        student.attendance.status = status;
        student.attendance.lastAttendanceDate = today;

        const pEl = document.getElementById(`p_${student.id}`);
        const aEl = document.getElementById(`a_${student.id}`);
        const lEl = document.getElementById(`l_${student.id}`);
        if (pEl) pEl.innerText = student.attendance.present;
        if (aEl) aEl.innerText = student.attendance.absent;
        if (lEl) lEl.innerText = student.attendance.late;

        updated = true;
    }

    if (!updated) {
        alert("Attendance for today has already been saved!");
        return;
    }

    await persistStudents();
    calculateClassAverage();
    alert("Attendance saved successfully!");
}

function markAllPresent() {
    // ✨ الإصلاح: نحدد بس الظاهرين
    getVisibleStudents().forEach(s => {
        const radio = document.querySelector(`input[name="att_${s.id}"][value="present"]`);
        if (radio) radio.checked = true;
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
    if (!CURRENT_INSTRUCTOR_ID) {
        window.location.href = "login.html";
        return;
    }

    const menuBtn = document.getElementById("menu-toggle");
    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            document.getElementById("app").classList.toggle("nav-toggled");
        });
    }

    loadedStudentsArray = await fetchInstructorStudents(CURRENT_INSTRUCTOR_ID);
    renderStudentsTable();
    calculateClassAverage();

    document.getElementById("save-attendance-btn")
        .addEventListener("click", handleSaveAttendance);

    document.getElementById("mark-all-present")
        .addEventListener("click", markAllPresent);

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchTerm = e.target.value.trim().toLowerCase();
            renderStudentsTable();
        });
    }
});