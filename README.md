# EduTrack 🎓

A simple and organized platform for instructors to manage their classrooms, students, and academic activities — all in one place.

---

## 📖 About

EduTrack is a web-based instructor portal that helps teachers manage students, exams, quizzes, assignments, and attendance — with a built-in smart assistant and dark mode.

---

## ✨ Features

- 🔐 Instructor Login / Sign Up
- 📊 Dashboard with live stats + Doughnut chart
- 👥 Full Students CRUD (add / edit / delete / archive)
- 📝 Exams management
- ❓ Quizzes with multiple questions
- 📄 Assignments with scores
- 📊 Attendance tracking with class average
- 💬 Smart assistant (chatbot)
- 🌙 Dark mode (saved in localStorage)
- 📱 Fully responsive (desktop / tablet / mobile)

---

## 🛠️ Tech Stack

- HTML5, CSS3, Vanilla JavaScript (ES Modules)
- json-server (REST API on localhost:3000)
- Chart.js for dashboard visualization

---

## 📂 Project Structure

```
edu project/
├── css/
│   ├── global.css
│   ├── navbar.css
│   ├── home.css
│   ├── about.css
│   ├── contact.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── student.css
│   ├── atend.css
│   ├── assigment.css
│   └── grades.css
│
├── js/
│   ├── main.js
│   ├── atend.js
│   ├── exams.js
│   ├── quizzes.js
│   ├── assigment.js
│   ├── chatbot.js
│   ├── dashboard-stats.js
│   ├── DASHBORD.js
│   ├── profile-menu.js
│   ├── dark.js
│   ├── script.js
│   ├── api.js
│   ├── helpers.js
│   └── session.js
│
├── photo/
│   ├── logo.jpg
│   ├── darkLogo.jpg
│   ├── profile.jpg
│   └── ...
│
├── HOME.html
├── ABOUT.html
├── CONTACT.html
├── Login.html
├── signup.html
├── dashboard.html
├── Student.html
├── atend.html
├── exams.html
├── quizzes.html
├── assigment.html
└── db.json
```

---

## 🚀 Getting Started

- **Live Demo:** [https://hadeelabdal-majeed.github.io/EduTrack/]

### 1) Clone

```bash
git clone https://github.com/YOUR-USERNAME/edutrack.git
cd edutrack
```

### 2) Start the backend

```bash
npx json-server db.json
```

Runs on: `http://localhost:3000/instructors`
⚠️ Keep this terminal open.

### 3) Serve the frontend

⚠️ ES Modules don't work over `file://` — you must use an HTTP server.

**Option A — VS Code Live Server**
Right-click `Login.html` → Open with Live Server

**Option B — npx serve**
```bash
npx serve . -l 5500
```
Open: `http://localhost:5500/Login.html`

---

## 👤 Demo Accounts

| Email | Password |
|---|---|
| `sondos@gmail.com` | `password_123` |
| `admin@email.com` | `password_456` |

Or create a new account from `signup.html`.

---

## 🎨 Color Palette

| Variable | Value | Usage |
|---|---|---|
| `--primary-color` | `#6a1b29` | Burgundy — buttons, headings |
| `--bg-color` | `#fcf7f2` | Cream — page background |
| `--card-bg` | `#ffffff` | Cards & forms |
| `--text-main` | `#333333` | Main text |
| `--text-muted` | `#666666` | Secondary text |
| `--border-color` | `#e0d8d0` | Borders |

---

## 🗄️ Data Model

```json
{
  "id": "inst_01",
  "username": "sondos",
  "firstName": "Sondos",
  "lastName": "…",
  "email": "sondos@gmail.com",
  "password": "password_123",
  "students": [
    {
      "id": "stu_001",
      "name": "Ahmad Khalid",
      "studentId": "S-1001",
      "email": "ahmad@uni.com",
      "department": "CS",
      "attendance": {
        "status": "present",
        "present": 0,
        "absent": 0,
        "late": 0,
        "lastAttendanceDate": ""
      },
      "archived": false,
      "exams": [],
      "assignments": [],
      "quizzes": []
    }
  ],
  "quizzes": []
}
```

> ℹ️ Quizzes are stored at the instructor level, while exams and assignments are stored per student.

---

## 🐛 Known Notes

- The app requires `json-server` to be running — otherwise pages will show "Could not load data".
- ES Modules do not work over `file://` — always use a local HTTP server.
- On very fast refreshes, a temporary "failed to load" may appear due to a race condition between Live Server and json-server.

---

## 📌 Roadmap

- [x] Instructor authentication
- [x] Students CRUD
- [x] Exams / Quizzes / Assignments
- [x] Attendance tracking
- [x] Dashboard with Chart.js
- [x] Dark mode
- [x] Chatbot assistant
- [ ] Student selection dropdown for Exams / Assignments
- [ ] Export reports to PDF
- [ ] Multi-language support (AR / EN)

---

## 👨‍💻 Authors

- Mohammad AL-Tarifi— [GitHub](https://github.com/MOOM09)
- HadeelAbdAl-majeed— (Scrum-Mster)[GitHub](https://github.com/HadeelAbdAl-majeed)
- Mohammad yaseen— (Product-Owner)[GitHub](mohyaseen-2001 https://share.google/f8kRmMsd5f8WlXH5s)
- SondosNazzal— [GitHub](https://github.com/SondosNazzal04)
- Adel Hasan— [GitHub](https://github.com/Adel-H-Hasan)


---

## 📄 License

This project is licensed under the MIT License — free to use for learning and personal projects.

---

## 🙏 Acknowledgments

Special thanks to the team for their contributions.
- [Chart.js](https://www.chartjs.org/)
- [json-server](https://github.com/typicode/json-server)

---

⭐ If you like this project, don't forget to give it a star on GitHub!