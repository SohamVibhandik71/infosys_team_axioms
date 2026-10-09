# API Specification

## 1. Overview

MeetingOS exposes a REST API built with:

- Node.js
- Express.js
- JavaScript
- PostgreSQL
- `pg` for database access
- JWT authentication
- Zod validation
- Qualcomm Cloud AI for AI inference

The API is the contract between the React frontend and the backend.

### Base URL

Development:

```text
http://localhost:5000/api
```

Production:

```text
<production-api-url>/api
```

All protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 2. API Design Principles

1. Use REST-style resource URLs.
2. Use JSON for normal request/response bodies.
3. Use `multipart/form-data` for file uploads.
4. Validate request data with Zod.
5. Use parameterized PostgreSQL queries through `pg`.
6. Never expose database credentials or AI credentials to the frontend.
7. AI-generated information must pass validation and verification before being stored as trusted meeting data.
8. Never invent owners, deadlines, priorities, decisions, commitments, or evidence.
9. Return consistent HTTP status codes.
10. Keep Qualcomm Cloud AI integration isolated inside the AI service.

---

# 3. Standard Response Format

Successful responses should follow a consistent structure.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {}
  }
}
```

The exact response shape may be simplified for endpoints where a different structure is more appropriate, but the API should remain consistent.

---

# 4. HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | Successful request |
| `201` | Resource created |
| `204` | Successful request with no response body |
| `400` | Bad request |
| `401` | Authentication required/invalid |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Conflict |
| `413` | Uploaded file too large |
| `422` | Validation failure |
| `500` | Internal server error |
| `502` | External AI/service failure |
| `503` | Service temporarily unavailable |

---

# 5. Authentication API

## 5.1 Register

```http
POST /api/auth/register
```

### Request

```json
{
  "name": "Soham",
  "email": "soham@example.com",
  "password": "StrongPassword123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Soham",
      "email": "soham@example.com"
    },
    "token": "<jwt>"
  },
  "message": "Registration successful"
}
```

### Validation

- Name required
- Valid email required
- Password required
- Password must satisfy configured security requirements
- Email must be unique

---

# 6. Login

```http
POST /api/auth/login
```

### Request

```json
{
  "email": "soham@example.com",
  "password": "StrongPassword123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Soham",
      "email": "soham@example.com"
    },
    "token": "<jwt>"
  },
  "message": "Login successful"
}
```

---

# 7. Get Current User

```http
GET /api/auth/me
```

### Authentication

Required.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Soham",
    "email": "soham@example.com"
  }
}
```

---

# 8. Meetings API

## 8.1 Create Meeting

```http
POST /api/meetings
```

### Authentication

Required.

### Request

```json
{
  "title": "Sprint Planning",
  "meetingDate": "2026-10-06T10:00:00Z",
  "notes": "John will prepare the API documentation by Friday..."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "uuid",
      "title": "Sprint Planning",
      "meetingDate": "2026-10-06T10:00:00Z",
      "status": "created"
    }
  },
  "message": "Meeting created successfully"
}
```

---

# 9. Create Meeting From File

```http
POST /api/meetings/upload
```

### Authentication

Required.

### Content Type

```http
multipart/form-data
```

### Form Fields

| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `meetingDate` | ISO date | No |
| `file` | file | Yes |

Supported formats:

- `.txt`
- `.pdf`
- `.docx`

### Processing Flow

```text
Upload
  ↓
Validate File
  ↓
Extract Text
  ↓
Create Meeting
  ↓
AI Processing
```

### Response

```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "uuid",
      "title": "Sprint Planning",
      "status": "created"
    }
  }
}
```

---

# 10. Get Meetings

```http
GET /api/meetings
```

### Authentication

Required.

### Optional Query Parameters

```text
?page=1
&limit=20
&search=sprint
&sortBy=meetingDate
&order=desc
```

### Response

```json
{
  "success": true,
  "data": {
    "meetings": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

---

# 11. Get Meeting

```http
GET /api/meetings/:meetingId
```

### Authentication

Required.

### Response

The response should include the meeting and its associated structured information.

```json
{
  "success": true,
  "data": {
    "meeting": {},
    "actions": [],
    "decisions": [],
    "questions": [],
    "dependencies": [],
    "verification": {}
  }
}
```

---

# 12. Update Meeting

```http
PATCH /api/meetings/:meetingId
```

### Request

```json
{
  "title": "Updated Sprint Planning",
  "meetingDate": "2026-10-06T11:00:00Z"
}
```

Only allowed editable fields should be accepted.

---

# 13. Delete Meeting

```http
DELETE /api/meetings/:meetingId
```

### Authentication

Required.

### Response

```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

Deletion must respect database cascade rules defined in `DATABASE.md`.

---

# 14. AI Meeting Processing

## 14.1 Process Meeting

```http
POST /api/meetings/:meetingId/process
```

### Authentication

Required.

### Purpose

Runs the complete AI extraction pipeline.

```text
Meeting Notes
     ↓
Normalization
     ↓
Qualcomm Cloud AI
     ↓
Structured JSON
     ↓
Zod Validation
     ↓
Normalization
     ↓
Evidence Verification
     ↓
Hallucination Detection
     ↓
Conflict Detection
     ↓
Database
```

### Response

```json
{
  "success": true,
  "data": {
    "meetingId": "uuid",
    "status": "processed",
    "summary": "...",
    "actions": [],
    "decisions": [],
    "questions": [],
    "dependencies": [],
    "verification": {}
  }
}
```

---

# 15. Processing Status

```http
GET /api/meetings/:meetingId/processing
```

### Response

```json
{
  "success": true,
  "data": {
    "status": "processing",
    "progress": 70
  }
}
```

Possible statuses:

```text
created
processing
processed
failed
```

The exact implementation may use synchronous processing initially and can later support background processing.

---

# 16. Action Items API

## 16.1 Get Actions

```http
GET /api/meetings/:meetingId/actions
```

### Response

```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "uuid",
        "description": "Prepare API documentation",
        "owner": "John",
        "deadline": "2026-10-09",
        "priority": "high",
        "status": "todo",
        "confidence": 0.94,
        "needsReview": false
      }
    ]
  }
}
```

---

# 17. Get Single Action

```http
GET /api/actions/:actionId
```

### Response

```json
{
  "success": true,
  "data": {
    "action": {},
    "evidence": [],
    "dependencies": []
  }
}
```

---

# 18. Update Action

```http
PATCH /api/actions/:actionId
```

### Request

```json
{
  "status": "in_progress",
  "priority": "high",
  "deadline": "2026-10-10"
}
```

Allowed lifecycle:

```text
todo
in_progress
completed
blocked
```

The frontend may update user-editable fields. AI-derived original values should remain available for traceability.

---

# 19. Delete Action

```http
DELETE /api/actions/:actionId
```

### Response

```json
{
  "success": true,
  "message": "Action deleted successfully"
}
```

---

# 20. Action Evidence

## Get Action Evidence

```http
GET /api/actions/:actionId/evidence
```

### Response

```json
{
  "success": true,
  "data": {
    "evidence": [
      {
        "id": "uuid",
        "text": "John will prepare the API documentation by Friday.",
        "sourceType": "meeting_notes",
        "startOffset": 125,
        "endOffset": 181
      }
    ]
  }
}
```

Evidence must originate from the meeting source.

---

# 21. Decisions API

## Get Decisions

```http
GET /api/meetings/:meetingId/decisions
```

### Response

```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "uuid",
        "decision": "Use PostgreSQL for the application database.",
        "confidence": 0.97,
        "evidence": []
      }
    ]
  }
}
```

---

# 22. Create/Update Decision

```http
PATCH /api/decisions/:decisionId
```

### Request

```json
{
  "decision": "Use PostgreSQL for the application database."
}
```

User corrections must not overwrite the original evidence.

---

# 23. Questions API

## Get Questions

```http
GET /api/meetings/:meetingId/questions
```

### Response

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "question": "Who will handle deployment?",
        "resolved": false
      }
    ]
  }
}
```

---

# 24. Resolve Question

```http
PATCH /api/questions/:questionId
```

### Request

```json
{
  "resolved": true
}
```

---

# 25. Dependencies API

## Get Dependencies

```http
GET /api/meetings/:meetingId/dependencies
```

### Response

```json
{
  "success": true,
  "data": {
    "dependencies": [
      {
        "id": "uuid",
        "sourceActionId": "action-1",
        "targetActionId": "action-2",
        "relationship": "blocks",
        "confidence": 0.91,
        "evidence": "API documentation must be completed before integration testing."
      }
    ]
  }
}
```

---

# 26. Create Dependency

```http
POST /api/dependencies
```

### Request

```json
{
  "sourceActionId": "action-1",
  "targetActionId": "action-2",
  "relationship": "blocks"
}
```

---

# 27. Delete Dependency

```http
DELETE /api/dependencies/:dependencyId
```

---

# 28. Verification API

## Get Verification Results

```http
GET /api/meetings/:meetingId/verification
```

### Response

```json
{
  "success": true,
  "data": {
    "verification": {
      "status": "needs_review",
      "unsupportedItems": [],
      "conflicts": [],
      "unassignedTasks": [],
      "unresolvedCommitments": []
    }
  }
}
```

The verification result is generated by the backend verification layer after AI extraction.

---

# 29. Ask My Meetings

```http
POST /api/meetings/ask
```

### Authentication

Required.

### Request

```json
{
  "question": "What decisions were made about the database?",
  "meetingIds": [
    "meeting-1",
    "meeting-2"
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "answer": "...",
    "sources": [
      {
        "meetingId": "meeting-1",
        "evidence": "..."
      }
    ]
  }
}
```

The implementation may initially use structured database queries. Semantic/vector retrieval can be introduced later if required.

---

# 30. Meeting Comparison

```http
GET /api/meetings/compare
```

### Query Parameters

```text
?meetingA=<meetingId>
&meetingB=<meetingId>
```

### Response

```json
{
  "success": true,
  "data": {
    "meetingA": {},
    "meetingB": {},
    "comparison": {
      "newActions": [],
      "completedActions": [],
      "changedDecisions": [],
      "newQuestions": []
    }
  }
}
```

Comparison should be derived from stored meeting data rather than requiring a separate comparison table.

---

# 31. Export Meeting Report

```http
GET /api/meetings/:meetingId/export
```

### Optional Query Parameter

```text
?format=json
```

Supported formats may include:

```text
json
pdf
```

Additional export formats can be added later.

### JSON Response

```json
{
  "meeting": {},
  "summary": "...",
  "actions": [],
  "decisions": [],
  "questions": [],
  "dependencies": [],
  "verification": {}
}
```

For PDF exports, the endpoint may return a generated file with the appropriate `Content-Type`.

---

# 32. Authentication Middleware

Protected routes use JWT authentication.

```text
Request
   ↓
Authorization Header
   ↓
JWT Verification
   ↓
User Identification
   ↓
Controller
```

Example:

```http
Authorization: Bearer eyJ...
```

Invalid or missing tokens should return:

```http
401 Unauthorized
```

---

# 33. Authorization

A user must only access meetings and resources that belong to them or that they are explicitly authorized to access.

For example:

```text
User A
  ↓
Meeting A
  ↓
Actions A
```

User B must not be able to access User A's resources by changing an ID in the URL.

This check must happen in the backend, not only in the frontend.

---

# 34. Validation

Every request body should be validated before reaching business logic.

Example:

```js
const createMeetingSchema = z.object({
  title: z.string().min(1),
  meetingDate: z.string().datetime().optional(),
  notes: z.string().min(1)
});
```

Validation failures should return `422` or the project's standardized validation status.

---

# 35. File Upload Validation

Accepted formats:

```text
TXT
PDF
DOCX
```

The backend should validate:

- MIME type
- File extension
- File size
- File presence
- Extracted text availability

Files should never be trusted solely based on their extension.

---

# 36. AI API Boundary

The frontend must never call Qualcomm Cloud AI directly.

Correct:

```text
React
  ↓
Express API
  ↓
AI Service
  ↓
Qualcomm Cloud AI
```

Incorrect:

```text
React
  ↓
Qualcomm Cloud AI
```

AI credentials must remain on the backend.

The Qualcomm integration should be isolated inside something similar to:

```text
src/services/aiService.js
```

The exact Qualcomm endpoint, authentication mechanism, model identifier, and request format must come from the official Qualcomm Cloud AI documentation and must not be invented.

---

# 37. AI Output Contract

The AI service should return structured data rather than free-form text.

Conceptual structure:

```json
{
  "summary": "...",
  "actions": [],
  "decisions": [],
  "questions": [],
  "dependencies": []
}
```

Each extracted item should contain only information supported by the source meeting notes.

Example:

```json
{
  "description": "Prepare API documentation",
  "owner": "John",
  "deadline": "2026-10-09",
  "priority": "high",
  "confidence": 0.94,
  "evidence": "John will prepare the API documentation by Friday."
}
```

If an owner is not supported:

```json
{
  "description": "Prepare the API documentation",
  "owner": null,
  "needsReview": true
}
```

The AI must not guess.

---

# 38. Error Handling

Errors should be handled centrally through Express middleware.

Example:

```js
app.use(errorHandler);
```

Internal errors should be logged server-side.

Sensitive information must not be returned to the client.

Do not return:

- Database connection strings
- JWT secrets
- Qualcomm API keys
- Stack traces in production
- Internal infrastructure details

---

# 39. API Folder Structure

Recommended backend structure:

```text
server/
└── src/
    ├── config/
    │   ├── db.js
    │   └── env.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── meetingController.js
    │   ├── actionController.js
    │   ├── decisionController.js
    │   ├── questionController.js
    │   └── dependencyController.js
    │
    ├── middleware/
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   └── uploadMiddleware.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── meetingRoutes.js
    │   ├── actionRoutes.js
    │   ├── decisionRoutes.js
    │   ├── questionRoutes.js
    │   └── dependencyRoutes.js
    │
    ├── services/
    │   ├── aiService.js
    │   ├── meetingService.js
    │   ├── extractionService.js
    │   ├── verificationService.js
    │   └── exportService.js
    │
    ├── validators/
    │   ├── authValidators.js
    │   ├── meetingValidators.js
    │   └── actionValidators.js
    │
    ├── db/
    │   └── queries/
    │
    └── app.js
```

---

# 40. Frontend API Integration

The React application should communicate with the backend through a centralized API client.

Example:

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export default api;
```

API calls should be organized into services:

```text
src/services/
├── authApi.js
├── meetingApi.js
├── actionApi.js
├── decisionApi.js
├── questionApi.js
└── dependencyApi.js
```

The frontend should not contain raw database queries or Qualcomm API calls.

---

# 41. API Security Checklist

- [ ] JWT authentication implemented
- [ ] Passwords hashed with bcrypt
- [ ] Protected routes use authentication middleware
- [ ] Ownership checks implemented
- [ ] Zod validation implemented
- [ ] Parameterized SQL queries used
- [ ] File uploads validated
- [ ] File size limits configured
- [ ] Secrets stored in environment variables
- [ ] AI credentials never exposed to frontend
- [ ] Production errors do not expose stack traces
- [ ] CORS configured correctly
- [ ] Rate limiting considered for public/auth endpoints

---

# 42. API Implementation Priority

## Phase 1 — Foundation

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

## Phase 2 — Meetings

```text
POST   /meetings
POST   /meetings/upload
GET    /meetings
GET    /meetings/:meetingId
PATCH  /meetings/:meetingId
DELETE /meetings/:meetingId
```

## Phase 3 — AI Processing

```text
POST /meetings/:meetingId/process
GET  /meetings/:meetingId/processing
GET  /meetings/:meetingId/verification
```

## Phase 4 — Structured Data

```text
GET   /meetings/:meetingId/actions
GET   /actions/:actionId
PATCH /actions/:actionId

GET   /meetings/:meetingId/decisions
PATCH /decisions/:decisionId

GET   /meetings/:meetingId/questions
PATCH /questions/:questionId
```

## Phase 5 — Dependencies

```text
GET    /meetings/:meetingId/dependencies
POST   /dependencies
DELETE /dependencies/:dependencyId
```

## Phase 6 — Advanced Features

```text
POST /meetings/ask
GET  /meetings/compare
GET  /meetings/:meetingId/export
```

---

# 43. Example Complete Flow

A typical user flow:

```text
1. Register
      ↓
2. Login
      ↓
3. Create Meeting
      ↓
4. Upload / Enter Notes
      ↓
5. Process Meeting
      ↓
6. Express sends notes to AI Service
      ↓
7. AI Service calls Qualcomm Cloud AI
      ↓
8. Structured AI response returned
      ↓
9. Zod validates response
      ↓
10. Verification Service checks evidence
      ↓
11. Conflicts / ambiguities identified
      ↓
12. Transaction stores results in PostgreSQL
      ↓
13. Frontend retrieves meeting results
      ↓
14. User reviews / edits actions
      ↓
15. User tracks action lifecycle
```

---

# 44. API Contract Rules for Development

When implementing an endpoint:

1. Define the route.
2. Define request validation.
3. Define authentication requirements.
4. Implement controller.
5. Implement service/business logic.
6. Implement parameterized database queries.
7. Define success response.
8. Define error responses.
9. Test the endpoint.
10. Update this document if the public API contract changes.

Do not silently change request or response structures after frontend integration.

---

# 45. Final API Principle

The API should keep a clean separation:

```text
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Database / External Services
```

The API is responsible for:

- Authentication
- Authorization
- Validation
- Meeting management
- AI processing orchestration
- Verification
- Action management
- Decision management
- Question management
- Dependency management
- Historical meeting access
- Export

The API must **not** allow unsupported AI claims to become trusted application data.

> **Evidence before confidence.**
>
> If the meeting notes do not support a fact, the API should preserve that uncertainty instead of presenting an AI guess as truth.
