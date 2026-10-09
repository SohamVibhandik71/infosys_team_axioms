# TECHNICAL_ARCH.md

# MeetingOS — Technical Architecture

## 1. Document Overview

This document defines the complete technical architecture for **MeetingOS**, an AI-powered meeting intelligence platform that converts messy meeting notes into structured, verifiable, actionable information.

MeetingOS is designed around one core principle:

> **The AI should extract what the meeting actually says, not invent what it thinks the meeting meant.**

The system processes meeting notes through Qualcomm Cloud AI, validates and verifies the generated output, stores structured information in PostgreSQL, and presents the result through a React-based dashboard.

---

# 2. Product Definition

## 2.1 Core Objective

MeetingOS transforms:

```text
Messy Meeting Notes
        ↓
AI Understanding
        ↓
Structured Extraction
        ↓
Verification
        ↓
Actionable Meeting Intelligence
```

The system extracts:

- Meeting summary
- Action items
- Owners
- Deadlines
- Priorities
- Decisions
- Questions/discussions
- Dependencies
- Ambiguities
- Confidence scores
- Evidence/source text
- Verification results
- Conflicts
- Unassigned tasks
- Unresolved commitments

---

# 3. Architecture Goals

The architecture is designed to provide:

1. **Reliable AI extraction**
2. **Qualcomm Cloud AI integration**
3. **Evidence-backed results**
4. **Low hallucination risk**
5. **Clear separation of concerns**
6. **Simple JavaScript backend**
7. **Direct PostgreSQL access**
8. **Scalability**
9. **Secure data handling**
10. **Easy hackathon development and deployment**

---

# 4. Technology Stack

## 4.1 Frontend

| Technology | Purpose |
|---|---|
| React | Frontend application |
| Vite | Frontend build tool |
| Tailwind CSS | UI styling |
| React Router | Client-side routing |
| Axios | API communication |
| React Flow | Dependency graph |
| Zod | Client-side validation where required |

---

## 4.2 Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| `pg` | PostgreSQL driver |
| Zod | Backend validation |
| JSON Web Token | Authentication |
| bcrypt | Password hashing |
| Multer | File uploads |
| dotenv | Environment variables |

### Important

The project intentionally does **not** use Prisma.

Database communication is handled directly through the PostgreSQL `pg` package.

```text
Express.js
    ↓
pg
    ↓
PostgreSQL
```

This keeps the database layer simple and gives the development team direct control over SQL.

---

## 4.3 AI Layer

| Technology | Purpose |
|---|---|
| Qualcomm Cloud AI Platform | Primary AI inference |
| Structured JSON prompting | Reliable extraction |
| Zod | AI response validation |
| Verification service | Output verification |

Qualcomm Cloud AI is a **mandatory core component**, not an optional external feature.

---

## 4.4 Database

### Primary Database

**PostgreSQL**

Used for:

- Users
- Meetings
- Original notes
- Actions
- Evidence
- Decisions
- Questions
- Dependencies
- Verification results
- Meeting history

### Optional Extension

`pgvector` can be added later if semantic meeting search is implemented.

---

# 5. High-Level System Architecture

```text
                         ┌──────────────────────┐
                         │      User            │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │  + Tailwind CSS      │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │    Express.js API    │
                         │      Node.js         │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ Auth Service │  │ Meeting      │  │ Action       │
          │              │  │ Service      │  │ Service      │
          └──────────────┘  └──────────────┘  └──────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   AI Service Layer   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Qualcomm Cloud AI    │
                         └──────────┬───────────┘
                                    │
                             Structured JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Verification Service │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    PostgreSQL        │
                         └──────────────────────┘
```

---

# 6. Layered Architecture

MeetingOS follows a layered architecture.

```text
┌─────────────────────────────────────┐
│ Presentation Layer                  │
│ React + Tailwind                    │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│ API Layer                           │
│ Express Routes + Middleware         │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│ Controller Layer                    │
│ Request/Response Handling            │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│ Service Layer                       │
│ Business Logic + AI Orchestration   │
└──────────────────┬──────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│ Data Access     │ │ External APIs   │
│ PostgreSQL + pg │ │ Qualcomm AI     │
└────────┬────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
└─────────────────┘
```

---

# 7. Backend Folder Architecture

Recommended structure:

```text
server/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── meetingController.js
│   │   ├── actionController.js
│   │   ├── decisionController.js
│   │   └── questionController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── meetingRoutes.js
│   │   ├── actionRoutes.js
│   │   ├── decisionRoutes.js
│   │   └── questionRoutes.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── meetingService.js
│   │   ├── actionService.js
│   │   ├── verificationService.js
│   │   ├── extractionService.js
│   │   └── fileService.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── meetingValidator.js
│   │   └── actionValidator.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── textUtils.js
│   │
│   ├── app.js
│   └── server.js
│
├── sql/
│   ├── schema.sql
│   ├── indexes.sql
│   └── seed.sql
│
├── uploads/
│
├── .env
├── .env.example
├── package.json
└── .gitignore
```

---

# 8. Request Lifecycle

A typical request follows:

```text
Client
  ↓
HTTP Request
  ↓
Express Router
  ↓
Authentication Middleware
  ↓
Validation Middleware
  ↓
Controller
  ↓
Service
  ↓
Database / Qualcomm AI
  ↓
Service Processing
  ↓
Controller
  ↓
HTTP Response
  ↓
React UI
```

Controllers should remain thin.

Business logic should live inside services.

---

# 9. Meeting Processing Pipeline

The central pipeline is:

```text
                 USER INPUT
                     │
                     ▼
          ┌────────────────────┐
          │ Notes / File Input │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Text Extraction    │
          │ PDF/DOCX/TXT       │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Text Normalization │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Qualcomm Cloud AI  │
          │ Extraction         │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ JSON Validation     │
          │ Zod                │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ AI Verification    │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Conflict /         │
          │ Ambiguity Checks   │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ PostgreSQL Storage │
          └──────────┬─────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Structured UI      │
          └────────────────────┘
```

---

# 10. Input Processing

MeetingOS supports:

- Raw text
- TXT
- PDF
- DOCX

## Processing Flow

```text
Uploaded File
      ↓
File Type Detection
      ↓
Text Extraction
      ↓
Text Cleanup
      ↓
Original Text Preservation
      ↓
AI Processing
```

The original text must be preserved.

The system should never overwrite the original meeting notes with cleaned or AI-generated text.

---

# 11. AI Architecture

## 11.1 AI Responsibilities

Qualcomm Cloud AI is responsible for extracting:

- Summary
- Actions
- Owners
- Deadlines
- Priorities
- Decisions
- Questions
- Dependencies
- Ambiguities
- Confidence

The AI should return structured JSON rather than free-form prose.

---

# 12. AI Prompt Architecture

The AI prompt should contain:

```text
SYSTEM INSTRUCTIONS
        +
TASK DEFINITION
        +
EXTRACTION RULES
        +
MEETING NOTES
        +
OUTPUT JSON SCHEMA
```

Example conceptual prompt:

```text
You are a meeting intelligence extraction system.

Extract only information explicitly supported
by the meeting notes.

Never invent:
- people
- deadlines
- decisions
- priorities
- commitments

If information is unavailable, return null
or mark the item as unassigned/unknown.

For every extracted action provide:
- action
- owner
- deadline
- priority
- confidence
- evidence
```

---

# 13. Structured AI Output

Example:

```json
{
  "summary": "The team discussed the launch timeline.",
  "actions": [
    {
      "action": "Prepare the final API documentation",
      "owner": "Rahul",
      "deadline": "2026-10-10",
      "priority": "high",
      "confidence": 0.94,
      "evidence": "Rahul will prepare the final API documentation by Friday."
    }
  ],
  "decisions": [
    {
      "decision": "The API documentation must be completed before release.",
      "confidence": 0.91,
      "evidence": "We will not release until the API documentation is complete."
    }
  ],
  "questions": [],
  "ambiguities": []
}
```

---

# 14. AI Verification Architecture

The system uses a second verification stage.

```text
AI Extraction
      ↓
Extracted Facts
      ↓
Verification
      ↓
Compare against original notes
      ↓
┌──────────────────────────────┐
│ Supported?                   │
│                              │
│ YES → Accept                 │
│ NO  → Flag                   │
│ CONFLICT → Flag             │
└──────────────────────────────┘
```

Verification checks:

### 14.1 Evidence Support

Does the original text support the extracted information?

### 14.2 Owner Verification

Was the owner explicitly mentioned?

### 14.3 Deadline Verification

Was the deadline actually present?

### 14.4 Decision Verification

Was the statement actually a decision?

### 14.5 Conflict Detection

Does the meeting contain contradictory information?

---

# 15. Hallucination Prevention

MeetingOS follows strict extraction rules.

### Rule 1

Never invent an owner.

Bad:

```text
Action: Deploy application
Owner: Rahul
```

when Rahul was never mentioned.

Correct:

```text
Action: Deploy application
Owner: Unassigned
```

### Rule 2

Never invent deadlines.

Bad:

```text
Deadline: Friday
```

when no deadline exists.

Correct:

```text
Deadline: null
```

### Rule 3

Never convert discussion into a decision.

### Rule 4

Never convert suggestions into commitments.

### Rule 5

Every important extracted fact should have supporting evidence.

---

# 16. Confidence Architecture

Each AI-generated entity receives a confidence score.

Example:

```text
0.90 - 1.00 → High
0.70 - 0.89 → Medium
0.00 - 0.69 → Low
```

Confidence is not treated as truth.

A high confidence score does not override missing evidence.

The verification layer remains authoritative.

---

# 17. Evidence Architecture

Evidence is stored separately from extracted entities.

Example:

```text
Action
  │
  └── Action Evidence
          │
          ├── Source text
          ├── Start offset
          ├── End offset
          └── Confidence
```

This allows the application to answer:

> "Why did the AI create this action?"

without relying on the model's explanation alone.

---

# 18. Dependency Architecture

Actions can depend on other actions.

Example:

```text
Action A
"Finalize API design"
       │
       ▼
Action B
"Implement API"
       │
       ▼
Action C
"Test API"
```

Database relationship:

```text
source_action_id
        ↓
relationship
        ↓
target_action_id
```

Supported relationships may include:

- `blocks`
- `depends_on`
- `requires`
- `follows`

The frontend visualizes these relationships using React Flow.

---

# 19. Action Lifecycle

Actions follow:

```text
TODO
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

A task may also be:

```text
BLOCKED
```

Possible lifecycle:

```text
                 ┌──────────────┐
                 │     TODO     │
                 └──────┬───────┘
                        │
                        ▼
                ┌──────────────┐
                │ IN_PROGRESS  │
                └──────┬───────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
          ┌───────────┐  ┌─────────┐
          │ COMPLETED │  │ BLOCKED │
          └───────────┘  └─────────┘
```

---

# 20. Overdue Detection

Overdue status does not need to be permanently stored.

It can be calculated:

```text
deadline < current_time
AND
status != completed
```

This avoids stale derived data.

---

# 21. Meeting History

Every meeting is stored independently.

```text
Meeting 1
   │
   ├── Actions
   ├── Decisions
   └── Questions

Meeting 2
   │
   ├── Actions
   ├── Decisions
   └── Questions
```

Historical comparison can be performed by querying previous meetings.

---

# 22. Database Architecture

Primary database:

```text
PostgreSQL
```

Core tables:

```text
users
meetings
meeting_sources
actions
action_evidence
decisions
decision_evidence
questions
dependencies
verification_results
```

Optional:

```text
meeting_embeddings
```

if semantic historical search is implemented.

---

# 23. Database Access Layer

The application uses `pg`.

Example:

```js
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
```

Query example:

```js
const result = await pool.query(
  `
  SELECT *
  FROM actions
  WHERE meeting_id = $1
  ORDER BY created_at DESC
  `,
  [meetingId]
);

return result.rows;
```

Always use parameterized queries.

Never construct SQL using raw user input.

---

# 24. Database Transaction Strategy

Meeting processing involves multiple inserts.

For example:

```text
Create Meeting
    ↓
Insert Actions
    ↓
Insert Evidence
    ↓
Insert Decisions
    ↓
Insert Questions
    ↓
Insert Dependencies
    ↓
Insert Verification Results
```

These operations should use a PostgreSQL transaction.

```text
BEGIN
   ↓
Insert data
   ↓
All successful?
   ├── YES → COMMIT
   └── NO  → ROLLBACK
```

This prevents partially processed meetings.

---

# 25. API Architecture

Base URL:

```text
/api
```

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Meetings

```http
POST   /api/meetings
GET    /api/meetings
GET    /api/meetings/:id
DELETE /api/meetings/:id
```

## Meeting Processing

```http
POST /api/meetings/:id/process
POST /api/meetings/:id/reprocess
```

## Actions

```http
GET   /api/meetings/:id/actions
PATCH /api/actions/:id
DELETE /api/actions/:id
```

## Decisions

```http
GET /api/meetings/:id/decisions
```

## Questions

```http
GET /api/meetings/:id/questions
```

## Dependencies

```http
GET /api/meetings/:id/dependencies
```

## Export

```http
GET /api/meetings/:id/export
```

---

# 26. API Response Format

Use a consistent structure.

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Meeting processed successfully"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "MEETING_NOT_FOUND",
    "message": "Meeting not found"
  }
}
```

---

# 27. Authentication Architecture

Authentication uses JWT.

```text
Login
  ↓
Validate credentials
  ↓
Compare password with bcrypt
  ↓
Generate JWT
  ↓
Client stores token
  ↓
Request includes:
Authorization: Bearer <token>
```

Middleware:

```text
Request
  ↓
Extract JWT
  ↓
Verify JWT
  ↓
Get user ID
  ↓
Attach user to req
  ↓
Controller
```

---

# 28. Authorization

Every meeting-related query must verify ownership.

Example:

```sql
SELECT *
FROM meetings
WHERE id = $1
AND user_id = $2;
```

The API must never allow a user to access another user's meetings simply by changing an ID in the URL.

---

# 29. File Upload Architecture

Supported formats:

```text
.txt
.pdf
.docx
```

Flow:

```text
File Upload
     ↓
Multer
     ↓
Validate MIME type
     ↓
Validate file size
     ↓
Extract text
     ↓
Store metadata
     ↓
Process extracted text
```

The system should preserve:

- Original filename
- File type
- File size
- Extracted text
- Upload timestamp

---

# 30. Multilingual Architecture

The extraction pipeline should not assume English-only input.

```text
Meeting Notes
     ↓
Language Detection
     ↓
Qualcomm Cloud AI
     ↓
Language-aware extraction
     ↓
Structured JSON
```

The database should use UTF-8 compatible PostgreSQL encoding.

---

# 31. Privacy Architecture

Meeting notes can contain sensitive information.

The system should:

- Protect notes using authenticated access.
- Never expose one user's meetings to another user.
- Avoid logging full meeting content.
- Avoid logging passwords or tokens.
- Keep API keys in environment variables.
- Validate uploaded files.
- Limit upload sizes.
- Sanitize user-generated data.

---

# 32. Environment Configuration

`.env` should contain secrets and environment-specific configuration.

Example:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=postgresql://username:password@host:5432/meetingos

JWT_SECRET=your_secret

JWT_EXPIRES_IN=7d

QUALCOMM_AI_BASE_URL=your_base_url
QUALCOMM_AI_API_KEY=your_api_key

MAX_FILE_SIZE_MB=10
```

Never commit `.env`.

Commit only:

```text
.env.example
```

---

# 33. External AI Integration

The AI service should be isolated.

```text
services/
└── aiService.js
```

The rest of the application should not directly call Qualcomm Cloud AI.

Example architecture:

```text
meetingController
       ↓
meetingService
       ↓
extractionService
       ↓
aiService
       ↓
Qualcomm Cloud AI
```

This makes the AI provider replaceable without rewriting the entire backend.

---

# 34. AI Service Responsibilities

`aiService.js` should handle:

1. Authentication with Qualcomm Cloud AI
2. Request construction
3. Prompt creation
4. API request
5. Timeout handling
6. Retry handling
7. Response parsing
8. Error handling

It should return normalized structured data.

---

# 35. Extraction Service

`extractionService.js` orchestrates:

```text
Raw Notes
    ↓
Prepare Prompt
    ↓
Call AI
    ↓
Validate JSON
    ↓
Normalize Entities
    ↓
Verification
    ↓
Return Extraction Result
```

---

# 36. Verification Service

`verificationService.js` handles:

- Evidence validation
- Missing evidence
- Unsupported facts
- Conflicting information
- Unassigned owners
- Unresolved commitments
- Confidence evaluation

Output example:

```json
{
  "verified": false,
  "issues": [
    {
      "type": "UNSUPPORTED_DEADLINE",
      "message": "The extracted deadline was not supported by the source text."
    }
  ]
}
```

---

# 37. Error Handling Architecture

Errors should be handled centrally.

```text
Route
 ↓
Controller
 ↓
Service
 ↓
throw Error
 ↓
Error Middleware
 ↓
HTTP Response
```

Example categories:

```text
400 → Bad Request
401 → Unauthorized
403 → Forbidden
404 → Not Found
409 → Conflict
422 → Validation Error
429 → Rate Limited
500 → Internal Server Error
502 → External AI Failure
```

---

# 38. AI Failure Handling

If Qualcomm Cloud AI fails:

```text
AI Request
    ↓
Failure
    ↓
Retry if appropriate
    ↓
Still failing?
    ↓
Return controlled error
```

The application must not create fake AI output when the AI service fails.

---

# 39. Timeout Strategy

External AI calls should have a timeout.

Conceptually:

```js
axios.post(url, payload, {
  timeout: 30000
});
```

The exact timeout should be tuned based on Qualcomm Cloud AI response characteristics.

---

# 40. Retry Strategy

Retry only transient failures.

Potential retry cases:

- Temporary network failure
- HTTP 429
- Temporary 5xx response

Do not blindly retry:

- Invalid API key
- Invalid request
- Invalid prompt/schema
- Authentication errors

---

# 41. Frontend Architecture

```text
client/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   ├── types/
│   ├── App.jsx
│   └── main.jsx
```

---

# 42. Main Frontend Pages

Recommended pages:

```text
/login
/register
/dashboard
/meetings
/meetings/:id
/meetings/:id/actions
/meetings/:id/graph
```

---

# 43. Meeting Detail UI

The meeting page can contain:

```text
┌───────────────────────────────────────┐
│ Meeting Title                         │
├───────────────────────────────────────┤
│ AI Summary                            │
├───────────────────────────────────────┤
│ Action Items                          │
│                                       │
│ □ Prepare documentation               │
│   Owner: Rahul                        │
│   Due: Oct 10                         │
│   Priority: High                      │
├───────────────────────────────────────┤
│ Decisions                             │
├───────────────────────────────────────┤
│ Questions / Discussion                │
├───────────────────────────────────────┤
│ Dependencies                          │
└───────────────────────────────────────┘
```

---

# 44. Dependency Graph

React Flow can represent:

```text
[Design API]
      │
      ▼
[Implement API]
      │
      ▼
[Test API]
```

Nodes represent actions.

Edges represent dependencies.

The graph should be generated from database dependency relationships.

---

# 45. Ask My Meetings

If implemented, the system can provide a meeting question interface.

Example:

```text
User:
"What decisions were made about the API?"

        ↓

Backend
        ↓

Retrieve relevant meeting data
        ↓

AI / structured reasoning
        ↓

Answer with supporting meeting context
```

For the initial implementation, structured PostgreSQL queries can be used before introducing a vector/RAG architecture.

---

# 46. Optional Semantic Search

If semantic historical search is needed:

```text
Meeting Text
     ↓
Embedding Model
     ↓
Vector
     ↓
pgvector
     ↓
Similarity Search
     ↓
Relevant Meetings
```

This is optional and should not be required for the basic architecture.

---

# 47. Caching

Caching is not mandatory for the MVP.

Potential future cache:

```text
Redis
```

Useful for:

- Frequently requested meeting data
- AI request deduplication
- Rate limiting
- Temporary processing state

For the hackathon MVP, PostgreSQL is sufficient.

---

# 48. Background Processing

For small meeting notes:

```text
HTTP Request
   ↓
Process AI
   ↓
Response
```

For larger files or production-scale workloads:

```text
HTTP Request
   ↓
Create Processing Job
   ↓
Queue
   ↓
Worker
   ↓
Qualcomm AI
   ↓
Database
   ↓
Frontend polls/status updates
```

A queue such as BullMQ + Redis can be introduced later.

It is not necessary for the initial hackathon version.

---

# 49. Scalability Strategy

The architecture can scale horizontally.

```text
                Load Balancer
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      Node API    Node API    Node API
          │          │          │
          └──────────┼──────────┘
                     ▼
                PostgreSQL
```

Because the API layer is stateless, multiple backend instances can run simultaneously.

JWT authentication supports stateless authentication.

---

# 50. Database Connection Pooling

`pg.Pool` should be used rather than opening a new database connection for every request.

Conceptually:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});
```

The exact pool size depends on deployment resources and PostgreSQL limits.

---

# 51. Security Architecture

Security layers:

```text
HTTPS
  ↓
JWT Authentication
  ↓
Authorization
  ↓
Input Validation
  ↓
Parameterized SQL
  ↓
File Validation
  ↓
Secure Environment Variables
  ↓
Database Access Controls
```

Important protections:

- Password hashing
- JWT validation
- SQL injection prevention
- File upload validation
- Request validation
- Authorization checks
- Rate limiting
- CORS configuration
- Secure headers

---

# 52. SQL Injection Prevention

Never do:

```js
const query = `
  SELECT *
  FROM users
  WHERE email = '${email}'
`;
```

Use:

```js
const query = `
  SELECT *
  FROM users
  WHERE email = $1
`;

const result = await pool.query(query, [email]);
```

All user-provided values must be parameterized.

---

# 53. Logging

Use structured logs for:

- Server startup
- API errors
- AI failures
- Database errors
- Authentication failures
- Processing status

Do not log:

- Passwords
- JWT tokens
- API keys
- Full meeting notes
- Sensitive personal information

---

# 54. Deployment Architecture

Recommended hackathon deployment:

```text
              Internet
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 React Frontend        Express Backend
        │                   │
        │                   ├──── Qualcomm Cloud AI
        │                   │
        │                   └──── PostgreSQL
        │
        └──── HTTPS API ────┘
```

Possible deployment choices:

### Frontend

- Vercel

### Backend

- Render
- Railway
- Fly.io
- Cloud platform compatible with Node.js

### Database

- Neon
- Supabase PostgreSQL
- Railway PostgreSQL
- Other managed PostgreSQL provider

The exact provider can be chosen based on hackathon requirements.

---

# 55. Environment Separation

Use separate environments:

```text
Development
     ↓
Testing
     ↓
Production
```

Each environment should have its own:

- Database
- API credentials
- JWT secret
- Configuration

---

# 56. Testing Architecture

Testing should cover:

## Unit Tests

Test:

- Text normalization
- Date parsing
- Confidence classification
- Validation
- Business logic

## Integration Tests

Test:

```text
API
 ↓
Service
 ↓
PostgreSQL
```

## AI Integration Tests

Test:

```text
Meeting Notes
 ↓
Qualcomm AI
 ↓
Structured Output
 ↓
Validation
```

## API Tests

Test:

- Authentication
- Meeting creation
- Meeting retrieval
- Action updates
- Authorization
- Error cases

---

# 57. AI Test Cases

The system should be tested against difficult notes.

### Case 1 — Missing Owner

```text
Someone should update the documentation.
```

Expected:

```text
owner = Unassigned
```

### Case 2 — Missing Deadline

```text
Rahul will update the documentation.
```

Expected:

```text
owner = Rahul
deadline = null
```

### Case 3 — Suggestion

```text
We could deploy this next week.
```

Expected:

```text
Not necessarily an action.
```

### Case 4 — Decision

```text
Let's use PostgreSQL for the project.
```

Expected:

```text
Decision = PostgreSQL will be used.
```

### Case 5 — Conflict

```text
The deadline is Friday.
Later:
Actually, let's make it Monday.
```

Expected:

```text
Conflict detected
```

---

# 58. Data Flow Example

Input:

```text
Meeting Notes:

Rahul will finish the API documentation by Friday.
Priya suggested using PostgreSQL.
The team agreed to use PostgreSQL.
Someone should test the API after documentation is complete.
```

AI extraction:

```text
Action 1
---------
Action: Finish API documentation
Owner: Rahul
Deadline: Friday

Decision
--------
Use PostgreSQL

Action 2
---------
Action: Test API
Owner: Unassigned
Dependency:
  API documentation
```

Verification:

```text
Action 1 → Supported
Decision → Supported
Action 2 → Supported
Owner → Unassigned
```

Database:

```text
meetings
   │
   ├── actions
   │     ├── action_evidence
   │     └── dependencies
   │
   ├── decisions
   │     └── decision_evidence
   │
   └── verification_results
```

---

# 59. Data Ownership

Every user-owned entity should be traceable to a user.

```text
User
 │
 └── Meetings
       │
       ├── Actions
       ├── Decisions
       ├── Questions
       └── Sources
```

This makes authorization and deletion easier.

---

# 60. Deletion Strategy

Deleting a meeting should remove its dependent records where appropriate.

Conceptually:

```text
Meeting
  ↓
Actions
  ↓
Evidence
  ↓
Dependencies
  ↓
Verification
```

Foreign keys should use appropriate cascade behavior for dependent records.

User deletion should be handled carefully because it may require deleting all associated meeting data.

---

# 61. Auditability

The architecture should preserve the difference between:

```text
Original AI extraction
        ↓
Verification result
        ↓
User correction
        ↓
Current value
```

For example:

```text
AI Owner:
Rahul

User Owner:
Priya
```

The system should not silently overwrite the original AI result.

This allows the application to understand what the AI originally extracted.

---

# 62. Observability

Important metrics:

- API response time
- AI response time
- AI failures
- Database query failures
- Meeting processing success rate
- Validation failures

Do not collect unnecessary sensitive meeting content for observability.

---

# 63. Performance Considerations

Important optimizations:

1. PostgreSQL connection pooling
2. Proper database indexes
3. Pagination for meeting history
4. Avoid unnecessary AI calls
5. Limit uploaded file size
6. Avoid sending excessive duplicate context to AI
7. Use database transactions
8. Use asynchronous processing for large workloads

---

# 64. API Versioning

For future compatibility:

```text
/api/v1/meetings
/api/v1/actions
```

The MVP can begin with:

```text
/api
```

and move to versioning when the API becomes stable.

---

# 65. Core Architectural Principle

MeetingOS should maintain a strict separation:

```text
Original Data
     ↓
AI Interpretation
     ↓
Verification
     ↓
User-Corrected Data
```

Never treat AI output as unquestionable truth.

---

# 66. MVP Architecture

For the hackathon, the minimum architecture should be:

```text
React
  ↓
Express.js
  ↓
PostgreSQL
  ↓
Qualcomm Cloud AI
```

With:

- JWT authentication
- Meeting ingestion
- AI summary
- Action extraction
- Owner extraction
- Deadline extraction
- Priority extraction
- Decision extraction
- Evidence
- Confidence
- Verification
- Action dashboard
- Dependency graph
- Meeting history
- Export

Avoid introducing unnecessary infrastructure such as Redis, Kafka, microservices, Kubernetes, or separate AI workers unless the project actually needs them.

---

# 67. Recommended Development Order

## Phase 1 — Backend Foundation

```text
Initialize Node.js
↓
Install Express
↓
Configure environment
↓
Configure PostgreSQL
↓
Create schema
↓
Create database connection
```

## Phase 2 — Authentication

```text
Register
↓
Login
↓
JWT
↓
Protected routes
```

## Phase 3 — Meeting Management

```text
Create meeting
↓
Save notes
↓
Fetch meeting
↓
Meeting history
```

## Phase 4 — Qualcomm AI

```text
AI service
↓
Prompt
↓
Qualcomm API
↓
Structured JSON
```

## Phase 5 — Extraction

```text
Summary
Actions
Owners
Deadlines
Priorities
Decisions
Questions
Dependencies
```

## Phase 6 — Verification

```text
Evidence
↓
Confidence
↓
Hallucination checks
↓
Conflict checks
```

## Phase 7 — Dashboard

```text
Meeting details
↓
Actions
↓
Decisions
↓
Dependencies
```

## Phase 8 — Advanced Features

```text
Multilingual support
Ask My Meetings
Semantic search
Export improvements
```

---

# 68. Architecture Decision Summary

| Decision | Choice | Reason |
|---|---|---|
| Frontend | React | Familiar and flexible |
| Styling | Tailwind CSS | Fast UI development |
| Backend | Node.js | JavaScript ecosystem |
| API | Express.js | Simple REST architecture |
| ORM | None | Avoid unnecessary abstraction |
| DB Driver | `pg` | Direct PostgreSQL access |
| Database | PostgreSQL | Relational structured data |
| Validation | Zod | Runtime schema validation |
| Auth | JWT | Stateless authentication |
| Password hashing | bcrypt | Secure password storage |
| AI | Qualcomm Cloud AI | Mandatory platform requirement |
| File upload | Multer | Express-compatible uploads |
| Graph | React Flow | Dependency visualization |
| Vector DB | pgvector | Optional semantic search |
| Cache | None initially | Not required for MVP |
| Queue | None initially | Not required for MVP |
| Deployment | Managed Node + PostgreSQL | Simple hackathon deployment |

---

# 69. Final Architecture

```text
                              USER
                                │
                                ▼
                     ┌────────────────────┐
                     │   React Frontend   │
                     │   Tailwind CSS     │
                     └─────────┬──────────┘
                               │ HTTPS
                               ▼
                     ┌────────────────────┐
                     │    Express.js      │
                     │     REST API       │
                     └─────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌─────────────┐  ┌──────────────┐
       │    Auth    │   │   Meeting   │  │    Action    │
       │  Service   │   │   Service   │  │   Service    │
       └────────────┘   └──────┬──────┘  └──────────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ Extraction Service │
                     └─────────┬──────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │    AI Service      │
                     └─────────┬──────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │   Qualcomm Cloud AI      │
                  └────────────┬─────────────┘
                               │
                        Structured JSON
                               │
                               ▼
                  ┌──────────────────────────┐
                  │  Zod Validation          │
                  └────────────┬─────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │ Verification Service      │
                  └────────────┬─────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │ PostgreSQL + pg           │
                  └────────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
          Meetings          Actions         Decisions
              │                │                │
              ▼                ▼                ▼
           Sources          Evidence       Evidence
                               │
                               ▼
                         Dependencies
                               │
                               ▼
                     ┌────────────────────┐
                     │ React Flow Graph   │
                     └────────────────────┘
```

---

# 70. Final Technical Principle

The architecture intentionally favors **simplicity, traceability, and reliability** over unnecessary infrastructure.

The core system is:

```text
React
  ↓
Express.js
  ↓
Services
  ↓
Qualcomm Cloud AI
  ↓
Verification
  ↓
PostgreSQL
```

There is no requirement for Prisma, microservices, Redis, Kafka, Kubernetes, or a complex distributed architecture for the initial implementation.

The most important architectural requirement is:

> **Every important AI-generated meeting fact should be traceable back to the original meeting notes, and unsupported information must never be presented as fact.**
