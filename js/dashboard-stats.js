/* ============================================================
   dashboard-stats.js
   إحصائيات الداشبورد + Welcome message + Department Chart
   ============================================================ */

const STATS_API = "http://localhost:3000/instructors";
const STATS_INSTRUCTOR_ID = sessionStorage.getItem("instructorId");

let departmentChart = null;

/* ================= Helpers ================= */
function avgOfScores(items) {
    const scores = items
        .map(item => Number(item.score))
        .filter(n => !isNaN(n));
    if (!scores.length) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
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

/* ================= Welcome ================= */
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

/* ================= Stats Cards ================= */
function renderStats(students, instructorQuizzes = []) {
    // Students
    const active = students.filter(s => !s.archived).length;
    const archived = students.filter(s => s.archived).length;

    document.getElementById("stat-students").textContent = students.length;
    document.getElementById("stat-students-meta").textContent =
        `${active} active · ${archived} archived`;

    // Exams (from students)
    const exams = allItems(students, "exams");
    document.getElementById("stat-exams").textContent = exams.length;
    document.getElementById("stat-exams-meta").textContent =
        `Average: ${avgOfScores(exams)}`;

    // Quizzes (from instructor-level)
    document.getElementById("stat-quizzes").textContent = instructorQuizzes.length;

    const totalQuestions = instructorQuizzes.reduce(
        (sum, q) => sum + (q.questions ? q.questions.length : 0),
        0
    );
    const avgQuestions = instructorQuizzes.length
        ? (totalQuestions / instructorQuizzes.length).toFixed(1)
        : 0;

    document.getElementById("stat-quizzes-meta").textContent =
        `Total questions: ${totalQuestions} · Avg: ${avgQuestions}`;

    // Assignments (from students)
    const assignments = allItems(students, "assignments");
    document.getElementById("stat-assignments").textContent = assignments.length;
    document.getElementById("stat-assignments-meta").textContent =
        `Average: ${avgOfScores(assignments)}`;
}

/* ================= Chart ================= */
const CHART_COLORS = [
    "#6a1b29",
    "#a8324a",
    "#c08a5f",
    "#a86a12",
    "#4a7c59",
    "#5c6b8a"
];

function getTextColor() {
    return document.body.classList.contains("dark-mode")
        ? "#f5f5f5"
        : "#333333";
}

function renderChart(students) {
    const canvas = document.getElementById("departmentChart");
    const emptyState = document.getElementById("chart-empty");
    if (!canvas) return;

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

    const textColor = getTextColor();

    if (departmentChart) {
        departmentChart.destroy();
    }

    departmentChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels,
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
                        color: textColor,
                        font: {
                            size: 13,
                            family: "'Segoe UI', Tahoma, sans-serif"
                        },
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

/* ================= Main ================= */
async function loadDashboard() {
    if (!STATS_INSTRUCTOR_ID) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(`${STATS_API}/${STATS_INSTRUCTOR_ID}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setWelcomeName(data);

        const students = data.students || [];
        const instructorQuizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

        renderStats(students, instructorQuizzes);
        renderChart(students);

    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

/* ================= Dark Mode Listener ================= */
const darkObserver = new MutationObserver(() => {
    if (departmentChart) {
        departmentChart.destroy();
        departmentChart = null;

        fetch(`${STATS_API}/${STATS_INSTRUCTOR_ID}`)
            .then(r => r.json())
            .then(d => renderChart(d.students || []))
            .catch(() => {});
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();

    darkObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"]
    });
});