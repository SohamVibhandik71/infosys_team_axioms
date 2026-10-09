# Setup Guide

## 1. Purpose

This document explains how to set up, configure, run, and develop MeetingOS locally.

The project uses:

- React + Vite
- Tailwind CSS
- Node.js
- Express.js
- PostgreSQL
- Supabase PostgreSQL
- `pg`
- Zod
- JWT
- bcrypt
- Multer
- Qualcomm Cloud AI / Imagine API

The project does **not** use Prisma or another ORM.

---

# 2. Prerequisites

Install the following before starting development.

### Required

- Node.js
- npm
- Git
- A Supabase account/project
- Qualcomm/Cirrascale AI API access

### Recommended

- VS Code or another JavaScript IDE
- Postman or another API client
- PostgreSQL-compatible database client

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

Check Git:

```bash
git --version
```

---

# 3. Clone the Repository

Clone the project:

```bash
git clone <repository-url>
```

Enter the project:

```bash
cd meetingos
```

The exact repository URL depends on the project's GitHub repository.

---

# 4. Recommended Project Structure

The project should eventually resemble:

```text
meetingos/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── docs/
│   └── ...
│
├── PRD.md
├── DATABASE.md
├── TECHNICAL_ARCH.md
├── API.md
├── AI_PIPELINE.md
├── FRONTEND.md
├── DESIGN.md
├── TESTING.md
├── AGENT.md
├── SETUP.md
└── .gitignore
```

The actual repository layout may be adjusted during implementation, but frontend and backend responsibilities should remain separated.

---

# 5. Backend Setup

Enter the backend directory:

```bash
cd server
```

Initialize the Node project if it has not already been initialized:

```bash
npm init -y
```

Install the core backend dependencies:

```bash
npm install express pg zod jsonwebtoken bcrypt multer dotenv cors
```

Install development dependencies as needed:

```bash
npm install -D nodemon
```

The final dependency list should be kept synchronized with the actual implementation.

---

# 6. Backend Development Script

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js"
  }
}
```

If the project uses a different entry file, update the scripts accordingly.

---

# 7. Frontend Setup

From the project root:

```bash
cd client
```

If the frontend has not been created:

```bash
npm create vite@latest . -- --template react
```

Install dependencies:

```bash
npm install
```

Install the project's frontend dependencies:

```bash
npm install axios react-router-dom reactflow zod
```

Tailwind should be configured according to the project's chosen Tailwind version and current setup.

---

# 8. Supabase PostgreSQL Setup

MeetingOS uses **Supabase as the managed PostgreSQL provider**.

The architecture remains:

```text
Node.js
   ↓
pg
   ↓
Supabase PostgreSQL
```

Supabase is not being used as a replacement for the backend.

The Express backend remains responsible for:

- Authentication
- Authorization
- Business logic
- Database access
- AI orchestration

---

# 9. Create Supabase Project

Create a Supabase project through the Supabase dashboard.

After the project is created, obtain the PostgreSQL connection information provided by Supabase.

The backend needs a PostgreSQL connection string.

Conceptually:

```env
DATABASE_URL=<supabase-postgresql-connection-string>
```

Use the connection option appropriate for the deployment environment.

Do not commit the connection string to Git.

---

# 10. Database Initialization

The database schema is defined in:

```text
DATABASE.md
```

The SQL schema should be implemented through versioned SQL migrations.

Recommended structure:

```text
server/
└── sql/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_indexes.sql
    │   └── ...
    └── seed/
        └── ...
```

Do not manually change production tables without recording the schema change in a migration.

---

# 11. PostgreSQL Connection

Use the `pg` package.

Example:

```js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
```

The exact module syntax should match the project's configured Node.js module system.

---

# 12. Database Query Rules

Always use parameterized queries.

Correct:

```js
const result = await pool.query(
  "SELECT * FROM meetings WHERE id = $1",
  [meetingId]
);
```

Do not do:

```js
const result = await pool.query(
  `SELECT * FROM meetings WHERE id = '${meetingId}'`
);
```

Parameterized queries are required to reduce SQL injection risk.

---

# 13. Database Environment

Conceptual backend `.env`:

```env
DATABASE_URL=
```

Do not expose `DATABASE_URL` to React.

Never prefix it with:

```text
VITE_
```

The database connection belongs exclusively to the backend.

---

# 14. JWT Configuration

The backend requires a secret for signing JWTs.

```env
JWT_SECRET=
JWT_EXPIRES_IN=7d
```

The exact expiration period may be adjusted according to the application's authentication requirements.

Never commit `JWT_SECRET`.

---

# 15. Qualcomm AI Configuration

MeetingOS uses the Qualcomm/Cirrascale Imagine API.

Documentation:

```text
https://aisuite.cirrascale.com/imagine-api-docs
```

The AI integration belongs in the backend.

Conceptual environment variables:

```env
QUALCOMM_AI_BASE_URL=
QUALCOMM_AI_API_KEY=
QUALCOMM_AI_MODEL=
```

The actual values must come from the Qualcomm/Cirrascale account and API documentation.

Do not invent or hardcode:

- API keys
- Model identifiers
- Authentication credentials
- Provider secrets

---

# 16. AI Environment Security

Correct:

```text
React
  ↓
Express
  ↓
AI Service
  ↓
Qualcomm API
```

Incorrect:

```text
React
  ↓
Qualcomm API
```

Never expose:

```text
QUALCOMM_AI_API_KEY
DATABASE_URL
JWT_SECRET
```

to the browser.

---

# 17. Backend Environment File

Create:

```text
server/.env
```

Example:

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=7d

QUALCOMM_AI_BASE_URL=
QUALCOMM_AI_API_KEY=
QUALCOMM_AI_MODEL=

CLIENT_URL=http://localhost:5173
```

Values should be filled with actual development credentials.

---

# 18. `.env.example`

Commit an example file without secrets:

```text
server/.env.example
```

Example:

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=7d

QUALCOMM_AI_BASE_URL=
QUALCOMM_AI_API_KEY=
QUALCOMM_AI_MODEL=

CLIENT_URL=http://localhost:5173
```

This tells other developers which environment variables are required.

---

# 19. Gitignore

The repository must ignore secrets and generated development files.

Example:

```gitignore
node_modules/
.env
.env.*
!.env.example

dist/
build/

coverage/

*.log

.DS_Store
```

If Python or unrelated tooling is introduced, its generated environments should also be ignored.

Never commit:

```text
.env
API keys
JWT secrets
Database passwords
Private credentials
```

---

# 20. Start the Backend

From:

```text
server/
```

Run:

```bash
npm run dev
```

Expected behavior:

```text
Server starting...
Database connected...
Server running on port 5000
```

The exact log messages depend on the implementation.

---

# 21. Start the Frontend

From:

```text
client/
```

Run:

```bash
npm run dev
```

Vite will normally provide a local development URL.

Example:

```text
http://localhost:5173
```

The exact port may differ if it is already occupied.

---

# 22. Frontend Environment Variables

Create:

```text
client/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Only values intended for the browser should use the `VITE_` prefix.

Never put:

```text
DATABASE_URL
JWT_SECRET
QUALCOMM_AI_API_KEY
```

in the frontend environment.

---

# 23. Frontend API Client

The frontend should use a centralized API client.

Example:

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export default api;
```

Authentication tokens should be attached according to the project's authentication implementation.

---

# 24. Verify Backend

Test the backend health endpoint if implemented:

```http
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "Server is running"
}
```

If a health endpoint is not yet implemented, add one early during backend setup.

---

# 25. Verify Database

After starting the backend, verify that it can connect to Supabase PostgreSQL.

A basic database check should confirm:

```text
Backend
   ↓
pg Pool
   ↓
Supabase PostgreSQL
```

If the connection fails, check:

- `DATABASE_URL`
- Supabase project status
- Database credentials
- Connection mode
- Network access
- SSL requirements
- Backend environment loading

Do not expose the full database connection string in logs.

---

# 26. Verify Qualcomm AI

Before implementing the complete meeting pipeline, verify the smallest possible AI request.

Recommended sequence:

```text
Backend
   ↓
aiService.js
   ↓
Qualcomm Imagine API
   ↓
Simple test prompt
   ↓
Response
```

Only after this succeeds should the full extraction pipeline be connected.

---

# 27. Recommended Backend Development Order

```text
1. Express server
       ↓
2. Environment configuration
       ↓
3. PostgreSQL connection
       ↓
4. Database migrations
       ↓
5. Authentication
       ↓
6. Meeting APIs
       ↓
7. File processing
       ↓
8. Qualcomm AI service
       ↓
9. AI extraction
       ↓
10. Zod validation
       ↓
11. Verification
       ↓
12. Action/decision/question APIs
       ↓
13. Dependencies
       ↓
14. Export
       ↓
15. Advanced features
```

---

# 28. Recommended Frontend Development Order

```text
1. Vite setup
       ↓
2. Tailwind/design system
       ↓
3. Routing
       ↓
4. Authentication screens
       ↓
5. API client
       ↓
6. Dashboard
       ↓
7. Meeting creation
       ↓
8. Processing UI
       ↓
9. Meeting detail
       ↓
10. Action management
       ↓
11. Decisions/questions
       ↓
12. Dependency graph
       ↓
13. Meeting history
       ↓
14. Ask My Meetings
       ↓
15. Export
```

---

# 29. Running the Complete Application

Use two terminals.

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

Architecture:

```text
Browser
   │
   ▼
React / Vite
   │
   ▼
Express API
   │
   ├──────────────► Supabase PostgreSQL
   │
   └──────────────► Qualcomm Imagine API
```

---

# 30. API Testing With Postman

Postman can be used to test backend APIs before frontend integration.

Recommended order:

```text
Register
   ↓
Login
   ↓
Copy JWT
   ↓
Create Meeting
   ↓
Process Meeting
   ↓
Get Meeting
   ↓
Get Actions
   ↓
Update Action
```

For protected endpoints:

```http
Authorization: Bearer <JWT>
```

---

# 31. Local Development Workflow

Recommended workflow:

```text
1. Pull latest code
2. Create/checkout feature branch
3. Install dependencies if package files changed
4. Configure environment
5. Start backend
6. Start frontend
7. Implement feature
8. Test locally
9. Run relevant automated tests
10. Review changes
11. Commit
12. Push branch
13. Create Pull Request
```

Follow repository branch-protection rules.

Do not directly push to protected branches.

---

# 32. Feature Development Workflow

For each feature:

```text
Requirement
    ↓
Read relevant documentation
    ↓
Plan
    ↓
Backend/API
    ↓
Database
    ↓
AI integration if required
    ↓
Frontend
    ↓
Tests
    ↓
Manual verification
    ↓
Documentation update
```

The implementation should follow:

```text
PRD
DATABASE
TECHNICAL_ARCH
API
AI_PIPELINE
FRONTEND
DESIGN
TESTING
AGENT
```

---

# 33. Common Issue — Database Connection

### Symptoms

```text
Database connection failed
ECONNREFUSED
authentication failed
SSL connection error
```

Check:

```text
DATABASE_URL
```

Then verify:

```text
Supabase project is active
Correct credentials
Correct connection string
Correct connection mode
```

Restart the backend after changing `.env`.

---

# 34. Common Issue — Environment Variables Undefined

If:

```js
process.env.DATABASE_URL
```

returns undefined, verify that:

1. `.env` exists.
2. `dotenv` is loaded.
3. The variable name is correct.
4. The backend was restarted.
5. `.env` is in the expected backend directory.

Never print the actual secret value to logs.

---

# 35. Common Issue — CORS

If the browser reports a CORS error, verify:

```text
Frontend URL
        ↓
Express CORS configuration
```

Example:

```js
app.use(
  cors({
    origin: process.env.CLIENT_URL
  })
);
```

Production should use the actual deployed frontend origin rather than allowing every origin unnecessarily.

---

# 36. Common Issue — Qualcomm AI Failure

If AI processing fails, check:

```text
API key
Base URL
Model
Request format
Authentication
Network
Provider response
```

Do not immediately modify the rest of the application.

First isolate the failure inside:

```text
aiService.js
```

The provider-specific request format must match the official Qualcomm/Cirrascale documentation.

---

# 37. Common Issue — AI Returns Invalid JSON

The AI output must pass:

```text
Provider response
      ↓
Parse
      ↓
Zod validation
```

If invalid:

```text
Do not persist
      ↓
Log safe diagnostic information
      ↓
Return controlled error
```

Do not store malformed AI data as trusted meeting information.

---

# 38. Common Issue — File Upload Fails

Check:

```text
File exists
File extension
MIME type
File size
Multer configuration
Text extraction library
Extracted text
```

A valid file does not guarantee extractable text.

---

# 39. Production Build

Frontend:

```bash
npm run build
```

The generated build should be tested before deployment.

Backend:

```bash
npm start
```

The production environment must provide all required environment variables.

---

# 40. Production Environment

Production configuration should include:

```env
NODE_ENV=production

PORT=

DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=

QUALCOMM_AI_BASE_URL=
QUALCOMM_AI_API_KEY=
QUALCOMM_AI_MODEL=

CLIENT_URL=
```

Do not commit production values.

Use the deployment platform's secret/environment-variable management.

---

# 41. Deployment Architecture

Recommended conceptual architecture:

```text
                 Internet
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     React Frontend      Node/Express API
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             Supabase PostgreSQL   Qualcomm AI
```

The frontend and backend may be deployed on different services.

The database remains managed by Supabase.

---

# 42. Production Security Checklist

Before deployment:

```text
[ ] HTTPS enabled
[ ] Production JWT secret configured
[ ] Database credentials stored as secrets
[ ] Qualcomm API key stored as secret
[ ] CORS restricted
[ ] Debug mode disabled
[ ] Production error responses sanitized
[ ] File size limits configured
[ ] File type validation enabled
[ ] SQL queries parameterized
[ ] Authentication enabled
[ ] Authorization checks enabled
[ ] .env excluded from Git
[ ] Secrets not present in frontend bundle
```

---

# 43. Git Safety Checklist

Before committing:

```bash
git status
```

Check that these are not staged:

```text
.env
node_modules/
dist/
build/
coverage/
```

Review changes:

```bash
git diff
```

Then:

```bash
git add .
git commit -m "your message"
git push
```

Use the project's required branch and Pull Request workflow.

---

# 44. Documentation Maintenance

When implementation changes, update the relevant documentation.

Examples:

```text
Database schema changed
    → DATABASE.md

API changed
    → API.md

AI pipeline changed
    → AI_PIPELINE.md

Frontend flow changed
    → FRONTEND.md

Visual design changed
    → DESIGN.md

Testing requirements changed
    → TESTING.md

Architecture changed
    → TECHNICAL_ARCH.md

Development-agent rules changed
    → AGENT.md
```

Do not duplicate the same technical specification across multiple files.

---

# 45. New Developer Checklist

A new developer should be able to:

```text
[ ] Clone repository
[ ] Install Node.js
[ ] Install dependencies
[ ] Create .env files
[ ] Connect to Supabase
[ ] Configure Qualcomm AI credentials
[ ] Run database migrations
[ ] Start backend
[ ] Start frontend
[ ] Register account
[ ] Login
[ ] Create test meeting
[ ] Process meeting
[ ] View extracted actions
```

If any of these steps require undocumented knowledge, update this file.

---

# 46. Final Setup Architecture

```text
                ┌──────────────────────┐
                │      Developer       │
                └──────────┬───────────┘
                           │
                           ▼
                    Git Repository
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        React / Vite              Node / Express
              │                         │
              │                    ┌────┴────┐
              │                    ▼         ▼
              │                 Supabase   Qualcomm
              │                PostgreSQL    AI
              │                    │         │
              └────────────────────┴─────────┘
                           │
                           ▼
                       MeetingOS
```

---

# 47. Final Setup Principle

The local environment should remain simple:

```text
Frontend
   +
Backend
   +
Supabase PostgreSQL
   +
Qualcomm Cloud AI
```

No ORM is required.

No separate Python backend is required.

No FastAPI service is required.

No direct database access from the frontend is allowed.

The core backend remains:

```text
Node.js + Express.js + pg
```

with Qualcomm AI isolated behind the backend AI service.

> **If a new developer can clone the repository, configure the environment, start the frontend/backend, connect to Supabase, and process a test meeting by following this document, the setup documentation is doing its job.**
