# 🎯 Interview Tracker & Career Accelerator

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/Tests-30%20Passing-success?style=for-the-badge&logo=jest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

An all-in-one, full-stack career platform designed to help candidates prepare for technical interviews, track application pipelines with automated countdowns, analyze job descriptions, and craft ATS-optimized resumes.

Featuring an **Experience-Based Interview Preparation Checklist System** that dynamically adapts preparation roadmaps, question banks, and resume strategies to the candidate's seniority level (*Fresher*, *Junior*, *Mid-Level*, *Senior*, *Lead / Principal*).

Built with **React 19**, **Vite**, **Express**, **Nginx**, and **Node.js**.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [📸 Screenshots & Walkthrough](#-screenshots--walkthrough)
- [🔄 Cross-Module Workflows](#-cross-module-workflows)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Getting Started](#-getting-started)
  - [Option A: Docker Compose (Recommended)](#option-a-run-with-docker-compose-recommended)
  - [Option B: Local Node.js Development](#option-b-run-locally-with-nodejs)
- [🔌 API Endpoints Reference](#-api-endpoints-reference)
- [🧪 Testing & Code Quality](#-testing-code-quality)
- [⌨️ Keyboard Shortcuts & Accessibility](#️-keyboard-shortcuts--accessibility)
- [📁 Project Directory Structure](#-project-directory-structure)
- [📄 License](#-license)

---

## ✨ Key Features

- 📋 **Experience-Level Interview Prep Checklists (`/checklist`)**:
  - Calibrated across **5 Seniority Tiers**:
    - **Fresher (0–1 yrs)**: CS fundamentals, LeetCode Easy, project architecture defense, 60s elevator pitch, interview day setup.
    - **Junior (1–3 yrs)**: Production code quality, classic DSA patterns, API design, debugging incident stories, quantified resume metrics.
    - **Mid-Level (3–6 yrs)**: System design building blocks, trade-off analysis (SQL vs NoSQL, CAP), feature ownership, junior mentorship.
    - **Senior (6–10 yrs)**: Distributed systems, resilience, technical vision, organizational impact, leadership behavioral scenarios.
    - **Lead / Principal (10+ yrs)**: Enterprise platform architecture, tech roadmaps, build vs buy ROI, talent culture, C-level executive influence.
  - **Live Interview Countdown & Daily Pacing**: Set target interview dates to unlock dynamic urgency banners (`🔴 TODAY`, `🟡 TOMORROW`, `🟢 In X Days`) with daily recommended completion pacing (`~3 items/day`).
  - **Priority Readiness Breakdown & Status Tier**: Discrete tracking of 🔴 Critical milestones, 🟡 Important tasks, and 🟢 Helpful polish, along with dynamic readiness tiers (`🚀 Peak Mastery`, `⭐ Interview Ready`, `📈 Building Momentum`, `🌱 Early Prep Stage`).
  - **Multi-Roadmap Management & Edit Details**: Create, edit (title, company, role, date, tier), duplicate, and delete roadmaps linked to specific companies or target roles.
  - **Smart Tracker Auto-Prompt (`?appId=...`)**: 1-click tailored checklist creation when navigating from Kanban jobs that don't yet have a roadmap.
  - **Category Bulk Actions & Reset**: 1-click **Mark All Done** and **Reset** per category, global **Expand All / Collapse All**, and roadmap progress reset.
  - **Custom Milestone Lifecycle**: Add, inline-edit descriptions/priorities, and delete custom tasks within any category.
  - **Study Focus Timer (Pomodoro)**: Built-in 25-minute and 45-minute practice timer for timed LeetCode sessions and mock interview drills.
  - **Obsidian / Notion Markdown Export**: Instant **Copy as Markdown** with `- [x]` / `- [ ]` syntax, priorities, and personal notes, plus `.md` file download.
  - **Interactive Level Assessment Rubric**: Multi-tab hiring committee evaluation matrix detailing exact standards for each seniority tier.
  - **Print & PDF Engine**: Dedicated print stylesheet formatting checklists into clean, zero-chrome A4/Letter sheets.
  - **Instant Global Tooltips**: Viewport-safe, zero-lag floating tooltips on every interactive button in the app.
- 📊 **Interactive Analytics Dashboard (`/`)**:
  - **Upcoming Interviews & Countdowns Widget**: Real-time urgency alerts (`🔴 TODAY`, `🟡 TOMORROW`, `🟢 In X Days`) with 1-click checklist access.
  - **Roadmap Readiness Summary**: Circular SVG gauge tracking mastered milestones across active roadmaps.
  - **Onboarding Modal**: 2-step setup to personalize target role, experience tier, and auto-generate the first tailored checklist.
  - Pipeline velocity metrics, conversion funnels, recent application history, and JSON backup export/import.
- 📋 **Kanban Application Tracker (`/tracker`)**:
  - Drag-and-drop workflow across stages (*Applied*, *Interviewing*, *Offer Received*, *Archived*).
  - Interview dates, times, round types (Screening, Technical, System Design, Behavioral, Final), and countdown chips.
  - **1-Click "Prep Checklist"**: Direct card access to that company's tailored preparation roadmap.
- 🎙️ **Mock Interview Simulator & Prep Hub (`/prep`)**:
  - Seniority filter pills (`[All Levels]`, `[Fresher]`, `[Junior]`, `[Mid-Level]`, `[Senior]`, `[Lead]`) delivering curated questions.
  - Timed 2-minute mock interview simulator with Web Audio API chime notifications.
  - Speech-to-Text voice dictation (via Web Speech API) for speaking answers aloud.
  - Interactive STAR method coach with real-time scoring (Structure, Clarity, Impact) and printable cheat sheets.
- 🔍 **Job Discovery & 1-Click Match Fit (`/jobs`)**:
  - Search tech listings with location and remote filters.
  - Instantly port any job description to the ATS matcher with 1-click **"Match Fit"**.
- 📄 **Resume Builder & ATS Optimizer (`/resume`)**:
  - **Experience-Level Strategy Advice**: Dynamic contextual banner advising on resume length, metrics focus, and architectural framing per seniority tier.
  - Real-time keyword scoring against specific job descriptions, section-by-section editing, and ATS compliance checks.
  - Cover letter generator and print-ready PDF export.
- 👤 **Candidate Profile & Smart Auto-Fill (`/profile`)**:
  - Interactive **Experience Level Selector** and **Level Expectations Guide** outlining interviewer bars for each seniority tier.
  - Upload existing PDF or DOCX resumes to automatically populate candidate info, role preferences, bio summaries, and skills matrices.
- 🌓 **Adaptive Light & Dark Themes**: First-class dark mode support with smooth transitions and theme persistence.
- ⚡ **Universal Command Palette (`⌘K` / `Ctrl+K`)**: Rapid keyboard navigation across pages, theme toggles, modal triggers, and JSON data backup.
- 🛡️ **Rogue Extension Defense**: Viewport lock and DOM mutation observers that isolate and block unauthorized third-party extension injection.

---

## 📸 Screenshots & Walkthrough

### 1. Overview Dashboard
High-level visibility into your entire job hunt: upcoming interviews with live countdowns, preparation roadmap readiness, active pipeline counts, and quick launcher shortcuts.

![Overview Dashboard](docs/screenshots/dashboard.png)

---

### 2. Experience-Level Prep Checklist Hub
Curate and conquer milestone-based interview preparation customized to your seniority tier (Fresher, Mid-Level, Senior, Lead). Features phase-based task breakdown, Critical / Important / Helpful priority meters, integrated focus timer, custom task CRUD, level rubric evaluation modal, bulk mark-all actions, and formatted Markdown export.

![Interview Preparation Checklist](docs/screenshots/checklist.png)

---

### 3. Kanban Application Tracker
Track application lifecycles from first outreach to signed offer. Add interview dates, times, and round types with real-time countdown alerts, and jump directly into company-tailored interview checklists and role-specific practice.

![Application Tracker](docs/screenshots/tracker.png)

---

### 4. Preparation Hub & Mock Interview Simulator
Browse categorized interview questions filtered by candidate seniority (*Fresher* to *Lead*), system design, and behavioral categories. Practice STAR answers under a 2-minute timer with voice-to-text dictation and audio prompts.

![Preparation Hub](docs/screenshots/prep_hub.png)

---

### 5. Job Discovery & 1-Click ATS Fit
Discover active openings filtered by role, tech stack, and remote flexibility. Click **Match Fit** on any job card to instantly analyze how well your credentials align with the role's requirements.

![Job Discovery](docs/screenshots/job_search.png)

---

### 6. Resume Builder & ATS Scorer
Format ATS-friendly resumes with live previewing, seniority-calibrated strategy banners, automated bullet point guidance, and keyword gap analysis against target job descriptions.

![Resume Builder](docs/screenshots/resume_builder.png)

---

### 7. Candidate Profile & Resume Auto-Fill
Manage your career narrative, social links, and skills matrix. Configure your experience years to auto-calibrate expectations and checklists across the application.

![Candidate Profile](docs/screenshots/profile.png)

---

## 🔄 Cross-Module Workflows

The application connects job searching, resume tailoring, application tracking, checklists, and interview preparation into an integrated pipeline:

```
┌─────────────────┐       Match Fit (1-Click)       ┌────────────────────────┐
│   Job Search    │ ──────────────────────────────> │ Resume Builder         │
│  (Find listing) │                                 │ (Prefilled JD Matcher) │
└────────┬────────┘                                 └────────────────────────┘
         │
         │ Track Application (1-Click)
         v
┌─────────────────┐       1-Click Prep Checklist    ┌────────────────────────┐
│  Kanban Tracker │ ──────────────────────────────> │ Prep Checklist Hub     │
│(Date, Time, Rds)│ <────────────────────────────── │(Tailored to Seniority) │
└────────┬────────┘                                 └───────────┬────────────┘
         │                                                      │
         │ Practice Role Qs                                     │ Practice in Hub
         v                                                      v
┌────────────────────────────────────────────────────────────────────────────┐
│                             Preparation Hub                                │
│          (Seniority Filter, Filtered Role Bank & Mock Simulator)           │
└────────────────────────────────────────────────────────────────────────────┘
```

1. **Job Search ➔ Resume Builder**: Clicking **Match Fit** on any job card packages the role title, company, and JD text into `sessionStorage` and immediately opens the ATS Matcher tab prefilled.
2. **Tracker ➔ Checklist**: Clicking **Prep Checklist** on any application card opens or generates a tailored preparation roadmap for that company.
3. **Checklist ➔ Prep Hub / Resume**: Checklist items link directly to the relevant tool (e.g. practicing DSA/STAR in Prep Hub, checking ATS keywords in Resume Builder).
4. **Tracker ➔ Prep Hub**: Clicking **Role Bank** on an active interview card filters the questions bank specifically for that position.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, React Router v7, Lucide Icons, Vite 8 |
| **Styling** | Vanilla CSS3 with CSS Custom Properties (Theme tokens & dark mode), Media Print |
| **Web APIs** | Web Speech API (`SpeechRecognition`), Web Audio API (`AudioContext`, `OscillatorNode`), `sessionStorage`, `localStorage` |
| **Backend** | Node.js 20/22, Express 4.19, Multer, PDF-Parse, Mammoth (.docx parser), Cheerio |
| **Reverse Proxy** | Nginx 1.27 Alpine with Gzip compression and SPA fallback routing |
| **Containerization** | Docker, Docker Compose (Multi-stage builds, non-root user execution) |
| **Data Persistence** | Dual-storage engine: local JSON database (`backend/db.json`) synced with client local state |

---

## 🏗️ System Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │                 Client Browser               │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             │ HTTP Port 3000 / 5173
                                             v
                      ┌──────────────────────────────────────────────┐
                      │              frontend container              │
                      │               (Nginx 1.27 Alpine)            │
                      │                                              │
                      │  • Serves React 19 SPA (HTML, CSS, JS)       │
                      │  • Gzip compression & asset caching          │
                      │  • SPA fallback routing (try_files)          │
                      │  • Reverse proxies /api/ & /uploads/         │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             │ Internal Network (HTTP:5001)
                                             v
                      ┌──────────────────────────────────────────────┐
                      │              backend container               │
                      │               (Node.js 20/22 Alpine)         │
                      │                                              │
                      │  • Express API (5001)                        │
                      │  • Checklists & Experience Template Engine   │
                      │  • PDF/DOCX Resume parsing engine            │
                      │  • Healthcheck endpoint (/api/health)        │
                      └──────────────┬───────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 v                                       v
      ┌─────────────────────┐                 ┌─────────────────────┐
      │  ./backend/db.json  │                 │   backend_uploads   │
      │   (Bind Mount)      │                 │  (Docker Volume)    │
      └─────────────────────┘                 └─────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher) — *for local setup*
- **Docker** & **Docker Compose** — *for containerized setup*

---

### Option A: Run with Docker Compose (Recommended)

Run the full production stack with a single command:

```bash
# 1. Build and start containers in the background:
docker-compose up -d --build

# 2. View streaming logs from all services:
docker-compose logs -f

# 3. Stop containers:
docker-compose down
```

#### Access Points:
- 🌐 **Web Application**: **[http://localhost:3000](http://localhost:3000)** (Nginx + React SPA)
- 🔌 **Backend API**: **[http://localhost:5001](http://localhost:5001)**

---

### Option B: Run Locally with Node.js

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/interview-tracker-web-app.git
   cd interview-tracker-web-app
   ```

2. **Start the Backend API Server:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   *The backend server will run at `http://localhost:5001`.*

3. **Start the Frontend Client:**
   ```bash
   # In a separate terminal window:
   cd frontend
   npm install
   npm run dev
   ```
   *The Vite dev server will run at `http://localhost:5173`.*

4. **Open in Browser:**
   Visit **[http://localhost:5173](http://localhost:5173)** to start using the app!

---

## 🔌 API Endpoints Reference

### Core & Jobs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Container and server healthcheck |
| `GET` | `/api/jobs` | Retrieve job listings with filters (`role`, `location`, `remote`, `skills`, `experience`) |
| `POST` | `/api/jobs` | Add a custom job opening |
| `DELETE`| `/api/jobs/:id` | Delete custom job opening |

### Checklists & Experience Roadmaps
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/checklists/levels` | Retrieve experience levels (*Fresher* to *Lead*) and bar expectations |
| `GET` | `/api/checklists/template` | Get tailored checklist template by `level` or `years` |
| `GET` | `/api/checklists` | Get all saved preparation checklists |
| `GET` | `/api/checklists/:id` | Get specific checklist by ID |
| `POST` | `/api/checklists` | Create new checklist instance (linked to application, company, or role) |
| `PUT` | `/api/checklists/:id` | Update checklist state (toggle items, update notes, add custom tasks) |
| `POST` | `/api/checklists/:id/duplicate`| Clone an existing checklist |
| `DELETE`| `/api/checklists/:id` | Delete checklist |

### Applications & Pipeline
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/applications` | Get all tracker applications across stages |
| `PUT` | `/api/applications` | Update Kanban application board state |

### Preparation & Questions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/questions` | Get interview questions bank with filters (`keyword`, `group`, `difficulty`, `level`) |
| `POST` | `/api/questions` | Submit new prep question with difficulty and level |
| `POST` | `/api/questions/:id/practice` | Save STAR answer & practice status for a question |
| `POST` | `/api/questions/:id/coach` | Run STAR coaching analysis (Structure, Clarity, Impact) |

### Candidate Profile & Resumes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile` | Retrieve candidate profile, seniority, and skill matrix |
| `POST` | `/api/profile/update` | Update candidate profile details |
| `POST` | `/api/profile/upload-resume` | Upload resume file to profile |
| `GET` | `/api/resume` | List all saved resumes |
| `POST` | `/api/resume` | Create or update resume document |
| `POST` | `/api/resume/upload` | Upload and extract structured data from PDF/DOCX |
| `POST` | `/api/resume/analyze-jd` | Analyze job description keyword match and generate bullet improvements |

---

## 🧪 Testing & Code Quality

The project includes strict linting rules and an automated end-to-end test suite verifying database operations, tracking pipelines, STAR scoring, notifications, and profile completeness.

```bash
# 1. Run frontend lint checks (Zero-warning standard)
cd frontend
npm run lint

# 2. Verify frontend production bundle
npm run build

# 3. Run backend end-to-end verification suite (30/30 tests)
cd ../backend
node test-e2e-suite.js
```

---

## ⌨️ Keyboard Shortcuts & Accessibility

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `⌘K` / `Ctrl+K` | Open Command Palette | Universal launcher for fast navigation, triggers, and theme toggling |
| `Esc` | Close Modal / Palette | Dismiss any open modal, dialog, or search overlay |
| `Tab` / `Shift+Tab` | Keyboard Focus | Full keyboard accessibility across interactive elements and forms |

---

## 📁 Project Directory Structure

```
interview-tracker-web-app/
├── docker-compose.yml        # Multi-container orchestration
├── .dockerignore             # Root docker ignore file
├── docs/
│   └── screenshots/          # Application screenshots for documentation
│       ├── checklist.png
│       ├── dashboard.png
│       ├── job_search.png
│       ├── prep_hub.png
│       ├── profile.png
│       ├── resume_builder.png
│       └── tracker.png
├── backend/
│   ├── Dockerfile            # Lightweight Node.js Alpine container
│   ├── .dockerignore         # Backend ignore manifest
│   ├── data/
│   │   └── checklists.js     # Seniority definitions & comprehensive checklist templates
│   ├── routes/               # Express API route modules
│   │   ├── applications.js   # Tracker pipeline CRUD
│   │   ├── checklists.js     # Experience-based checklist CRUD & duplication
│   │   ├── jobs.js           # Job search & custom openings
│   │   ├── profile.js        # Candidate profile & skills
│   │   ├── questions.js      # Prep hub questions & STAR answers (with level filtering)
│   │   └── resume.js         # Resume upload, parsing & ATS matching
│   ├── uploads/              # Local storage for uploaded candidate resumes
│   ├── db.json               # JSON database
│   ├── db.js                 # Database read/write utility
│   ├── server.js             # Express application entry point
│   ├── test-api-integration.js # Resume upload & parser test suite
│   └── test-e2e-suite.js     # 30-step end-to-end integration test suite
├── frontend/
│   ├── Dockerfile            # Multi-stage build (Node build -> Nginx Alpine)
│   ├── nginx.conf            # Nginx reverse proxy & SPA router
│   ├── .dockerignore         # Frontend ignore manifest
│   ├── public/
│   ├── src/
│   │   ├── components/       # Header, Sidebar, ExperienceLevelBadge, GlobalTooltip, OnboardingModal
│   │   ├── pages/            # Dashboard, Checklist, Tracker, Preparation, Jobs, Resume, Profile, Contribute
│   │   ├── services/         # Dynamic API integration client (api.js), storage (storage.js)
│   │   ├── utils/            # Seniority constants & level resolver (experience.js)
│   │   ├── App.jsx           # Top-level routing & layout wrapper
│   │   ├── index.css         # Design system, dark mode tokens & print styles
│   │   └── main.jsx          # React app entry point
│   ├── index.html
│   └── vite.config.js
└── README.md
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
