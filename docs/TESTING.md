# Testing Strategy

## 1. Purpose

This document defines the testing strategy for MeetingOS.

The goal is to verify that:

- The application works correctly.
- APIs behave according to the API contract.
- Database operations are reliable.
- Authentication and authorization are secure.
- AI extraction produces structured information.
- AI-generated information is validated and verified.
- Unsupported claims are not treated as facts.
- The frontend correctly represents backend state.
- Critical user flows work end-to-end.

The most important testing principle for MeetingOS is:

> **AI output must be tested for correctness and evidence support, not only whether an API call succeeds.**

---

# 2. Testing Pyramid

MeetingOS should use multiple levels of testing.

```text
                 E2E Tests
                    ▲
                    │
             Integration Tests
                    ▲
                    │
              API / Service Tests
                    ▲
                    │
               Unit Tests
                    ▲
                    │
            Validation / Utilities
```

The project should prioritize fast unit and service tests while maintaining a smaller number of complete end-to-end tests.

---

# 3. Testing Areas

Testing should cover:

```text
Frontend
Backend
Database
Authentication
Authorization
File Processing
AI Extraction
AI Validation
AI Verification
Actions
Decisions
Questions
Dependencies
Meeting History
Export
Error Handling
Security
```

---

# 4. Test Environment

Tests should run against a dedicated test environment.

Do not run destructive automated tests against the production database.

Recommended conceptual setup:

```text
Development Database
        │
        ├── Development work
        │
        └── Manual testing

Test Database
        │
        └── Automated tests

Production Database
        │
        └── Real application
```

For database integration tests, use a dedicated PostgreSQL database.

---

# 5. Testing Stack

The exact testing libraries can be selected during implementation, but the backend should support:

- Node.js test runner or Jest/Vitest
- Supertest or equivalent HTTP testing library
- Zod schema tests
- PostgreSQL integration tests
- Mocked external AI calls

Frontend tests should use a React-compatible testing framework and browser testing where appropriate.

The testing framework should not change the mandatory application architecture.

---

# 6. Unit Testing

Unit tests verify individual functions without requiring the complete application.

Examples:

```text
normalizeMeetingText()
normalizeDeadline()
calculateOverdueStatus()
validateAction()
buildExtractionPrompt()
parseAIResponse()
```

Example:

```js
describe("normalizeMeetingText", () => {
  it("normalizes repeated whitespace", () => {
    // test
  });
});
```

Unit tests should be:

- Fast
- Deterministic
- Isolated
- Easy to debug

---

# 7. Validation Tests

All Zod schemas should have tests.

Test:

```text
Valid input
Missing required fields
Invalid types
Invalid enum values
Invalid dates
Invalid confidence
Null optional values
Unexpected fields
```

Example:

```text
confidence = 0.95
→ valid

confidence = 1.4
→ invalid

confidence = -0.2
→ invalid
```

---

# 8. Authentication Tests

Authentication is a critical backend area.

Test:

### Registration

```text
Valid registration
Duplicate email
Invalid email
Missing password
Weak password
Missing name
```

### Login

```text
Valid credentials
Wrong password
Unknown email
Missing credentials
Malformed request
```

### JWT

```text
Valid token
Expired token
Malformed token
Missing token
Invalid signature
```

Expected behavior for an invalid protected request:

```http
401 Unauthorized
```

---

# 9. Authorization Tests

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to access this resource?

Test resource ownership.

Example:

```text
User A
 └── Meeting A

User B
 └── Meeting B
```

User B must not be able to:

```text
GET Meeting A
UPDATE Meeting A
DELETE Meeting A
GET Meeting A actions
GET Meeting A evidence
```

Changing an ID in the URL must never bypass authorization.

---

# 10. Meeting API Tests

Test:

```text
Create meeting
Get meeting
List meetings
Update meeting
Delete meeting
```

### Create Meeting

Test:

```text
Valid notes
Empty title
Empty notes
Invalid meeting date
Missing authentication
```

### Get Meeting

Test:

```text
Existing meeting
Non-existing meeting
Unauthorized meeting
Malformed ID
```

### Delete Meeting

Test:

```text
Existing owned meeting
Non-existing meeting
Unauthorized meeting
Cascade behavior
```

---

# 11. File Upload Tests

Supported formats:

```text
TXT
PDF
DOCX
```

Test:

```text
Valid TXT
Valid PDF
Valid DOCX
Unsupported file
Missing file
Oversized file
Invalid MIME type
Corrupted file
Empty file
File with no extractable text
```

The backend must validate uploads rather than trusting the filename.

---

# 12. Text Extraction Tests

Test that supported files produce usable text.

Examples:

```text
TXT → extracted text
PDF → extracted text
DOCX → extracted text
```

Test extraction failures:

```text
Corrupted PDF
Image-only PDF
Malformed DOCX
Empty document
Unsupported encoding
```

If the document cannot produce meaningful text, AI processing should not proceed blindly.

---

# 13. AI Service Tests

The real Qualcomm AI service should not be called for every automated test.

Use a mocked AI response for deterministic testing.

Example:

```text
Meeting Service
      ↓
Extraction Service
      ↓
Mock AI Service
      ↓
Known JSON response
```

This allows tests to verify application behavior independently of network availability or provider availability.

---

# 14. Qualcomm Integration Tests

A smaller set of integration tests can verify the actual provider integration.

Test:

```text
Valid credentials
Valid model
Valid request
Provider response
Provider error
Timeout
Invalid authentication
Unavailable service
Malformed provider response
```

These tests should be controlled carefully because external AI calls may have rate limits or usage implications.

Never commit API credentials into the test suite.

---

# 15. AI Extraction Tests

AI extraction is one of the most important testing areas.

Test extraction of:

```text
Actions
Owners
Deadlines
Priorities
Decisions
Questions
Dependencies
Evidence
Confidence
Ambiguity
```

---

# 16. Action Extraction Test

### Input

```text
John will prepare the API documentation.
```

### Expected

```text
Action:
Prepare the API documentation

Owner:
John
```

The exact output schema should follow the implementation schema.

---

# 17. Deadline Extraction Test

### Input

```text
John will prepare the API documentation by Friday.
```

### Expected

```text
Action:
Prepare the API documentation

Owner:
John

Deadline:
Friday
```

The normalized database value should use an appropriate date when the meeting date provides enough context.

---

# 18. Missing Owner Test

### Input

```text
Someone should prepare the API documentation.
```

### Expected

```text
Action:
Prepare the API documentation

Owner:
null

Needs Review:
true
```

The AI must not invent a person.

---

# 19. Missing Deadline Test

### Input

```text
John will prepare the API documentation.
```

### Expected

```text
Owner:
John

Deadline:
null
```

The system must not invent a deadline.

---

# 20. Priority Test

### Input

```text
John must urgently fix the production issue.
```

Expected behavior:

```text
Action:
Fix the production issue

Owner:
John

Priority:
urgent
```

The exact priority normalization should follow the application's configured enum.

---

# 21. Decision Extraction Test

### Input

```text
The team decided to use PostgreSQL.
```

Expected:

```text
Decision:
Use PostgreSQL
```

---

# 22. Discussion vs Decision Test

### Input

```text
Should we use PostgreSQL?
```

Expected:

```text
Question / Discussion:
Should we use PostgreSQL?

Decision:
None
```

The system must not convert a question into a confirmed decision.

---

# 23. Dependency Test

### Input

```text
Complete the API documentation before starting integration testing.
```

Expected:

```text
Dependency:
API documentation
        ↓
Integration testing
```

The exact source/target direction must remain consistent with `DATABASE.md` and `API.md`.

---

# 24. Evidence Tests

Every important extracted item should have source evidence.

### Input

```text
John will prepare the API documentation by Friday.
```

Expected evidence:

```text
John will prepare the API documentation by Friday.
```

Test that:

```text
Evidence exists
Evidence belongs to the meeting
Evidence supports the extracted claim
```

---

# 25. Hallucination Tests

These tests are critical.

### Source

```text
John will prepare the report.
```

### AI Output

```text
John will prepare the report by Friday.
```

If the deadline cannot be supported from the source/context:

```text
Deadline:
unsupported

Needs Review:
true
```

The system must not silently store Friday as a verified deadline.

---

# 26. Owner Hallucination Test

### Source

```text
The report needs to be prepared.
```

### Invalid AI Output

```text
Owner:
John
```

Expected:

```text
Owner:
null

Needs Review:
true
```

The system must reject unsupported ownership.

---

# 27. Evidence Fabrication Test

### Source

```text
The team discussed deployment.
```

If the AI returns:

```text
"Sarah will deploy the application."
```

with fabricated evidence, verification must reject the unsupported claim.

Expected:

```text
Unsupported claim detected
Needs Review = true
```

---

# 28. Conflict Tests

### Input

```text
John will submit the report on Friday.

Actually, Sarah will submit it on Monday.
```

Expected:

```text
Conflict:
Owner conflict
Deadline conflict
```

The system should preserve relevant evidence instead of silently choosing one statement.

---

# 29. Ambiguity Tests

### Input

```text
Someone should review the deployment configuration.
```

Expected:

```text
Owner:
null

Needs Review:
true
```

Another example:

```text
We should probably finish this soon.
```

Expected behavior:

```text
Potential commitment
Insufficient deadline information
Needs Review
```

The system must preserve uncertainty.

---

# 30. Verification Service Tests

The verification service should test:

```text
Supported claim
Unsupported claim
Missing evidence
Evidence mismatch
Owner mismatch
Deadline mismatch
Priority mismatch
Conflicting evidence
Ambiguous evidence
```

Conceptual flow:

```text
AI Output
    +
Original Notes
    ↓
Verification
    ↓
Verified
or
Needs Review
```

---

# 31. Structured Output Validation Tests

Test malformed AI output.

Example:

```json
{
  "actions": "prepare report"
}
```

when an array is required.

Expected:

```text
Schema validation failure
```

Another example:

```json
{
  "confidence": 2.5
}
```

Expected:

```text
Schema validation failure
```

The application must not persist malformed AI output as valid meeting data.

---

# 32. Database Tests

Test:

```text
Create user
Create meeting
Create source
Create action
Create evidence
Create decision
Create question
Create dependency
Create verification result
Update action
Delete meeting
Cascade behavior
Transactions
```

Database tests should verify both successful operations and rollback behavior.

---

# 33. Transaction Tests

Meeting processing involves multiple related records.

Example:

```text
Meeting
  +
Actions
  +
Evidence
  +
Decisions
  +
Questions
  +
Dependencies
  +
Verification
```

If a critical operation fails:

```text
BEGIN
   ↓
Insert meeting data
   ↓
Insert actions
   ↓
Insert evidence
   ↓
ERROR
   ↓
ROLLBACK
```

No partial inconsistent dataset should remain.

---

# 34. Action Lifecycle Tests

Allowed lifecycle:

```text
todo
   ↓
in_progress
   ↓
completed
```

The implementation may also support:

```text
blocked
```

Test:

```text
Create action → todo
todo → in_progress
in_progress → completed
```

Test invalid lifecycle values.

The backend must validate status transitions according to the application's final rules.

---

# 35. Overdue Action Tests

Test:

```text
Future deadline
Today's deadline
Past deadline
No deadline
Completed action
```

An action with no deadline must not automatically become overdue.

A completed action should not be displayed as an active overdue task.

---

# 36. Meeting History Tests

Test:

```text
Create multiple meetings
Retrieve meetings in correct order
Filter/search meetings
Open historical meeting
Access associated actions
Access associated decisions
```

Ownership rules must still apply to historical meetings.

---

# 37. Meeting Comparison Tests

Given:

```text
Meeting A
Meeting B
```

Test identification of:

```text
New actions
Changed actions
Completed actions
Changed decisions
New questions
```

Comparison should be derived from stored meeting information rather than relying on a separate comparison table.

---

# 38. Ask My Meetings Tests

Test:

```text
Question about one meeting
Question about multiple meetings
Question with no relevant information
Unauthorized meeting reference
Empty question
```

Expected behavior when information is unavailable:

```text
The available meeting data does not provide enough information.
```

The system must not invent an answer.

If vector/embedding retrieval is introduced later, retrieval quality should also be tested.

---

# 39. Frontend Tests

Frontend testing should cover:

```text
Login
Registration
Dashboard
Meeting creation
File upload
Processing state
Meeting detail
Action board
Action editing
Decision display
Question display
Dependency graph
Meeting history
Meeting comparison
Ask My Meetings
Export
Error states
Empty states
Loading states
Protected routes
```

---

# 40. Component Tests

Important components should be tested independently.

Examples:

```text
MeetingCard
ActionCard
ActionTable
StatusBadge
ConfidenceBadge
EvidenceSection
DecisionCard
QuestionCard
DependencyGraph
FileUpload
ProcessingIndicator
```

Test both:

```text
Correct data
Empty / missing data
Loading state
Error state
```

---

# 41. Frontend API Tests

Test that frontend services:

```text
Send correct HTTP method
Send correct URL
Send correct request body
Attach authentication token
Handle successful responses
Handle 401
Handle 403
Handle 404
Handle 422
Handle 500
```

The frontend must not assume every API call succeeds.

---

# 42. End-to-End Tests

At least the primary user journey should be tested end-to-end.

### Main Flow

```text
Register
   ↓
Login
   ↓
Create Meeting
   ↓
Enter / Upload Notes
   ↓
Process Meeting
   ↓
AI Extraction
   ↓
Verification
   ↓
View Summary
   ↓
View Actions
   ↓
Review Evidence
   ↓
Update Action
   ↓
View Meeting History
```

This is the most important E2E flow.

---

# 43. File-Based E2E Flow

Test:

```text
Login
   ↓
Upload PDF/DOCX/TXT
   ↓
Text Extraction
   ↓
AI Processing
   ↓
Verification
   ↓
Meeting Result
```

Test at least one valid example for each supported file format.

---

# 44. Security Tests

Test:

```text
Missing authentication
Invalid JWT
Expired JWT
Cross-user resource access
SQL injection attempts
Malformed request bodies
Oversized uploads
Unsupported file types
Unexpected input fields
```

SQL queries must always use parameters.

Example:

```js
await pool.query(
  "SELECT * FROM meetings WHERE id = $1",
  [meetingId]
);
```

Never construct SQL by concatenating user input.

---

# 45. AI Prompt Regression Tests

When prompts change, existing extraction behavior should be re-tested.

Maintain representative examples such as:

```text
Simple action
Multiple actions
Missing owner
Missing deadline
Decision
Question
Dependency
Ambiguous commitment
Conflicting statements
Multilingual meeting
```

A prompt change should not silently break previously supported extraction behavior.

---

# 46. AI Evaluation Dataset

Maintain a small controlled dataset of meeting examples.

Conceptual structure:

```text
tests/
└── ai/
    ├── simple-action.json
    ├── missing-owner.json
    ├── decision.json
    ├── dependency.json
    ├── ambiguity.json
    ├── conflict.json
    └── multilingual.json
```

Each test case should contain:

```json
{
  "input": "...",
  "expected": {}
}
```

The expected result should focus on important semantic fields rather than requiring an identical natural-language summary.

---

# 47. AI Evaluation Metrics

Useful metrics include:

### Action extraction precision

```text
Correct actions
----------------------------
All extracted actions
```

### Action extraction recall

```text
Correct actions
----------------------------
All expected actions
```

Similar evaluation can be performed for:

```text
Owner
Deadline
Decision
Question
Dependency
```

Evidence support should also be evaluated.

---

# 48. Evidence Support Metric

A particularly important MeetingOS metric:

```text
Supported extracted facts
----------------------------
Total extracted facts
```

This helps measure whether the system is producing trustworthy structured data.

A high confidence score should never compensate for unsupported evidence.

---

# 49. Error Handling Tests

Test controlled failures from:

```text
Database unavailable
Qualcomm AI unavailable
AI timeout
Invalid AI response
File extraction failure
Invalid JWT
Validation failure
Resource not found
Unauthorized resource
```

The user should receive a useful error state.

Internal implementation details should remain server-side.

---

# 50. Performance Testing

Performance testing should initially focus on:

```text
API response time
Database query performance
File extraction time
AI request duration
Meeting processing duration
Large meeting behavior
```

Do not prematurely optimize before identifying actual bottlenecks.

---

# 51. Regression Testing

Whenever a major feature changes:

```text
Run unit tests
      ↓
Run API tests
      ↓
Run AI tests
      ↓
Run database tests
      ↓
Run critical E2E flow
```

Especially rerun regression tests after changing:

- AI prompts
- AI schema
- Database schema
- Authentication
- API contracts
- Verification logic

---

# 52. Minimum Hackathon Test Suite

Before the final hackathon demo, the following must pass:

### Authentication

- [ ] Register
- [ ] Login
- [ ] Protected route

### Meeting

- [ ] Create meeting
- [ ] Upload TXT
- [ ] Upload PDF
- [ ] Upload DOCX
- [ ] View meeting

### AI

- [ ] Summary extraction
- [ ] Action extraction
- [ ] Owner extraction
- [ ] Deadline extraction
- [ ] Decision extraction
- [ ] Question extraction
- [ ] Dependency extraction
- [ ] Evidence extraction

### Trust

- [ ] Missing owner handled
- [ ] Missing deadline handled
- [ ] Unsupported claim detected
- [ ] Ambiguous task marked for review
- [ ] Conflict detected

### Actions

- [ ] Update action
- [ ] Change status
- [ ] Complete action

### Database

- [ ] Data persisted correctly
- [ ] Transaction rollback works
- [ ] User isolation works

### Frontend

- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Main user flow

---

# 53. Pre-Demo Checklist

```text
Environment
[ ] Production environment variables configured
[ ] Qualcomm credentials verified
[ ] Supabase PostgreSQL connection verified
[ ] Database migrations applied

Backend
[ ] Server starts successfully
[ ] Authentication works
[ ] AI processing works
[ ] File uploads work
[ ] Verification works
[ ] API errors are handled

Frontend
[ ] Production build succeeds
[ ] Login works
[ ] Meeting creation works
[ ] AI results render correctly
[ ] Actions can be updated
[ ] Dependency graph renders
[ ] Export works

AI
[ ] Qualcomm API reachable
[ ] Correct model configured
[ ] Structured output valid
[ ] Evidence present
[ ] Unsupported claims handled
[ ] Demo meeting tested

Security
[ ] No secrets committed
[ ] .env excluded from Git
[ ] API keys not exposed in frontend
[ ] Database credentials not exposed
```

---

# 54. Testing Folder Structure

Recommended structure:

```text
tests/
│
├── unit/
│   ├── services/
│   ├── utils/
│   └── validators/
│
├── integration/
│   ├── auth/
│   ├── meetings/
│   ├── actions/
│   └── database/
│
├── ai/
│   ├── fixtures/
│   ├── extraction/
│   ├── verification/
│   └── regression/
│
└── e2e/
    ├── auth/
    ├── meeting-flow/
    └── file-upload/
```

The exact folder arrangement may be adjusted to match the chosen testing framework.

---

# 55. Testing Principles

### 1. Test behavior, not implementation details

Tests should verify what the system does rather than unnecessarily coupling themselves to internal implementation.

### 2. Keep AI tests deterministic

Mock provider responses for most automated tests.

### 3. Test failure cases

A system is not complete because the happy path works.

### 4. Protect user data

Always test authorization boundaries.

### 5. Evidence is mandatory

AI extraction tests must verify source support.

### 6. Do not trust AI output

Every AI response must pass schema validation and verification.

### 7. Keep tests repeatable

The same test should produce the same result under the same conditions.

---

# 56. Definition of Done

A feature is considered complete when:

```text
[ ] Implementation complete
[ ] Input validation implemented
[ ] Authentication/authorization considered
[ ] Unit tests written
[ ] Integration tests written where applicable
[ ] Error cases tested
[ ] AI behavior tested where applicable
[ ] Database behavior tested where applicable
[ ] Frontend states tested
[ ] Critical E2E flow verified
[ ] Documentation updated
```

---

# 57. Final Testing Principle

MeetingOS is an AI-powered application, so traditional software correctness is not enough.

The system must verify two separate questions:

```text
Does the software work?
        AND
Is the AI information supported by the meeting?
```

Both must be true.

> **A successful AI request is not a successful AI result.**

The result is successful only when the extracted information is structurally valid, appropriately verified, and traceable to the original meeting content.
