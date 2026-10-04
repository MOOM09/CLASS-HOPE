/* ============================================================
   quizzes.js
   صفحة الاختبارات - موحّدة مع نظام EduTrack
   ============================================================ */

const db = "http://localhost:3000/instructors";
const instructorId = sessionStorage.getItem("instructorId");

/* ================= DOM ================= */
const toggleBtn         = document.getElementById("toggle-quiz-form-btn");
const cancelBtn         = document.getElementById("cancel-quiz-btn");
const formContainer     = document.getElementById("quiz-form-container");
const quizForm          = document.getElementById("quiz-form");
const questionsContainer = document.getElementById("questions-container");
const addQuestionBtn    = document.getElementById("add-question-btn");
const quizTbody         = document.getElementById("quiz-tbody");
const emptyState        = document.getElementById("empty");
const quizCount         = document.getElementById("quiz-count");
const quizTitleInput    = document.getElementById("quiz-title-input");
const editingQuizIdEl   = document.getElementById("editing-quiz-id");

let questionCounter = 0;

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

async function patchQuizzes(quizzes) {
    const res = await fetch(`${db}/${instructorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizzes })
    });
    if (!res.ok) throw new Error("Save failed");
    return res.json();
}

/* ================= TOGGLE FORM ================= */
toggleBtn.addEventListener("click", () => {
    formContainer.classList.remove("hidden");
    quizForm.reset();
    questionsContainer.innerHTML = "";
    editingQuizIdEl.value = "";
    questionCounter = 0;
    addQuestionBlock();
    formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
});

cancelBtn.addEventListener("click", () => {
    formContainer.classList.add("hidden");
});

/* ================= ADD QUESTION BLOCK ================= */
addQuestionBtn.addEventListener("click", addQuestionBlock);

function addQuestionBlock(prefill = null) {
    questionCounter++;
    const qIndex = questionCounter;

    const block = document.createElement("div");
    block.className = "question-block";

    const text = prefill?.text || "";
    const options = prefill?.options || ["", "", ""];
    const correctIdx = prefill?.correctOptionIndex ?? 0;

    block.innerHTML = `
        <label>Question ${qIndex}</label>
        <input type="text" class="q-text" placeholder="Enter question text..." value="${escapeAttr(text)}" required>

        <div class="options-container">
            <label>Options (Select the correct answer):</label>
            ${options.map((opt, i) => `
                <div class="option-row">
                    <input type="radio" name="correct_${qIndex}" value="${i}" ${i === correctIdx ? "checked" : ""}>
                    <input type="text" class="opt-text" placeholder="Option ${i + 1}" value="${escapeAttr(opt)}" required>
                </div>
            `).join("")}
        </div>
    `;

    questionsContainer.appendChild(block);
}

function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* ================= SAVE ================= */
quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = quizTitleInput.value.trim();
    const editingId = editingQuizIdEl.value;

    if (!title) {
        alert("Please enter a quiz title.");
        return;
    }

    const questionsArray = [];
    const blocks = document.querySelectorAll(".question-block");

    for (const block of blocks) {
        const qText = block.querySelector(".q-text").value.trim();
        const optionInputs = block.querySelectorAll(".opt-text");
        const options = Array.from(optionInputs).map(i => i.value.trim());
        const correctRadio = block.querySelector('input[type="radio"]:checked');
        const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;

        if (!qText || options.some(o => !o)) {
            alert("Please fill in all questions and options.");
            return;
        }

        questionsArray.push({
            id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            text: qText,
            options,
            correctOptionIndex: correctIndex
        });
    }

    const newQuiz = {
        id: editingId || "quiz_" + Date.now(),
        title,
        questions: questionsArray
    };

    try {
        const data = await getInstructor();
        const quizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

        if (editingId) {
            const idx = quizzes.findIndex(q => q.id === editingId);
            if (idx !== -1) quizzes[idx] = newQuiz;
        } else {
            quizzes.push(newQuiz);
        }

        await patchQuizzes(quizzes);

        formContainer.classList.add("hidden");
        renderTable();

    } catch (err) {
        console.error(err);
        alert("Could not save quiz.");
    }
});

/* ================= RENDER ================= */
async function renderTable() {
    try {
        const data = await getInstructor();
        const quizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

        quizTbody.innerHTML = "";

        quizzes.forEach((quiz, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${quiz.title}</td>
                <td>${quiz.questions ? quiz.questions.length : 0}</td>
                <td class="actions">
                    <button class="act-btn edit" data-action="edit" data-id="${quiz.id}"
                            title="Edit" aria-label="Edit">${ICONS.edit}</button>
                    <button class="act-btn delete" data-action="delete" data-id="${quiz.id}"
                            title="Delete" aria-label="Delete">${ICONS.delete}</button>
                </td>
            `;
            quizTbody.appendChild(tr);
        });

        emptyState.hidden = quizzes.length > 0;
        quizCount.innerText = `Showing ${quizzes.length} quiz(zes)`;

    } catch (err) {
        console.error(err);
        quizCount.innerText = "Could not load quizzes.";
    }
}

/* ================= EDIT ================= */
async function editQuiz(id) {
    try {
        const data = await getInstructor();
        const quiz = (data.quizzes || []).find(q => q.id === id);
        if (!quiz) return;

        formContainer.classList.remove("hidden");
        quizTitleInput.value = quiz.title;
        editingQuizIdEl.value = quiz.id;

        questionsContainer.innerHTML = "";
        questionCounter = 0;

        (quiz.questions || []).forEach(q => addQuestionBlock(q));

        formContainer.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
        console.error(err);
    }
}

/* ================= DELETE ================= */
async function deleteQuiz(id) {
    if (!confirm("Delete this quiz?")) return;

    try {
        const data = await getInstructor();
        const quizzes = (data.quizzes || []).filter(q => q.id !== id);
        await patchQuizzes(quizzes);
        renderTable();

    } catch (err) {
        console.error(err);
        alert("Could not delete.");
    }
}

/* ================= EVENTS ================= */
quizTbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".act-btn");
    if (!btn) return;

    const { action, id } = btn.dataset;
    if (action === "edit")   editQuiz(id);
    if (action === "delete") deleteQuiz(id);
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