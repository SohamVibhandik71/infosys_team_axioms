# AI Pipeline

## 1. Purpose

This document defines how MeetingOS converts raw meeting notes into structured, verified meeting intelligence using the Qualcomm Cloud AI / Imagine API layer.

The AI pipeline is intentionally designed around one principle:

> **Evidence before confidence.**

The system must not turn an unsupported AI guess into trusted meeting data.

---

# 2. AI Responsibilities

The AI layer is responsible for extracting:

- Meeting summary
- Action items
- Owners
- Deadlines
- Priorities
- Decisions
- Discussion/questions
- Dependencies
- Confidence
- Source evidence
- Ambiguity indicators

The AI layer is **not** responsible for:

- Authentication
- Database access
- User authorization
- Direct frontend communication
- Final trust decisions
- Inventing missing information

The backend verification layer remains responsible for checking the AI output against the original meeting notes.

---

# 3. Qualcomm AI Integration

MeetingOS uses the Qualcomm Imagine API environment provided through Cirrascale.

Documentation:

```text
https://aisuite.cirrascale.com/imagine-api-docs
```

The Imagine API documentation provides the API surface used to interact with supported AI models.

For MeetingOS, the primary capability is:

```text
Chat Completions
```

Potential future capability:

```text
Embeddings
```

Embeddings are optional and should only be introduced if the Ask My Meetings implementation requires semantic/vector retrieval.

The backend must isolate Qualcomm integration inside an AI service.

Recommended location:

```text
server/src/services/aiService.js
```

---

# 4. High-Level Pipeline

```text
                 USER
                   │
                   ▼
          Meeting Notes / File
                   │
                   ▼
            Text Extraction
                   │
                   ▼
          Text Normalization
                   │
                   ▼
          Prompt Construction
                   │
                   ▼
       Qualcomm Imagine API
          Chat Completions
                   │
                   ▼
          Structured AI Output
                   │
                   ▼
             Zod Validation
                   │
                   ▼
             Normalization
                   │
                   ▼
          Evidence Verification
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   Ambiguity    Conflict   Unsupported
    Detection   Detection     Claims
        │          │          │
        └──────────┼──────────┘
                   ▼
             Final Result
                   │
                   ▼
            PostgreSQL
                   │
                   ▼
             React UI
```

---

# 5. Stage 1 — Input Acquisition

MeetingOS supports:

```text
Raw text
TXT
PDF
DOCX
```

The backend converts supported files into text before AI processing.

Example:

```text
PDF
 ↓
PDF text extraction
 ↓
Plain meeting text
```

The AI service should receive normalized text rather than raw binary files whenever possible.

---

# 6. Stage 2 — Text Normalization

Before sending notes to the AI model, the backend should normalize the extracted content.

Possible operations:

- Remove unnecessary repeated whitespace
- Normalize line endings
- Preserve paragraph boundaries
- Preserve speaker labels when available
- Preserve timestamps when available
- Remove extraction artifacts
- Preserve important source positions where possible

Do not aggressively rewrite the content.

The original source must remain unchanged for evidence and traceability.

---

# 7. Original Source Preservation

MeetingOS must retain the original meeting source.

```text
Original Notes
      │
      ├── stored unchanged
      │
      └── normalized copy
               │
               ▼
          AI processing
```

The AI should never become the only representation of the meeting.

This allows the system to answer:

> "Where did this information come from?"

---

# 8. Stage 3 — Prompt Construction

The backend constructs a controlled prompt containing:

1. Extraction instructions
2. Meeting text
3. Output requirements
4. Hallucination prevention rules
5. Evidence requirements
6. Confidence rules
7. Ambiguity rules

Conceptual structure:

```text
SYSTEM INSTRUCTIONS
        +
MEETING NOTES
        +
OUTPUT SCHEMA
        ↓
QUALCOMM AI
```

The meeting text must be clearly delimited from instructions.

Example conceptual format:

```text
<meeting_notes>
John will prepare the API documentation by Friday.
The team decided to use PostgreSQL.
Someone should investigate the deployment issue.
</meeting_notes>
```

---

# 9. AI Extraction Rules

The model must follow these rules.

## Owner

Only assign an owner when the meeting notes explicitly or strongly support the assignment.

If unsupported:

```json
{
  "owner": null
}
```

Never guess.

---

## Deadline

Only extract a deadline when the notes contain a deadline or sufficient temporal information.

Example:

```text
"by Friday"
```

can become a normalized date when the meeting date provides the required context.

If no deadline exists:

```json
{
  "deadline": null
}
```

---

## Priority

Priority should only be extracted when explicitly stated or strongly supported by the meeting language.

Possible values:

```text
low
medium
high
urgent
unknown
```

The exact allowed values should remain consistent with the database/API contract.

---

## Action

An action should represent a concrete commitment or requested task.

Example:

```text
"John will prepare the API documentation."
```

Becomes:

```json
{
  "description": "Prepare the API documentation",
  "owner": "John"
}
```

---

# 10. Evidence-Based Extraction

Every important extracted fact should contain supporting evidence.

Example:

```json
{
  "description": "Prepare API documentation",
  "owner": "John",
  "evidence": {
    "text": "John will prepare the API documentation by Friday."
  }
}
```

Evidence must come from the meeting notes.

The AI must never generate fake evidence.

---

# 11. Confidence

Each AI extraction can contain a confidence value.

Example:

```json
{
  "confidence": 0.94
}
```

Confidence is useful for prioritizing review.

However:

> Confidence does not override evidence.

An unsupported statement with `0.99` confidence is still unsupported.

The UI should therefore communicate the hierarchy:

```text
Evidence
   >
Verification
   >
Confidence
```

---

# 12. Ambiguity Detection

The system should identify statements that cannot be reliably interpreted.

Example:

```text
"Someone should probably update the documentation."
```

Expected behavior:

```json
{
  "description": "Update the documentation",
  "owner": null,
  "needsReview": true
}
```

The system should preserve uncertainty instead of inventing an owner.

---

# 13. Decision Extraction

The AI should distinguish decisions from general discussion.

Example:

```text
"The team decided to use PostgreSQL."
```

Output:

```json
{
  "decision": "Use PostgreSQL"
}
```

A statement such as:

```text
"Should we use PostgreSQL?"
```

is a question/discussion item, not a confirmed decision.

---

# 14. Question / Discussion Detection

Questions should be extracted separately from confirmed decisions.

Example:

```text
"Who will handle deployment?"
```

Output:

```json
{
  "question": "Who will handle deployment?",
  "resolved": false
}
```

This prevents unresolved discussion from being incorrectly represented as an action or decision.

---

# 15. Dependency Extraction

Dependencies describe relationships between actions.

Example:

```text
"Complete the API documentation before starting integration testing."
```

Possible output:

```json
{
  "relationship": "blocks",
  "sourceAction": "Complete the API documentation",
  "targetAction": "Start integration testing"
}
```

Dependencies should be stored separately from action descriptions.

---

# 16. Structured AI Output

The model should return structured data.

Conceptual response:

```json
{
  "summary": "The team finalized the database choice and assigned API documentation work.",
  "actions": [
    {
      "description": "Prepare API documentation",
      "owner": "John",
      "deadline": "2026-10-09",
      "priority": "high",
      "confidence": 0.94,
      "needsReview": false,
      "evidence": "John will prepare the API documentation by Friday."
    }
  ],
  "decisions": [
    {
      "decision": "Use PostgreSQL",
      "confidence": 0.97,
      "evidence": "The team decided to use PostgreSQL."
    }
  ],
  "questions": [],
  "dependencies": []
}
```

The exact production schema should be implemented through Zod and kept synchronized with the API/database contracts.

---

# 17. Zod Validation

Never directly trust the AI response.

Pipeline:

```text
AI Response
    ↓
Parse JSON
    ↓
Zod Schema
    ↓
Valid?
 ┌──┴──┐
Yes    No
 │      │
 ▼      ▼
Continue  AI/processing error
```

Example conceptual schema:

```js
const actionSchema = z.object({
  description: z.string(),
  owner: z.string().nullable(),
  deadline: z.string().nullable(),
  priority: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  evidence: z.string()
});
```

Schemas should be more restrictive in the actual implementation.

---

# 18. Stage 4 — Normalization

After validation, normalize fields before database persistence.

Examples:

```text
"High Priority"
      ↓
"high"

"John Doe "
      ↓
"John Doe"

"by Friday"
      ↓
normalized date where context permits
```

Do not normalize away uncertainty.

---

# 19. Stage 5 — Verification

The verification service compares AI output with the original meeting text.

```text
AI Extraction
     +
Original Notes
     ↓
Verification Service
     ↓
Verified / Needs Review
```

Verification checks:

- Evidence exists
- Evidence appears in source
- Extracted owner is supported
- Extracted deadline is supported
- Extracted priority is supported
- Decision is supported
- Action is supported
- Dependencies are supported

---

# 20. Hallucination Detection

The system should identify unsupported AI claims.

Example:

### Meeting notes

```text
John will prepare the report.
```

### AI output

```text
John will prepare the report by Friday.
```

If "Friday" does not appear or cannot be derived from valid context, the deadline should not be accepted as a supported fact.

Possible result:

```json
{
  "field": "deadline",
  "status": "unsupported",
  "needsReview": true
}
```

The original AI output may be retained for debugging/audit purposes, but unsupported information must not be presented as verified information.

---

# 21. Conflict Detection

Conflicts can occur when the extracted information disagrees with the source or when multiple statements in the meeting contradict one another.

Example:

```text
"John will submit the report on Friday."

Later:

"Actually, Sarah will submit it on Monday."
```

The system should not silently choose one.

Instead:

```text
Conflict detected
      ↓
Needs Review
```

The relevant evidence should be retained.

---

# 22. Unassigned Task Detection

If an action exists but no owner is supported:

```text
Action:
Prepare deployment documentation

Owner:
Unassigned
```

This is different from hallucinating an owner.

The system should explicitly represent:

```json
{
  "owner": null,
  "needsReview": true
}
```

---

# 23. Unresolved Commitment Detection

A statement can represent a commitment without containing enough information for complete action extraction.

Example:

```text
"We'll make sure the documentation gets updated."
```

The system should preserve the commitment and mark missing information appropriately instead of inventing:

- Owner
- Deadline
- Priority

---

# 24. AI Verification Result

Conceptual structure:

```json
{
  "status": "needs_review",
  "unsupportedItems": [],
  "conflicts": [],
  "unassignedTasks": [],
  "unresolvedCommitments": []
}
```

Possible overall statuses:

```text
verified
needs_review
failed
```

---

# 25. Database Persistence

Only after validation and verification should the structured information be persisted.

```text
AI Response
    ↓
Zod Validation
    ↓
Normalization
    ↓
Verification
    ↓
PostgreSQL Transaction
```

A meeting-processing transaction should persist related data together where practical:

```text
meeting
meeting_sources
actions
action_evidence
decisions
decision_evidence
questions
dependencies
verification_results
```

If a critical database operation fails, the transaction should roll back.

---

# 26. AI Service Architecture

Recommended structure:

```text
server/src/services/
│
├── aiService.js
├── extractionService.js
├── verificationService.js
└── meetingService.js
```

Responsibilities:

### `aiService.js`

Responsible for:

- Qualcomm API communication
- Authentication
- Request construction
- Response handling
- AI-specific errors
- Timeout handling

### `extractionService.js`

Responsible for:

- Preparing extraction input
- Calling AI service
- Parsing AI output
- Zod validation
- Normalization

### `verificationService.js`

Responsible for:

- Evidence verification
- Unsupported claim detection
- Conflict detection
- Ambiguity handling
- Verification result generation

### `meetingService.js`

Responsible for:

- Orchestrating the complete meeting-processing workflow
- Database transaction
- Persistence

---

# 27. Qualcomm API Isolation

Do not spread Qualcomm API calls throughout controllers.

Incorrect:

```text
meetingController
    ↓
Qualcomm API
```

Correct:

```text
meetingController
    ↓
meetingService
    ↓
extractionService
    ↓
aiService
    ↓
Qualcomm Imagine API
```

This makes the system easier to test and maintain.

---

# 28. Environment Variables

AI credentials must exist only on the backend.

Conceptual `.env`:

```env
QUALCOMM_AI_BASE_URL=
QUALCOMM_AI_API_KEY=
QUALCOMM_AI_MODEL=
```

Do not commit `.env`.

Do not expose these values through Vite's `VITE_*` variables.

The exact environment variable values and authentication mechanism must follow the deployed Qualcomm/Cirrascale account documentation.

---

# 29. AI Failure Handling

Possible failures:

```text
Network timeout
Invalid credentials
Rate limit
Unavailable model
Malformed response
Invalid JSON
Schema validation failure
Service unavailable
```

The system should return a controlled error.

Example:

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Meeting processing could not be completed."
  }
}
```

Do not expose provider secrets or internal stack traces.

---

# 30. Retry Strategy

Retries should only be used for appropriate transient failures.

Potential retry cases:

```text
Network timeout
Temporary 5xx provider error
Temporary service unavailable
```

Do not blindly retry:

```text
Invalid API key
Invalid request
Invalid model
Schema/design error
```

A maximum retry count should be configured.

---

# 31. Timeout Handling

AI calls should have an explicit timeout.

Conceptual flow:

```text
Request
  ↓
AI call
  ↓
Timeout?
 ┌──┴──┐
No    Yes
 │      │
 ▼      ▼
Continue Controlled failure
```

The user should receive a useful processing error rather than an indefinitely loading interface.

---

# 32. Multilingual Notes

MeetingOS supports multilingual meeting notes.

The AI pipeline should preserve the source language when possible.

For example:

```text
Hindi meeting notes
      ↓
AI extraction
      ↓
Structured actions
```

The system should not silently translate evidence into another language and then present the translation as the original evidence.

Original evidence should remain available in its source form.

---

# 33. Privacy and Sensitive Information

Meeting notes may contain sensitive information.

The backend should:

- Minimize unnecessary logging of raw notes
- Never log API keys
- Never log authentication tokens
- Restrict database access
- Avoid exposing raw notes in errors
- Use HTTPS in production
- Keep AI credentials server-side

If privacy detection is implemented, it should identify potentially sensitive content without unnecessarily altering the original source.

---

# 34. Token and Context Management

Large meetings may exceed the model's practical context limits.

The processing service should be designed to support:

```text
Short meeting
     ↓
Single AI request
```

and potentially:

```text
Large meeting
     ↓
Chunking
     ↓
Per-chunk extraction
     ↓
Structured merge
     ↓
Final verification
```

Chunking should be introduced only when necessary.

Important:

> Do not split text in a way that destroys context around actions, decisions, or deadlines.

---

# 35. Large Meeting Strategy

For long meetings:

```text
Original Notes
      ↓
Section / semantic chunking
      ↓
AI extraction per chunk
      ↓
Merge structured results
      ↓
Deduplicate
      ↓
Resolve conflicts
      ↓
Final verification
```

The final verification step must use sufficient source context to validate extracted facts.

---

# 36. Ask My Meetings

The initial implementation does not have to require vector search.

Possible MVP approach:

```text
User Question
     ↓
Backend
     ↓
PostgreSQL structured data
     ↓
Relevant meetings/actions/decisions
     ↓
AI answer generation
```

If semantic retrieval becomes necessary:

```text
Meeting text
     ↓
Qualcomm Embeddings
     ↓
pgvector
     ↓
Semantic retrieval
     ↓
AI answer
```

Embeddings are therefore an optional extension, not a prerequisite for the core extraction pipeline.

---

# 37. AI Output Trust Levels

MeetingOS should conceptually distinguish:

```text
SOURCE
  ↓
VERIFIED
  ↓
AI EXTRACTED
  ↓
LOW CONFIDENCE / REVIEW
```

The UI should never imply that confidence alone makes information true.

Recommended priority:

```text
Original Evidence
       ↓
Verification
       ↓
AI Extraction
       ↓
Confidence
```

---

# 38. End-to-End Example

## Input

```text
Sprint meeting:

John will prepare the API documentation by Friday.
The team decided to use PostgreSQL.
Who will handle deployment?
Complete the documentation before integration testing.
Someone should review the deployment configuration.
```

## AI extraction

```json
{
  "summary": "The team selected PostgreSQL and assigned API documentation work.",
  "actions": [
    {
      "description": "Prepare the API documentation",
      "owner": "John",
      "deadline": "Friday",
      "priority": null,
      "confidence": 0.96,
      "needsReview": false,
      "evidence": "John will prepare the API documentation by Friday."
    },
    {
      "description": "Review the deployment configuration",
      "owner": null,
      "deadline": null,
      "priority": null,
      "confidence": 0.89,
      "needsReview": true,
      "evidence": "Someone should review the deployment configuration."
    }
  ],
  "decisions": [
    {
      "decision": "Use PostgreSQL",
      "confidence": 0.98,
      "evidence": "The team decided to use PostgreSQL."
    }
  ],
  "questions": [
    {
      "question": "Who will handle deployment?",
      "resolved": false,
      "evidence": "Who will handle deployment?"
    }
  ],
  "dependencies": [
    {
      "relationship": "blocks",
      "sourceAction": "Prepare the API documentation",
      "targetAction": "Start integration testing",
      "confidence": 0.91,
      "evidence": "Complete the documentation before integration testing."
    }
  ]
}
```

## Verification

```text
Action 1
✓ Evidence exists
✓ Owner supported
✓ Deadline supported

Action 2
✓ Evidence exists
⚠ Owner missing
⚠ Needs review

Decision
✓ Supported by source

Question
✓ Correctly identified as unresolved

Dependency
✓ Supported by source
```

## Database

Only the validated/verified representation is persisted.

---

# 39. AI Pipeline Pseudocode

```js
async function processMeeting(meeting) {
  const text = await normalizeMeetingText(meeting);

  const prompt = buildExtractionPrompt(text);

  const aiResponse = await aiService.extract(prompt);

  const validated = extractionSchema.parse(aiResponse);

  const normalized = normalizeExtraction(validated);

  const verification = await verificationService.verify(
    normalized,
    text
  );

  return {
    extraction: normalized,
    verification
  };
}
```

The actual implementation should use the project's existing service architecture and error-handling conventions.

---

# 40. Testing the AI Pipeline

The AI pipeline should be tested using deterministic test cases.

### Test categories

```text
Basic action extraction
Owner extraction
Deadline extraction
Priority extraction
Decision extraction
Question extraction
Dependency extraction
Ambiguous statement
Missing owner
Missing deadline
Conflicting statements
Unsupported AI claim
Malformed AI JSON
Multilingual input
Long meeting
Empty notes
```

Example:

### Input

```text
Rahul will submit the report tomorrow.
```

### Expected

```text
Action = Submit the report
Owner = Rahul
Deadline = tomorrow
```

### Input

```text
Someone should submit the report.
```

### Expected

```text
Action = Submit the report
Owner = null
Needs Review = true
```

---

# 41. Development Order

Implement the AI pipeline in this order:

```text
1. AI service abstraction
        ↓
2. Qualcomm API connection
        ↓
3. Basic chat completion
        ↓
4. Prompt construction
        ↓
5. Structured JSON output
        ↓
6. Zod schema
        ↓
7. Action extraction
        ↓
8. Owner/deadline/priority extraction
        ↓
9. Decision/question extraction
        ↓
10. Dependency extraction
        ↓
11. Evidence extraction
        ↓
12. Verification service
        ↓
13. Hallucination detection
        ↓
14. Conflict/ambiguity detection
        ↓
15. PostgreSQL persistence
        ↓
16. Frontend integration
```

---

# 42. What Must Not Be Invented

During implementation, never invent:

- Qualcomm model names
- Qualcomm API endpoints
- Authentication headers
- API request fields
- Response fields
- Rate limits
- Context limits
- Pricing
- Provider-specific capabilities

Use the official Qualcomm/Cirrascale documentation for provider-specific details.

The current documented integration boundary is:

```text
MeetingOS Backend
      ↓
Qualcomm Imagine API
```

Provider-specific implementation details belong only inside `aiService.js`.

---

# 43. Final Architecture

```text
                    React
                      │
                      ▼
               Express API
                      │
                      ▼
              Meeting Service
                      │
             ┌────────┴────────┐
             ▼                 ▼
      Extraction Service   PostgreSQL
             │
             ▼
         AI Service
             │
             ▼
    Qualcomm Imagine API
             │
             ▼
       Structured Output
             │
             ▼
       Zod Validation
             │
             ▼
         Verification
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
    Evidence Conflict Ambiguity
       │     │     │
       └─────┼─────┘
             ▼
         PostgreSQL
             │
             ▼
          React UI
```

---

# 44. Final AI Principle

MeetingOS is not simply an AI summarizer.

It is an **evidence-first meeting intelligence system**.

The AI should:

```text
Understand
    ↓
Extract
    ↓
Structure
    ↓
Verify
    ↓
Preserve uncertainty
```

It should never:

```text
Guess
  ↓
Present guess as fact
```

The core rule remains:

> **If the meeting notes do not support an extracted fact, MeetingOS must preserve the uncertainty instead of hallucinating an answer.**
