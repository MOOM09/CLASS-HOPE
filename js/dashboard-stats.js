/* ============================================================
   dashboard-stats.js
   Stats + Welcome + Date + 6 Charts
   ============================================================ */

const STATS_API = "http://localhost:3000/instructors";
const STATS_INSTRUCTOR_ID = sessionStorage.getItem("instructorId");

const charts = {
    department: null,
    grades: null,
    attendance: null,
    distribution: null,
    performance: null
};

/* ================= Helpers ================= */
function avgOfScores(items) {
    const scores = items.map(i => Number(i.score)).filter(n => !isNaN(n));
    if (!scores.length) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function allItems(students, key) {
    const result = [];
    students.forEach(s => {
        if (Array.isArray(s[key])) result.push(...s[key]);
    });
    return result;
}

function countByDepartment(students) {
    const counts = {};
    students.forEach(s => {
        if (s.archived) return;
        const dep = s.department || "Other";
        counts[dep] = (counts[dep] || 0) + 1;
    });
    return counts;
}

function getAttendanceFields(att) {
    if (att && typeof att === "object") {
        return {
            present: Number(att.present) || 0,
            absent:  Number(att.absent)  || 0,
            late:    Number(att.late)    || 0
        };
    }
    return {
        present: att === "present" ? 1 : 0,
        absent:  att === "absent"  ? 1 : 0,
        late:    att === "late"    ? 1 : 0
    };
}

function getStudentAvg(student) {
    const exams = Array.isArray(student.exams) ? student.exams : [];
    const assignments = Array.isArray(student.assignments) ? student.assignments : [];
    const all = [...exams, ...assignments]
        .map(x => Number(x.score))
        .filter(n => !isNaN(n));
    if (!all.length) return 0;
    return all.reduce((a, b) => a + b, 0) / all.length;
}

function getTextColor() {
    return document.body.classList.contains("dark-mode") ? "#f5f5f5" : "#333333";
}

function getGridColor() {
    return document.body.classList.contains("dark-mode") ? "#444444" : "#e0d8d0";
}

/* ================= Welcome + Date ================= */
function setWelcomeName(instructor) {
    const el = document.getElementById("welcome-name");
    if (!el) return;

    const name =
        instructor.username ||
        instructor.firstName ||
        instructor.first_name ||
        (instructor.email ? instructor.email.split("@")[0] : "Instructor");

    el.textContent = name;
}

function setTodayDate() {
    const el = document.getElementById("today-date");
    if (!el) return;

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    el.textContent = "📅 " + now.toLocaleDateString("en-US", options);
}

/* ================= Stats Cards ================= */
function renderStats(students, instructorQuizzes = []) {
    const active = students.filter(s => !s.archived).length;
    const archived = students.filter(s => s.archived).length;

    document.getElementById("stat-students").textContent = students.length;
    document.getElementById("stat-students-meta").textContent =
        `${active} active · ${archived} archived`;

    const exams = allItems(students, "exams");
    document.getElementById("stat-exams").textContent = exams.length;
    document.getElementById("stat-exams-meta").textContent =
        `Average: ${avgOfScores(exams).toFixed(1)}`;

    document.getElementById("stat-quizzes").textContent = instructorQuizzes.length;
    const totalQ = instructorQuizzes.reduce(
        (sum, q) => sum + (q.questions ? q.questions.length : 0), 0
    );
    const avgQ = instructorQuizzes.length
        ? (totalQ / instructorQuizzes.length).toFixed(1) : 0;

    document.getElementById("stat-quizzes-meta").textContent =
        `Total questions: ${totalQ} · Avg: ${avgQ}`;

    const assignments = allItems(students, "assignments");
    document.getElementById("stat-assignments").textContent = assignments.length;
    document.getElementById("stat-assignments-meta").textContent =
        `Average: ${avgOfScores(assignments).toFixed(1)}`;
}

/* ================= Chart 1: Department ================= */
const CHART_COLORS = ["#6a1b29", "#a8324a", "#c08a5f", "#a86a12", "#4a7c59", "#5c6b8a"];

function renderDepartmentChart(students) {
    const canvas = document.getElementById("departmentChart");
    const emptyState = document.getElementById("chart-empty");
    if (!canvas || typeof Chart === "undefined") return;

    const counts = countByDepartment(students);
    const labels = Object.keys(counts);
    const values = Object.values(counts);

    if (!labels.length) {
        canvas.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    if (charts.department) charts.department.destroy();
    charts.department = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: CHART_COLORS.slice(0, labels.length),
                borderColor: "#ffffff",
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: getTextColor(),
                        font: { size: 13, family: "'Segoe UI', Tahoma, sans-serif" },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },
                tooltip: {
                    backgroundColor: "#6a1b29",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.parsed / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

/* ================= Chart 2: Student Grades (Bar) ================= */
function renderGradesChart(students) {
    const canvas = document.getElementById("gradesChart");
    const emptyState = document.getElementById("grades-empty");
    if (!canvas || typeof Chart === "undefined") return;

    const active = students.filter(s => !s.archived);
    const withScores = active.map(s => ({
        name: s.name,
        avg: getStudentAvg(s)
    }));

    if (!withScores.length) {
        canvas.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    if (charts.grades) charts.grades.destroy();
    charts.grades = new Chart(canvas, {
        type: "bar",
        data: {
            labels: withScores.map(s => s.name),
            datasets: [{
                label: "Average Score",
                data: withScores.map(s => s.avg.toFixed(1)),
                backgroundColor: "#6a1b29",
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#6a1b29",
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` Average: ${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: getTextColor(), font: { size: 11 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: getTextColor(), font: { size: 11 } },
                    grid: { color: getGridColor() }
                }
            }
        }
    });
}

/* ================= Chart 3: Student Attendance (Stacked Bar) ================= */
function renderAttendanceChart(students) {
    const canvas = document.getElementById("attendanceChart");
    const emptyState = document.getElementById("attendance-empty");
    if (!canvas || typeof Chart === "undefined") return;

    const active = students.filter(s => !s.archived);
    const data = active.map(s => {
        const att = getAttendanceFields(s.attendance);
        return {
            name: s.name,
            present: att.present,
            absent: att.absent,
            late: att.late
        };
    });

    const hasData = data.some(d => d.present || d.absent || d.late);

    if (!data.length || !hasData) {
        canvas.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    if (charts.attendance) charts.attendance.destroy();
    charts.attendance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(d => d.name),
            datasets: [
                {
                    label: "Present",
                    data: data.map(d => d.present),
                    backgroundColor: "#1c7c3a",
                    borderRadius: 4,
                    maxBarThickness: 40
                },
                {
                    label: "Late",
                    data: data.map(d => d.late),
                    backgroundColor: "#a86a12",
                    borderRadius: 4,
                    maxBarThickness: 40
                },
                {
                    label: "Absent",
                    data: data.map(d => d.absent),
                    backgroundColor: "#c0392b",
                    borderRadius: 4,
                    maxBarThickness: 40
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        color: getTextColor(),
                        font: { size: 12 },
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 16
                    }
                },
                tooltip: { backgroundColor: "#6a1b29", padding: 12, cornerRadius: 8 }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: getTextColor(), font: { size: 11 } },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { color: getTextColor(), font: { size: 11 }, stepSize: 1 },
                    grid: { color: getGridColor() }
                }
            }
        }
    });
}

/* ================= Chart 4: Score Distribution (Doughnut) ================= */
function renderDistributionChart(students) {
    const canvas = document.getElementById("distributionChart");
    const emptyState = document.getElementById("distribution-empty");
    if (!canvas || typeof Chart === "undefined") return;

    const active = students.filter(s => !s.archived);
    let A = 0, B = 0, C = 0, D = 0, F = 0;

    active.forEach(s => {
        const avg = getStudentAvg(s);
        if (avg >= 90) A++;
        else if (avg >= 80) B++;
        else if (avg >= 70) C++;
        else if (avg >= 60) D++;
        else F++;
    });

    const total = A + B + C + D + F;
    if (!total) {
        canvas.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    if (charts.distribution) charts.distribution.destroy();
    charts.distribution = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["A (90+)", "B (80-89)", "C (70-79)", "D (60-69)", "F (<60)"],
            datasets: [{
                data: [A, B, C, D, F],
                backgroundColor: ["#1c7c3a", "#4a7c59", "#a86a12", "#c08a5f", "#c0392b"],
                borderColor: "#ffffff",
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: getTextColor(),
                        font: { size: 12 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: "circle"
                    }
                },
                tooltip: {
                    backgroundColor: "#6a1b29",
                    padding: 12,
                    cornerRadius: 8
                }
            }
        }
    });
}

/* ================= Chart 5: Class Performance (Radar) ================= */
function renderPerformanceChart(students, instructorQuizzes) {
    const canvas = document.getElementById("performanceChart");
    const emptyState = document.getElementById("performance-empty");
    if (!canvas || typeof Chart === "undefined") return;

    const active = students.filter(s => !s.archived);

    // 4 categories
    const examsAvg = avgOfScores(allItems(active, "exams"));
    const assignmentsAvg = avgOfScores(allItems(active, "assignments"));

    // Quizzes average (out of questions count, normalize)
    const quizzesAvg = instructorQuizzes.length
        ? instructorQuizzes.reduce((sum, q) => sum + (q.questions ? q.questions.length : 0), 0) /
          instructorQuizzes.length * 10
        : 0;

    // Attendance rate
    let totalPresent = 0, totalAbsent = 0, totalLate = 0;
    active.forEach(s => {
        const att = getAttendanceFields(s.attendance);
        totalPresent += att.present;
        totalAbsent  += att.absent;
        totalLate    += att.late;
    });
    const total = totalPresent + totalAbsent + totalLate;
    const attendanceRate = total
        ? ((totalPresent + totalLate * 0.5) / total) * 100
        : 0;

    const values = [
        Math.min(examsAvg, 100),
        Math.min(quizzesAvg, 100),
        Math.min(assignmentsAvg, 100),
        Math.min(attendanceRate, 100)
    ];

    if (!values.some(v => v > 0)) {
        canvas.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    canvas.hidden = false;
    if (emptyState) emptyState.hidden = true;

    if (charts.performance) charts.performance.destroy();
    charts.performance = new Chart(canvas, {
        type: "radar",
        data: {
            labels: ["Exams", "Quizzes", "Assignments", "Attendance"],
            datasets: [{
                label: "Class Average",
                data: values.map(v => v.toFixed(1)),
                backgroundColor: "rgba(106, 27, 41, 0.2)",
                borderColor: "#6a1b29",
                borderWidth: 2,
                pointBackgroundColor: "#6a1b29",
                pointBorderColor: "#fff",
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#6a1b29",
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.parsed.r}`
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: getTextColor(),
                        font: { size: 10 },
                        stepSize: 20,
                        backdropColor: "transparent"
                    },
                    grid: { color: getGridColor() },
                    angleLines: { color: getGridColor() },
                    pointLabels: {
                        color: getTextColor(),
                        font: { size: 12, weight: "bold" }
                    }
                }
            }
        }
    });
}

/* ================= Attendance Overview Card ================= */
function renderAttendanceCard(students) {
    let totalPresent = 0, totalAbsent = 0, totalLate = 0;
    students.forEach(s => {
        if (s.archived) return;
        const { present, absent, late } = getAttendanceFields(s.attendance);
        totalPresent += present;
        totalAbsent  += absent;
        totalLate    += late;
    });

    const total = totalPresent + totalAbsent + totalLate;
    const rate = total ? ((totalPresent + totalLate * 0.5) / total * 100) : 0;

    const rateEl = document.getElementById("attendance-rate");
    const barEl = document.getElementById("attendance-bar");
    const pEl = document.getElementById("att-present");
    const aEl = document.getElementById("att-absent");
    const lEl = document.getElementById("att-late");

    if (rateEl) rateEl.textContent = rate.toFixed(1) + "%";
    if (barEl) barEl.style.width = rate.toFixed(1) + "%";
    if (pEl) pEl.textContent = totalPresent;
    if (aEl) aEl.textContent = totalAbsent;
    if (lEl) lEl.textContent = totalLate;
}

/* ================= Top Students ================= */
function renderTopStudents(students) {
    const list = document.getElementById("top-students-list");
    if (!list) return;

    const ranked = students
        .filter(s => !s.archived)
        .map(s => ({
            name: s.name,
            avg: getStudentAvg(s),
            count: (s.exams?.length || 0) + (s.assignments?.length || 0)
        }))
        .filter(s => s.count > 0)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

    if (!ranked.length) {
        list.innerHTML = `<li class="empty-item">No scores yet</li>`;
        return;
    }

    list.innerHTML = ranked.map((s, i) => `
        <li class="top-item">
            <span class="top-rank">${i + 1}</span>
            <span class="top-name">${s.name}</span>
            <span class="top-score">${s.avg.toFixed(1)}</span>
        </li>
    `).join("");
}

/* ================= Main ================= */
async function loadDashboard() {
    if (!STATS_INSTRUCTOR_ID) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(`${STATS_API}/${STATS_INSTRUCTOR_ID}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setWelcomeName(data);
        setTodayDate();

        const students = data.students || [];
        const instructorQuizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

        renderStats(students, instructorQuizzes);
        renderDepartmentChart(students);
        renderGradesChart(students);
        renderAttendanceChart(students);
        renderDistributionChart(students);
        renderPerformanceChart(students, instructorQuizzes);
        renderAttendanceCard(students);
        renderTopStudents(students);

    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

/* ================= Dark Mode Listener ================= */
const darkObserver = new MutationObserver(() => {
    // إعادة رسم كل الـ charts بألوان الوضع الليلي
    loadDashboard();
});

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    darkObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
    });
});