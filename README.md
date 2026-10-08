# ⚡ MeetingOS — Evidence-First Meeting Intelligence

> **Transform raw meeting notes, audio recordings, and live discussions into verified, actionable intelligence with zero hallucinations.**

---

## 🌟 Overview

**MeetingOS** is an intelligent, evidence-grounded meeting intelligence platform. Unlike standard summary tools that can hallucinate details, MeetingOS enforces an **Evidence-First Verification Engine**: every decision, action item, owner, and deadline extracted by AI is strictly tied to exact quotes and character offsets in the source transcript or notes.

---

## ✨ Key Features

- **🎙️ Dual-Source Live Meeting Capture:**
  - Record active meetings directly from browser tabs (Google Meet, Zoom web, Microsoft Teams, YouTube) combined with your microphone.
  - Live low-latency speaker monitoring and high-fidelity local playback.
- **📁 Multi-Format Ingestion:**
  - Audio & Video uploads (`.mp3`, `.wav`, `.m4a`, `.webm`, `.mp4`, `.aac`, `.ogg`).
  - Document uploads (`.txt`, `.pdf`, `.docx`, `.md`) or direct text note entry.
- **⚡ Fast Speech-to-Text Transcription:**
  - Whisper Speech-to-Text powered by Groq Cloud (`whisper-large-v3`).
- **⚖️ Dynamic Decision Attribution:**
  - AI extracts decisions and attributes them dynamically to the actual speakers or participants mentioned in context.
- **✅ Anti-Hallucination Action Items:**
  - Automatically identifies task owners, deadlines, and urgency levels.
  - Verifies extracted tasks against source text with visual verification badges (`Verified`, `Unverified`, `Conflict`, `Ambiguous`).
- **✏️ Interactive Task Management:**
  - Edit owners, deadlines, priorities, and task status in real time.
- **💬 Ask Meetings Intelligence:**
  - Conversational Q&A across single or multiple meetings with verbatim quote citations and timestamp links.
---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, React Router v6, Lucide Icons, ReactFlow |
| **Backend** | Node.js, Express (ES Modules), PostgreSQL (`pg`), Multer, Mammoth, PDF-parse, Zod |
| **Database** | PostgreSQL / Supabase |
| **AI & LLM** | Qualcomm Cloud AI / Cirrascale Imagine (`Llama-3.1-8B`), Groq Cloud (`Whisper-large-v3`) |
| **Testing** | Node.js native test runner (`node --test`) |

---

## 📂 Project Structure

```
meetingos/
├── client/                     # React Frontend Application (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios API clients & endpoints
│   │   ├── components/         # Reusable UI components & layouts
│   │   │   ├── capture/        # Live audio capture zone
│   │   │   ├── common/         # Buttons, Badges, Modals
│   │   │   ├── layout/         # Navbar, Layout wrapper
│   │   │   └── meetings/       # DecisionCards, ActionItemCards, Chat
│   │   ├── context/            # AuthContext state
│   │   ├── pages/              # Dashboard, Meetings, Upload, AskMeetings
│   │   ├── routes/             # App routing definitions
│   │   ├── index.css           # Neo-brutalist Tailwind styling
│   │   └── main.jsx            # App entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express Backend API
│   ├── sql/                    # PostgreSQL migrations & seed files
│   │   ├── migrations/         # Migration scripts (001, 002, 003)
│   │   └── migrate.js          # Migration runner
│   ├── src/
│   │   ├── config/             # Database connection & env config
│   │   ├── controllers/        # Route controllers (auth, meeting, extraction)
│   │   ├── middleware/         # Auth, file upload, error handling
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # AI, transcription, verification, db services
│   │   ├── utils/              # Text processing & prompt templates
│   │   ├── validators/         # Zod schemas & input validation
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── tests/                  # Unit & integration tests
│   ├── .env.example            # Backend environment template
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) → [Download Node.js](https://nodejs.org/)
- **npm** (v9.0.0 or higher)
- **PostgreSQL Database** (or a free cloud instance via [Supabase](https://supabase.com))

---

### 2. Clone and Setup Environment

#### Step A: Configure Backend Environment Variables
1. Navigate to the `server` directory:
   ```bash
   cd meetingos/server
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `server/.env` and configure your credentials:
   ```env
   NODE_ENV=development
   PORT=5000

   # Database Connection (Supabase or Local PostgreSQL)
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d

   # Qualcomm Cloud AI / Cirrascale Imagine API
   QUALCOMM_AI_BASE_URL=https://aisuite.cirrascale.com/apis/v2
   QUALCOMM_AI_API_KEY=your_qualcomm_api_key
   QUALCOMM_AI_MODEL=Llama-3.1-8B

   # Groq Cloud API (Whisper Transcription)
   GROQ_API_KEY=your_groq_api_key
   GROQ_WHISPER_MODEL=whisper-large-v3

   # Client URL & Limits
   CLIENT_URL=http://localhost:5173
   MAX_FILE_SIZE_MB=50
   ```

---

### 3. Install Dependencies & Run Database Migrations

#### Step A: Server Setup
```bash
cd meetingos/server
npm install
npm run migrate
```
> 💡 *`npm run migrate` will create the database tables (`users`, `meetings`, `decisions`, `action_items`, `meeting_questions`) and seed the default test user.*

#### Step B: Client Setup
Open a new terminal window:
```bash
cd meetingos/client
npm install
```

---

### 4. Running the Development Servers

#### Terminal 1 — Start Backend Server:
```bash
cd meetingos/server
npm run dev
```
*Backend runs at:* `http://localhost:5000`

#### Terminal 2 — Start Frontend Server:
```bash
cd meetingos/client
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🔑 Default Login Credentials

If you seeded the database using `npm run migrate`, you can log in with:
- **Email:** `demo@meetingos.local`
- **Password:** `password123`
*(Or click **Register** on the navigation bar to create a new user account).*

---

## 🧪 Running Automated Tests

MeetingOS includes a suite of unit and integration tests covering text normalization, file parsing, validation schemas, and the evidence verification engine:

```bash
cd meetingos/server
npm test
```

Expected output:
```
✔ fileService (3 tests)
✔ textUtils (3 tests)
✔ authValidator & meetingValidator (7 tests)
✔ verificationService (4 tests)

ℹ tests 17 | suites 6 | pass 17 | fail 0
```

---

## 🌐 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/meetings` | List user meetings (with search/filter) | Yes |
| `POST` | `/api/meetings` | Create meeting (text / audio / video / doc) | Yes |
| `GET` | `/api/meetings/:id` | Get meeting details with decisions & tasks | Yes |
| `DELETE` | `/api/meetings/:id` | Delete a meeting | Yes |
| `PATCH` | `/api/meetings/actions/:id` | Update action item (owner, date, status) | Yes |
| `POST` | `/api/meetings/transcribe` | Transcribe live recorded audio blob | Yes |
| `POST` | `/api/meetings/ask` | Ask questions across meetings | Yes |

---


