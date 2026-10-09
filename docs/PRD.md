# PRD --- Smart Meeting Action Extractor

## 1. Product Overview

**Product:** Smart Meeting Action Extractor\
**Working concept:** MeetingOS --- From messy meeting notes to
structured, verifiable, actionable information.

### Problem Statement

Convert messy meeting notes into concise summaries, action items,
owners, deadlines, priorities, decisions, questions, and task
dependencies using the **Qualcomm Cloud AI Platform** as the core AI
inference layer.

The product focuses on trustworthy extraction: important AI-generated
information should be traceable to the original meeting notes, and
unsupported information should be flagged rather than invented.

------------------------------------------------------------------------

## 2. Product Vision

> Don't just summarize meetings. Turn meeting conversations into
> structured, traceable, and actionable work.

``` text
Messy Meeting Notes
        ↓
Qualcomm Cloud AI
        ↓
Structured Meeting Intelligence
        ↓
Actions + Decisions + Questions + Dependencies
        ↓
Verification + Evidence
        ↓
Action Dashboard + Meeting History
```

------------------------------------------------------------------------

## 3. Goals

1.  Generate concise meeting summaries.
2.  Extract action items automatically.
3.  Identify owners and deadlines.
4.  Classify action priority.
5.  Provide confidence scores.
6.  Provide source evidence for extracted information.
7.  Detect ambiguity and unresolved commitments.
8.  Separate decisions from discussions.
9.  Detect questions and task dependencies.
10. Visualize dependencies.
11. Track action status.
12. Store meeting history and compare meetings.
13. Support natural-language questions over historical meetings.
14. Verify AI extraction and detect unsupported or conflicting
    information.
15. Use Qualcomm Cloud AI as the core AI inference platform.

------------------------------------------------------------------------

## 4. Non-Goals

The initial version will **not** include:

-   Risk analysis or risk scoring
-   Risk mitigation suggestions
-   Team workload analytics
-   Meeting productivity analytics
-   Meeting health scores
-   Email generation
-   Slack/Teams message generation
-   Automated notifications/reminders
-   Calendar integration
-   Video conferencing
-   Real-time transcription
-   Full project-management functionality
-   User-facing model benchmarking/evaluation dashboards

------------------------------------------------------------------------

## 5. Target Users

### Students and Hackathon Teams

Track responsibilities, decisions, and deadlines across project
meetings.

### Software Development Teams

Convert planning, stand-up, and sprint notes into structured actions.

### Project Managers

Maintain continuity between meetings and monitor unresolved work.

### Team Leads

Quickly review decisions, assignments, deadlines, and open questions.

------------------------------------------------------------------------

## 6. Core User Journey

``` text
Create Meeting
     ↓
Paste Notes / Upload Document
     ↓
Preprocess Text
     ↓
Qualcomm Cloud AI Extraction
     ↓
Structured Result
     ↓
AI Verification
     ↓
Confidence + Evidence + Ambiguity
     ↓
User Reviews / Edits
     ↓
Save Meeting
     ↓
Track Actions / Compare Meetings / Ask Questions
```

------------------------------------------------------------------------

# 7. Functional Requirements

## FR-01 --- Meeting Creation

Users shall be able to create a meeting with:

-   Meeting title
-   Meeting date
-   Optional description
-   Meeting notes

------------------------------------------------------------------------

## FR-02 --- Messy Notes Input

Users shall be able to paste unstructured notes containing:

-   Informal language
-   Sentence fragments
-   Bullet points
-   Misspellings
-   Abbreviations
-   Incomplete statements
-   Repeated information
-   Multiple speakers
-   Relative dates such as "tomorrow" or "next Friday"

The system must not require a predefined note format.

------------------------------------------------------------------------

## FR-03 --- Multi-Format Input

The system should support:

-   Direct text
-   TXT
-   PDF
-   DOCX

Extracted document text must enter the same AI processing pipeline as
pasted notes.

------------------------------------------------------------------------

## FR-04 --- Text Preprocessing

The system shall:

-   Normalize excessive whitespace
-   Normalize line breaks
-   Preserve meaningful formatting
-   Detect language where supported
-   Preserve the original text for evidence mapping

------------------------------------------------------------------------

## FR-05 --- AI Meeting Summary

Generate a concise summary covering:

-   Main topics
-   Important outcomes
-   Major decisions
-   Important next steps

The summary must not invent information.

------------------------------------------------------------------------

## FR-06 --- Action Item Extraction

Identify tasks and commitments.

Example:

``` json
{
  "task": "Complete backend API",
  "owner": "Rahul",
  "deadline": "Friday",
  "priority": "High",
  "status": "Todo"
}
```

General discussion should not automatically become an action item.

------------------------------------------------------------------------

## FR-07 --- Owner Detection

Identify the responsible person when supported by the notes.

If no owner is available:

``` text
Owner: Unassigned
```

The system must never invent an owner.

------------------------------------------------------------------------

## FR-08 --- Deadline Extraction

Detect:

-   Exact dates
-   Days of week
-   Relative dates
-   Time references
-   Explicit deadlines

Relative dates should be resolved using the meeting date where possible.

------------------------------------------------------------------------

## FR-09 --- Priority Detection

Classify actions as:

-   Critical
-   High
-   Medium
-   Low

Classification must be based on available context.

------------------------------------------------------------------------

## FR-10 --- Confidence Scoring

Provide confidence for extracted fields such as:

-   Action
-   Owner
-   Deadline
-   Priority
-   Decision
-   Dependency

Example:

``` text
Action Confidence: 96%
Owner Confidence: 89%
Deadline Confidence: 94%
```

------------------------------------------------------------------------

## FR-11 --- Evidence-Based Extraction

Important extracted information must retain supporting source text.

Example:

``` text
Action: Complete backend API
Owner: Rahul
Deadline: Friday

Evidence:
"Rahul will complete the backend API by Friday."
```

Users should be able to inspect the evidence.

------------------------------------------------------------------------

## FR-12 --- Ambiguity Detection

Detect vague commitments such as:

``` text
"Someone should prepare the documentation."
"Finish the API soon."
```

Identify what is missing:

-   Owner
-   Deadline
-   Clear task
-   Responsibility
-   Dependency
-   Decision clarity

------------------------------------------------------------------------

## FR-13 --- Decision Extraction

Separate final decisions from general discussion.

Example:

``` text
Discussion:
The team discussed PostgreSQL and MongoDB.

Decision:
The team decided to use MongoDB.
```

Each decision should include evidence and confidence.

------------------------------------------------------------------------

## FR-14 --- Discussion / Question Detection

Identify unresolved questions and discussion points.

Example:

``` text
Question:
Should deployment happen before or after testing?

Status:
Unresolved
```

------------------------------------------------------------------------

## FR-15 --- Dependency Detection

Identify relationships between action items.

Example:

``` text
Database Schema
      ↓
Backend API
      ↓
Integration
      ↓
Testing
```

The system should distinguish explicit evidence from inferred
dependencies.

------------------------------------------------------------------------

## FR-16 --- Visual Dependency Graph

Display action dependencies as an interactive graph.

Users should be able to inspect individual nodes and see associated
actions, owners, deadlines, and evidence.

------------------------------------------------------------------------

## FR-17 --- Action Dashboard

Display:

-   Task
-   Owner
-   Deadline
-   Priority
-   Status
-   Confidence
-   Evidence
-   Dependencies

Example:

  Task              Owner        Deadline   Priority   Status
  ----------------- ------------ ---------- ---------- -------------
  Backend API       Rahul        Friday     High       Todo
  UI Review         Priya        Thursday   Medium     In Progress
  Deployment Docs   Unassigned   TBD        Medium     Todo

------------------------------------------------------------------------

## FR-18 --- Action Lifecycle Tracking

Users shall be able to update action status:

``` text
Todo → In Progress → Completed
```

`Blocked` may also be used when a task cannot proceed.

Original AI extraction must remain distinguishable from user edits.

------------------------------------------------------------------------

## FR-19 --- Overdue Action Detection

Identify actions whose deadline has passed and whose status is not
completed.

Example:

``` text
⚠ Overdue
Backend API
Owner: Rahul
Due: October 4
Status: In Progress
```

------------------------------------------------------------------------

## FR-20 --- Meeting History

Store analyzed meetings containing:

-   Original notes
-   Summary
-   Actions
-   Decisions
-   Questions
-   Dependencies
-   Verification results
-   Metadata

------------------------------------------------------------------------

## FR-21 --- Meeting-to-Meeting Comparison

Compare meetings to identify:

-   New actions
-   Completed actions
-   Changed deadlines
-   Changed owners
-   New decisions
-   Changed decisions
-   New unresolved questions
-   Changed dependencies

------------------------------------------------------------------------

## FR-22 --- Ask My Meetings

Users shall be able to ask natural-language questions about stored
meetings.

Examples:

``` text
Who is responsible for the backend API?
What did we decide about the database?
Which tasks are incomplete?
When is the API due?
What questions were unresolved?
Which meeting discussed MongoDB?
```

------------------------------------------------------------------------

## FR-23 --- Evidence / Source Traceability

Historical answers should provide the source meeting and, where
possible, the supporting text.

Example:

``` text
Answer:
The team decided to use MongoDB.

Source:
Backend Planning Meeting — October 6
```

------------------------------------------------------------------------

## FR-24 --- AI Verification Pass

A second AI pass shall verify the first extraction.

It should check:

-   Action support
-   Owner support
-   Deadline support
-   Decision support
-   Dependency support
-   Unsupported information
-   Contradictions

Pipeline:

``` text
Notes → Extraction AI → Structured Result → Verification AI → Verified Result
```

------------------------------------------------------------------------

## FR-25 --- Hallucination Detection

Flag extracted information that is not adequately supported.

Example:

``` text
Extracted Owner: Rahul
Evidence: No explicit assignment found.
Result: Unsupported extraction
```

Prefer `Unassigned` over guessing.

------------------------------------------------------------------------

## FR-26 --- Conflict Detection

Detect contradictory owners, deadlines, decisions, or statements.

Example:

``` text
"Rahul will complete the API by Friday."

Later:

"Priya will complete the API by Monday."
```

Result:

``` text
⚠ Conflicting owner/deadline information detected.
```

Both source statements should remain reviewable.

------------------------------------------------------------------------

## FR-27 --- Unassigned Task Detection

Explicitly identify actions with no confirmed owner.

Example:

``` text
Deployment documentation
Owner: Unassigned
```

------------------------------------------------------------------------

## FR-28 --- Unresolved Commitment Detection

Identify commitments lacking sufficient execution information.

Examples:

``` text
"Someone should handle deployment."
"Let's finish this soon."
"We need to improve testing."
```

Identify the missing information such as owner, deadline, or clear
action.

------------------------------------------------------------------------

## FR-29 --- Meeting Report Export

Allow export as:

-   PDF
-   Markdown
-   JSON

Include summary, decisions, actions, owners, deadlines, priorities,
questions, dependencies, and verification information.

------------------------------------------------------------------------

## FR-30 --- Multilingual Meeting Notes

Support multiple languages where the selected Qualcomm-compatible AI
model supports them.

Preserve original text while generating structured output in the
selected application language.

------------------------------------------------------------------------

## FR-31 --- Privacy / Sensitive Data Detection

Optionally detect potentially sensitive information such as:

-   Personal information
-   Credentials/secrets
-   Financial information
-   Private identifiers

The feature should provide warnings rather than make legal
classifications.

------------------------------------------------------------------------

## FR-32 --- Smart Structured Output

AI output must use a machine-readable JSON schema.

Example:

``` json
{
  "summary": "...",
  "decisions": [],
  "actions": [],
  "questions": [],
  "dependencies": [],
  "verification": {
    "verified": true,
    "conflicts": [],
    "unsupported_items": []
  }
}
```

The frontend and backend should consume structured data rather than
relying on free-form AI text.

------------------------------------------------------------------------

# 8. Qualcomm Cloud AI Requirements

Qualcomm Cloud AI Platform is a **mandatory core dependency**.

It should be used for:

1.  Summarization
2.  Action extraction
3.  Owner extraction
4.  Deadline extraction
5.  Priority classification
6.  Decision extraction
7.  Question/discussion detection
8.  Dependency extraction
9.  Ambiguity detection
10. Evidence association
11. Verification
12. Historical meeting question answering

The application should visibly demonstrate Qualcomm Cloud AI as part of
the primary inference pipeline.

------------------------------------------------------------------------

# 9. AI Pipeline

``` text
                 User Notes / Documents
                           ↓
                  Text Preprocessing
                           ↓
                  Qualcomm Cloud AI
                           ↓
                Structured Extraction
                           ↓
       ┌──────────┬────────┬────────┬─────────┐
       ↓          ↓        ↓        ↓         ↓
    Actions   Decisions  Questions  Owners  Dependencies
       └──────────┴────────┴────────┴─────────┘
                           ↓
                    Verification AI
                           ↓
              Evidence / Confidence /
            Ambiguity / Conflict Checks
                           ↓
                    Structured JSON
                           ↓
        ┌──────────────┬───────────────┐
        ↓              ↓               ↓
 Action Dashboard  Meeting History  Ask Meetings
```

------------------------------------------------------------------------

# 10. Suggested Technology Stack

## Frontend

-   React
-   TypeScript
-   Tailwind CSS
-   React Flow for dependency graphs
-   Lucide Icons

## Backend

Recommended:

-   Python
-   FastAPI
-   Pydantic
-   SQLAlchemy

## Database

Recommended:

-   PostgreSQL

Core entities:

``` text
users
meetings
actions
decisions
questions
dependencies
meeting_sources
verification_results
```

## AI

-   Qualcomm Cloud AI Platform
-   Qualcomm-compatible inference/model APIs available in the hackathon
    environment

------------------------------------------------------------------------

# 11. Data Model

## Meeting

``` text
id
title
date
original_notes
summary
created_at
updated_at
```

## Action

``` text
id
meeting_id
task
owner
deadline
priority
status
confidence
evidence
verified
created_at
```

## Decision

``` text
id
meeting_id
decision
evidence
confidence
verified
```

## Question

``` text
id
meeting_id
question
status
evidence
```

## Dependency

``` text
id
meeting_id
source_action_id
target_action_id
relationship
evidence
confidence
```

------------------------------------------------------------------------

# 12. API Requirements

### Meetings

``` http
POST /api/meetings
GET /api/meetings
GET /api/meetings/:id
DELETE /api/meetings/:id
```

### AI Processing

``` http
POST /api/meetings/:id/analyze
POST /api/meetings/:id/verify
```

### Actions

``` http
GET /api/meetings/:id/actions
PATCH /api/actions/:id
```

### Decisions

``` http
GET /api/meetings/:id/decisions
```

### Questions

``` http
GET /api/meetings/:id/questions
```

### Dependencies

``` http
GET /api/meetings/:id/dependencies
```

### Comparison

``` http
GET /api/meetings/compare?from=:id&to=:id
```

### Historical Q&A

``` http
POST /api/meetings/query
```

------------------------------------------------------------------------

# 13. Non-Functional Requirements

## Accuracy

Faithful extraction is more important than creative generation. Unknown
information must remain unknown.

## Explainability

Important AI outputs should have supporting evidence.

## Reliability

Malformed AI responses must be validated and handled without crashing
the application.

## Security

-   Store API credentials in environment variables.
-   Never commit secrets.
-   Isolate users' meeting data.
-   Validate uploaded documents.

## Maintainability

Keep AI prompts, schemas, validation, business logic, and API routes
modular.

## Extensibility

The architecture should allow additional Qualcomm-compatible models or
inference strategies to be introduced later.

------------------------------------------------------------------------

# 14. AI Prompting Rules

The extraction model should be instructed to:

1.  Extract only information supported by the source.
2.  Never invent owners.
3.  Never invent deadlines.
4.  Preserve uncertainty.
5.  Return strict structured JSON.
6.  Include evidence for important fields.
7.  Identify ambiguous statements.
8.  Identify contradictory statements.
9.  Distinguish decisions from discussions.
10. Distinguish actionable tasks from general statements.

------------------------------------------------------------------------

# 15. Example Input

``` text
Meeting: Backend Planning

Rahul said he can finish the API by Friday.
Priya will check the UI tomorrow.

We discussed PostgreSQL and MongoDB.
The team decided to use MongoDB.

The database schema needs to be finalized before
the API can be completed.

Someone should prepare the deployment documentation.

Testing will start after integration.

The client demo is next Monday.
```

# 16. Example Expected Output

### Summary

The team selected MongoDB. Rahul is responsible for the backend API by
Friday, and Priya will review the UI tomorrow. Testing begins after
integration. The database schema must be finalized before backend
completion.

### Decisions

  Decision        Confidence
  ------------- ------------
  Use MongoDB            98%

### Actions

  Task                               Owner        Deadline   Priority   Status
  ---------------------------------- ------------ ---------- ---------- --------
  Complete backend API               Rahul        Friday     High       Todo
  Review UI                          Priya        Tomorrow   Medium     Todo
  Prepare deployment documentation   Unassigned   TBD        Medium     Todo

### Questions / Unresolved Items

-   Who will prepare deployment documentation?
-   When will the database schema be finalized?

### Dependencies

``` text
Database Schema
      ↓
Backend API
      ↓
Integration
      ↓
Testing
```

### Ambiguities

``` text
Deployment documentation:
Owner not specified

Database schema:
Deadline not specified
```

------------------------------------------------------------------------

# 17. Acceptance Criteria

The MVP is complete when:

-   [ ] User can create a meeting.
-   [ ] User can paste messy meeting notes.
-   [ ] User can upload supported documents.
-   [ ] Qualcomm Cloud AI processes the notes.
-   [ ] Summary is generated.
-   [ ] Action items are extracted.
-   [ ] Owners are identified when supported.
-   [ ] Deadlines are extracted.
-   [ ] Priorities are classified.
-   [ ] Confidence scores are generated.
-   [ ] Evidence is attached to important extractions.
-   [ ] Ambiguous commitments are detected.
-   [ ] Decisions are extracted.
-   [ ] Questions/discussions are identified.
-   [ ] Dependencies are detected.
-   [ ] Dependency graph is displayed.
-   [ ] Action status can be updated.
-   [ ] Overdue actions are detected.
-   [ ] Meeting history is stored.
-   [ ] Meetings can be compared.
-   [ ] Historical meeting questions can be asked in natural language.
-   [ ] Historical answers have source traceability.
-   [ ] AI verification is performed.
-   [ ] Unsupported/hallucinated information is flagged.
-   [ ] Conflicts are detected.
-   [ ] Unassigned tasks are identified.
-   [ ] Unresolved commitments are identified.
-   [ ] Reports can be exported.
-   [ ] Multilingual notes are supported where the selected model
    permits.
-   [ ] Sensitive-data warnings are available.
-   [ ] AI/application communication uses structured JSON.
-   [ ] Qualcomm Cloud AI is demonstrably part of the core inference
    pipeline.

------------------------------------------------------------------------

# 18. Development Priority

## P0 --- MVP Core

``` text
Messy Notes
→ Qualcomm AI
→ Summary
→ Actions
→ Owners
→ Deadlines
→ Priority
→ Evidence
→ Confidence
→ Ambiguity
→ Decisions
→ Questions
```

## P1 --- Differentiation

``` text
Dependencies
→ Dependency Graph
→ AI Verification
→ Hallucination Detection
→ Conflict Detection
→ Unassigned Tasks
→ Unresolved Commitments
→ Action Lifecycle
→ Meeting History
```

## P2 --- Advanced

``` text
Meeting Comparison
→ Ask My Meetings
→ Historical Retrieval / RAG
→ Export
→ Multilingual Input
→ Privacy Detection
```

------------------------------------------------------------------------

# 19. Success Metrics

### Extraction Quality

-   Action extraction accuracy
-   Owner extraction accuracy
-   Deadline extraction accuracy
-   Decision extraction accuracy
-   Dependency detection accuracy

### Trust

-   Percentage of important extractions with evidence
-   Percentage of unsupported items correctly flagged
-   Percentage of conflicts correctly detected

### Usability

-   Time required to convert raw notes into an actionable list
-   Number of manual corrections per meeting
-   Time required to retrieve information from historical meetings

### Product Value

The product should substantially reduce the manual effort required to
convert meeting notes into structured, actionable work.

------------------------------------------------------------------------

# 20. Future Enhancements

Possible future versions:

-   Calendar integration
-   Automatic meeting transcription
-   Audio/voice input
-   Real-time meeting intelligence
-   Slack/Teams integrations
-   Email integrations
-   Automatic reminders
-   Enterprise SSO
-   Advanced team analytics
-   Cross-project knowledge graphs
-   Advanced edge/on-device AI deployment

These are outside the initial hackathon MVP.

------------------------------------------------------------------------

# 21. Final Product Definition

The Smart Meeting Action Extractor is an AI-powered meeting intelligence
system using **Qualcomm Cloud AI** to transform messy meeting notes into
structured, traceable information.

The system answers:

``` text
WHAT happened?
WHAT was decided?
WHAT needs to be done?
WHO owns it?
WHEN is it due?
HOW important is it?
WHAT depends on what?
WHAT is ambiguous?
WHAT is unsupported?
WHAT conflicts?
WHAT remains unresolved?
```

### Core Principle

> **If the AI cannot support an extracted fact from the meeting notes,
> it should say so instead of guessing.**
