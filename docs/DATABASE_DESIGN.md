# DATABASE.md --- Smart Meeting Action Extractor

## 1. Database Overview

The Smart Meeting Action Extractor will use **PostgreSQL** as its
primary relational database.

The database is responsible for storing:

-   Users
-   Meetings
-   Original meeting notes
-   Uploaded meeting sources
-   AI-generated summaries
-   Action items
-   Action evidence
-   Decisions
-   Decision evidence
-   Questions and unresolved discussion points
-   Task dependencies
-   AI verification results
-   Historical meeting information
-   Embedding data for semantic meeting search

### Core Principle

The database must preserve the distinction between:

1.  **Original source information**
2.  **AI-extracted information**
3.  **AI verification results**
4.  **User-corrected information**

The system must never lose the original meeting content or overwrite
source evidence.

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         ┌───────────────┐
                         │     users     │
                         └───────┬───────┘
                                 │
                                 │ 1:N
                                 ▼
                         ┌───────────────┐
                         │    meetings   │
                         └───────┬───────┘
                                 │
          ┌──────────────────────┼────────────────────────┐
          │                      │                        │
          ▼                      ▼                        ▼
 ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────┐
 │ meeting_sources │    │     actions     │    │     decisions      │
 └─────────────────┘    └────────┬────────┘    └─────────┬──────────┘
                                  │                       │
                                  ▼                       ▼
                         ┌─────────────────┐    ┌────────────────────┐
                         │ action_evidence │    │ decision_evidence  │
                         └─────────────────┘    └────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  dependencies   │
                         └─────────────────┘

                         meetings
                             │
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
        questions     verification_results  embeddings
```

------------------------------------------------------------------------

# 3. Database Technology

## Primary Database

**PostgreSQL**

### Why PostgreSQL?

PostgreSQL is preferred because the application contains strongly
related entities:

-   Users → Meetings
-   Meetings → Actions
-   Actions → Evidence
-   Actions → Dependencies
-   Meetings → Decisions
-   Meetings → Questions
-   Meetings → Verification

It also provides:

-   Foreign keys
-   Transactions
-   Constraints
-   JSONB
-   Full-text search
-   UUID support
-   Extensions such as `pgvector`

------------------------------------------------------------------------

# 4. Extensions

Recommended PostgreSQL extensions:

``` sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

`uuid-ossp` provides UUID generation.

`vector` is required only if semantic search/RAG is implemented using
pgvector.

------------------------------------------------------------------------

# 5. Entity Relationship Overview

``` text
users
  │
  │ 1:N
  ▼
meetings
  │
  ├────────────── 1:N ──────────────► actions
  │                                      │
  │                                      ├── 1:N ──► action_evidence
  │                                      │
  │                                      └── N:M ──► actions
  │                                                   through dependencies
  │
  ├────────────── 1:N ──────────────► decisions
  │                                      │
  │                                      └── 1:N ──► decision_evidence
  │
  ├────────────── 1:N ──────────────► questions
  │
  ├────────────── 1:N ──────────────► meeting_sources
  │
  ├────────────── 1:1 ──────────────► verification_results
  │
  └────────────── 1:N ──────────────► meeting_embeddings
```

------------------------------------------------------------------------

# 6. Table: `users`

Stores registered application users.

## Columns

  Column            Type             Nullable Default               Description
  ----------------- -------------- ---------- --------------------- ---------------------
  `id`              UUID                   No `gen_random_uuid()`   Primary key
  `name`            VARCHAR(100)           No ---                   User's display name
  `email`           VARCHAR(255)           No ---                   Unique email
  `password_hash`   TEXT                  Yes ---                   Hashed password
  `created_at`      TIMESTAMPTZ            No `NOW()`               Creation timestamp
  `updated_at`      TIMESTAMPTZ            No `NOW()`               Last update

### Constraints

``` text
PRIMARY KEY (id)
UNIQUE (email)
```

### Notes

Never store plaintext passwords.

------------------------------------------------------------------------

# 7. Table: `meetings`

The central table of the application.

Each meeting contains the original notes and high-level analysis.

## Columns

  Column              Type             Nullable Default               Description
  ------------------- -------------- ---------- --------------------- ----------------------------
  `id`                UUID                   No `gen_random_uuid()`   Primary key
  `user_id`           UUID                   No ---                   Meeting owner
  `title`             VARCHAR(255)           No ---                   Meeting title
  `meeting_date`      TIMESTAMPTZ            No ---                   Date/time of meeting
  `original_notes`    TEXT                   No ---                   Original raw meeting notes
  `summary`           TEXT                  Yes ---                   AI-generated summary
  `language`          VARCHAR(20)           Yes ---                   Input/detected language
  `analysis_status`   VARCHAR(30)            No `pending`             Processing state
  `created_at`        TIMESTAMPTZ            No `NOW()`               Creation timestamp
  `updated_at`        TIMESTAMPTZ            No `NOW()`               Last update

### `analysis_status`

Allowed values:

``` text
pending
processing
completed
failed
```

### Constraints

``` text
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

### Important

`original_notes` must never be replaced by the AI-generated summary.

------------------------------------------------------------------------

# 8. Table: `meeting_sources`

Stores metadata and extracted content for uploaded files.

This table is required when users upload:

-   PDF
-   DOCX
-   TXT

## Columns

  Column             Type             Nullable Default               Description
  ------------------ -------------- ---------- --------------------- --------------------------
  `id`               UUID                   No `gen_random_uuid()`   Primary key
  `meeting_id`       UUID                   No ---                   Related meeting
  `file_name`        VARCHAR(255)           No ---                   Original filename
  `file_type`        VARCHAR(50)            No ---                   pdf/docx/txt
  `file_size`        BIGINT                Yes ---                   File size in bytes
  `storage_path`     TEXT                  Yes ---                   File/object storage path
  `extracted_text`   TEXT                  Yes ---                   Text extracted from file
  `created_at`       TIMESTAMPTZ            No `NOW()`               Upload timestamp

### Relationship

``` text
meeting 1 ─────── N meeting_sources
```

### Notes

For pasted notes, `meeting_sources` is not required.

------------------------------------------------------------------------

# 9. Table: `actions`

Stores all AI-extracted and user-managed action items.

This is one of the most important tables.

## Columns

  ------------------------------------------------------------------------------------------
  Column               Type                    Nullable Default               Description
  -------------------- -------------- ----------------- --------------------- --------------
  `id`                 UUID                          No `gen_random_uuid()`   Primary key

  `meeting_id`         UUID                          No ---                   Source meeting

  `task`               TEXT                          No ---                   Action
                                                                              description

  `owner_name`         VARCHAR(100)                 Yes ---                   Display name
                                                                              extracted from
                                                                              notes

  `owner_user_id`      UUID                         Yes ---                   Linked
                                                                              registered
                                                                              user if
                                                                              available

  `deadline`           TIMESTAMPTZ                  Yes ---                   Due date/time

  `priority`           VARCHAR(20)                   No `medium`              Action
                                                                              priority

  `status`             VARCHAR(20)                   No `todo`                Current action
                                                                              status

  `confidence`         DECIMAL(5,4)                 Yes ---                   Overall
                                                                              extraction
                                                                              confidence

  `is_ambiguous`       BOOLEAN                       No `false`               Whether action
                                                                              is ambiguous

  `ambiguity_reason`   TEXT                         Yes ---                   Reason for
                                                                              ambiguity

  `is_unassigned`      BOOLEAN                       No `false`               Whether owner
                                                                              is unassigned

  `ai_owner_name`      VARCHAR(100)                 Yes ---                   Original AI
                                                                              owner

  `ai_deadline`        TIMESTAMPTZ                  Yes ---                   Original AI
                                                                              deadline

  `ai_priority`        VARCHAR(20)                  Yes ---                   Original AI
                                                                              priority

  `ai_confidence`      DECIMAL(5,4)                 Yes ---                   Original AI
                                                                              confidence

  `verified`           BOOLEAN                       No `false`               Verification
                                                                              result

  `created_at`         TIMESTAMPTZ                   No `NOW()`               Creation
                                                                              timestamp

  `updated_at`         TIMESTAMPTZ                   No `NOW()`               Last update
  ------------------------------------------------------------------------------------------

## Priority Values

``` text
critical
high
medium
low
```

## Status Values

``` text
todo
in_progress
completed
blocked
```

### Why store both AI and current values?

Suppose AI extracts:

``` text
Owner = Rahul
```

but the user corrects it:

``` text
Owner = Priya
```

We should preserve both:

``` text
ai_owner_name = Rahul
owner_name    = Priya
```

This prevents loss of the original AI output and supports auditing.

------------------------------------------------------------------------

# 10. Table: `action_evidence`

Stores exact source evidence supporting an action.

## Columns

  Column             Type             Nullable Default               Description
  ------------------ -------------- ---------- --------------------- ----------------------------
  `id`               UUID                   No `gen_random_uuid()`   Primary key
  `action_id`        UUID                   No ---                   Related action
  `source_text`      TEXT                   No ---                   Supporting source sentence
  `start_position`   INTEGER               Yes ---                   Character offset in source
  `end_position`     INTEGER               Yes ---                   Character offset in source
  `confidence`       DECIMAL(5,4)          Yes ---                   Evidence confidence
  `created_at`       TIMESTAMPTZ            No `NOW()`               Creation timestamp

### Example

``` text
Action:
Complete backend API

Evidence:
"Rahul said he can finish the API by Friday."

start_position: 42
end_position: 91
```

The frontend can use these offsets to highlight the evidence.

------------------------------------------------------------------------

# 11. Table: `decisions`

Stores final decisions extracted from meetings.

## Columns

  Column         Type             Nullable Default               Description
  -------------- -------------- ---------- --------------------- ---------------------
  `id`           UUID                   No `gen_random_uuid()`   Primary key
  `meeting_id`   UUID                   No ---                   Source meeting
  `decision`     TEXT                   No ---                   Decision text
  `confidence`   DECIMAL(5,4)          Yes ---                   AI confidence
  `verified`     BOOLEAN                No `false`               Verification status
  `created_at`   TIMESTAMPTZ            No `NOW()`               Creation timestamp
  `updated_at`   TIMESTAMPTZ            No `NOW()`               Last update

------------------------------------------------------------------------

# 12. Table: `decision_evidence`

Stores source evidence for decisions.

## Columns

  Column             Type             Nullable Default               Description
  ------------------ -------------- ---------- --------------------- ------------------------
  `id`               UUID                   No `gen_random_uuid()`   Primary key
  `decision_id`      UUID                   No ---                   Related decision
  `source_text`      TEXT                   No ---                   Supporting source text
  `start_position`   INTEGER               Yes ---                   Start offset
  `end_position`     INTEGER               Yes ---                   End offset
  `confidence`       DECIMAL(5,4)          Yes ---                   Evidence confidence
  `created_at`       TIMESTAMPTZ            No `NOW()`               Creation timestamp

------------------------------------------------------------------------

# 13. Table: `questions`

Stores questions, unresolved discussion points, and commitments
requiring clarification.

## Columns

  Column         Type             Nullable Default               Description
  -------------- -------------- ---------- --------------------- -----------------------------
  `id`           UUID                   No `gen_random_uuid()`   Primary key
  `meeting_id`   UUID                   No ---                   Source meeting
  `question`     TEXT                   No ---                   Question or unresolved item
  `status`       VARCHAR(20)            No `unresolved`          Resolution status
  `confidence`   DECIMAL(5,4)          Yes ---                   AI confidence
  `evidence`     TEXT                  Yes ---                   Supporting text
  `created_at`   TIMESTAMPTZ            No `NOW()`               Creation timestamp
  `updated_at`   TIMESTAMPTZ            No `NOW()`               Last update

### Status

``` text
unresolved
resolved
```

------------------------------------------------------------------------

# 14. Table: `dependencies`

Stores relationships between actions.

An action can depend on another action.

## Columns

  Column               Type             Nullable Default               Description
  -------------------- -------------- ---------- --------------------- ------------------------
  `id`                 UUID                   No `gen_random_uuid()`   Primary key
  `meeting_id`         UUID                   No ---                   Source meeting
  `source_action_id`   UUID                   No ---                   Upstream action
  `target_action_id`   UUID                   No ---                   Dependent action
  `relationship`       VARCHAR(30)            No `blocks`              Relationship type
  `confidence`         DECIMAL(5,4)          Yes ---                   AI confidence
  `evidence`           TEXT                  Yes ---                   Supporting source text
  `created_at`         TIMESTAMPTZ            No `NOW()`               Creation timestamp

### Example

``` text
Database Schema
      ↓
Backend API
```

Database Schema:

``` text
source_action_id
```

Backend API:

``` text
target_action_id
```

Relationship:

``` text
blocks
```

### Constraint

An action should not depend on itself:

``` text
source_action_id != target_action_id
```

------------------------------------------------------------------------

# 15. Table: `verification_results`

Stores the second-pass AI verification result for a meeting.

## Columns

  -----------------------------------------------------------------------------------------------
  Column                   Type                   Nullable Default               Description
  ------------------------ ------------- ----------------- --------------------- ----------------
  `id`                     UUID                         No `gen_random_uuid()`   Primary key

  `meeting_id`             UUID                         No ---                   Meeting being
                                                                                 verified

  `verification_status`    VARCHAR(30)                  No `pending`             Overall
                                                                                 verification
                                                                                 state

  `verification_summary`   TEXT                        Yes ---                   Human-readable
                                                                                 result

  `unsupported_items`      JSONB                        No `'[]'`                Unsupported AI
                                                                                 outputs

  `conflicts`              JSONB                        No `'[]'`                Detected
                                                                                 conflicts

  `verified_at`            TIMESTAMPTZ                 Yes ---                   Verification
                                                                                 timestamp

  `created_at`             TIMESTAMPTZ                  No `NOW()`               Creation
                                                                                 timestamp

  `updated_at`             TIMESTAMPTZ                  No `NOW()`               Last update
  -----------------------------------------------------------------------------------------------

### Verification Status

``` text
pending
verified
warning
failed
```

### Example JSON

``` json
{
  "unsupported_items": [
    {
      "entity_type": "action_owner",
      "action_id": "uuid",
      "claimed_value": "Rahul",
      "reason": "No explicit owner assignment found"
    }
  ]
}
```

------------------------------------------------------------------------

# 16. Table: `meeting_embeddings`

Required for semantic search / RAG.

This table stores embeddings for chunks of historical meeting content.

## Columns

  ------------------------------------------------------------------------------------------------------
  Column          Type                   Nullable Default               Description
  --------------- ------------- ----------------- --------------------- --------------------------------
  `id`            UUID                         No `gen_random_uuid()`   Primary key

  `meeting_id`    UUID                         No ---                   Related meeting

  `source_type`   VARCHAR(30)                  No ---                   notes/action/decision/question

  `source_id`     UUID                        Yes ---                   ID of source entity

  `chunk_text`    TEXT                         No ---                   Text represented by embedding

  `embedding`     VECTOR                       No ---                   Vector embedding

  `metadata`      JSONB                        No `'{}'`                Additional metadata

  `created_at`    TIMESTAMPTZ                  No `NOW()`               Creation timestamp
  ------------------------------------------------------------------------------------------------------

### Example

``` text
source_type: notes
chunk_text: "The team decided to use MongoDB..."
embedding: [0.012, -0.031, ...]
```

The exact vector dimension depends on the embedding model used through
the selected AI stack.

------------------------------------------------------------------------

# 17. Relationships

## User → Meetings

``` text
users.id
   │
   └── meetings.user_id
```

One user can have many meetings.

``` text
1 User
  ↓
N Meetings
```

------------------------------------------------------------------------

## Meeting → Actions

``` text
meetings.id
   │
   └── actions.meeting_id
```

One meeting can have many actions.

------------------------------------------------------------------------

## Meeting → Decisions

``` text
meetings.id
   │
   └── decisions.meeting_id
```

------------------------------------------------------------------------

## Meeting → Questions

``` text
meetings.id
   │
   └── questions.meeting_id
```

------------------------------------------------------------------------

## Meeting → Dependencies

``` text
meetings.id
   │
   └── dependencies.meeting_id
```

------------------------------------------------------------------------

## Action → Evidence

``` text
actions.id
   │
   └── action_evidence.action_id
```

One action may have multiple evidence snippets.

------------------------------------------------------------------------

## Decision → Evidence

``` text
decisions.id
   │
   └── decision_evidence.decision_id
```

------------------------------------------------------------------------

## Action → Action

Dependencies create a self-referencing many-to-many relationship:

``` text
Action A
   │
   │ dependency
   ▼
Action B
```

The `dependencies` table acts as the junction table.

------------------------------------------------------------------------

# 18. Recommended SQL Schema

## Enable Extensions

``` sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
```

------------------------------------------------------------------------

## Users

``` sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## Meetings

``` sql
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    original_notes TEXT NOT NULL,
    summary TEXT,
    language VARCHAR(20),
    analysis_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT meetings_analysis_status_check
        CHECK (analysis_status IN (
            'pending',
            'processing',
            'completed',
            'failed'
        ))
);
```

------------------------------------------------------------------------

## Meeting Sources

``` sql
CREATE TABLE meeting_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    storage_path TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## Actions

``` sql
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

    task TEXT NOT NULL,

    owner_name VARCHAR(100),
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    deadline TIMESTAMPTZ,

    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'todo',

    confidence DECIMAL(5,4),

    is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
    ambiguity_reason TEXT,

    is_unassigned BOOLEAN NOT NULL DEFAULT FALSE,

    ai_owner_name VARCHAR(100),
    ai_deadline TIMESTAMPTZ,
    ai_priority VARCHAR(20),
    ai_confidence DECIMAL(5,4),

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT actions_priority_check
        CHECK (priority IN (
            'critical',
            'high',
            'medium',
            'low'
        )),

    CONSTRAINT actions_status_check
        CHECK (status IN (
            'todo',
            'in_progress',
            'completed',
            'blocked'
        )),

    CONSTRAINT actions_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        ),

    CONSTRAINT actions_ai_confidence_check
        CHECK (
            ai_confidence IS NULL
            OR (ai_confidence >= 0 AND ai_confidence <= 1)
        )
);
```

------------------------------------------------------------------------

## Action Evidence

``` sql
CREATE TABLE action_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    confidence DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT action_evidence_position_check
        CHECK (
            start_position IS NULL
            OR end_position IS NULL
            OR end_position >= start_position
        ),

    CONSTRAINT action_evidence_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        )
);
```

------------------------------------------------------------------------

## Decisions

``` sql
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    confidence DECIMAL(5,4),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT decisions_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        )
);
```

------------------------------------------------------------------------

## Decision Evidence

``` sql
CREATE TABLE decision_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    confidence DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT decision_evidence_position_check
        CHECK (
            start_position IS NULL
            OR end_position IS NULL
            OR end_position >= start_position
        ),

    CONSTRAINT decision_evidence_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        )
);
```

------------------------------------------------------------------------

## Questions

``` sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unresolved',
    confidence DECIMAL(5,4),
    evidence TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT questions_status_check
        CHECK (status IN ('unresolved', 'resolved')),

    CONSTRAINT questions_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        )
);
```

------------------------------------------------------------------------

## Dependencies

``` sql
CREATE TABLE dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,

    source_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    target_action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,

    relationship VARCHAR(30) NOT NULL DEFAULT 'blocks',
    confidence DECIMAL(5,4),
    evidence TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT dependencies_not_self_check
        CHECK (source_action_id <> target_action_id),

    CONSTRAINT dependencies_confidence_check
        CHECK (
            confidence IS NULL
            OR (confidence >= 0 AND confidence <= 1)
        ),

    CONSTRAINT dependencies_unique
        UNIQUE (
            source_action_id,
            target_action_id,
            relationship
        )
);
```

------------------------------------------------------------------------

## Verification Results

``` sql
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    meeting_id UUID NOT NULL UNIQUE
        REFERENCES meetings(id) ON DELETE CASCADE,

    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    verification_summary TEXT,

    unsupported_items JSONB NOT NULL DEFAULT '[]'::jsonb,

    conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT verification_status_check
        CHECK (
            verification_status IN (
                'pending',
                'verified',
                'warning',
                'failed'
            )
        )
);
```

------------------------------------------------------------------------

# 19. Optional RAG / Semantic Search Schema

If `pgvector` is used:

``` sql
CREATE TABLE meeting_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    meeting_id UUID NOT NULL
        REFERENCES meetings(id) ON DELETE CASCADE,

    source_type VARCHAR(30) NOT NULL,

    source_id UUID,

    chunk_text TEXT NOT NULL,

    embedding VECTOR,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The vector dimension should be set according to the selected embedding
model.

Example:

``` sql
embedding VECTOR(1536)
```

should only be used if the chosen embedding model actually produces
1536-dimensional vectors.

------------------------------------------------------------------------

# 20. Indexing Strategy

Indexes are important for performance.

## Meetings

``` sql
CREATE INDEX idx_meetings_user_id
ON meetings(user_id);

CREATE INDEX idx_meetings_date
ON meetings(meeting_date DESC);
```

## Actions

``` sql
CREATE INDEX idx_actions_meeting_id
ON actions(meeting_id);

CREATE INDEX idx_actions_owner_user_id
ON actions(owner_user_id);

CREATE INDEX idx_actions_status
ON actions(status);

CREATE INDEX idx_actions_deadline
ON actions(deadline);

CREATE INDEX idx_actions_priority
ON actions(priority);
```

## Decisions

``` sql
CREATE INDEX idx_decisions_meeting_id
ON decisions(meeting_id);
```

## Questions

``` sql
CREATE INDEX idx_questions_meeting_id
ON questions(meeting_id);

CREATE INDEX idx_questions_status
ON questions(status);
```

## Dependencies

``` sql
CREATE INDEX idx_dependencies_meeting_id
ON dependencies(meeting_id);

CREATE INDEX idx_dependencies_source
ON dependencies(source_action_id);

CREATE INDEX idx_dependencies_target
ON dependencies(target_action_id);
```

## Evidence

``` sql
CREATE INDEX idx_action_evidence_action_id
ON action_evidence(action_id);

CREATE INDEX idx_decision_evidence_decision_id
ON decision_evidence(decision_id);
```

------------------------------------------------------------------------

# 21. Data Lifecycle

``` text
                    USER CREATES MEETING
                            ↓
                     Store raw notes
                            ↓
                    analysis_status
                       = pending
                            ↓
                    AI PROCESSING
                            ↓
                       processing
                            ↓
                Qualcomm Cloud AI
                            ↓
                  Structured extraction
                            ↓
                Store actions/decisions/
              questions/dependencies
                            ↓
                  Verification pass
                            ↓
              Store verification result
                            ↓
                    status = completed
                            ↓
                     User reviews
                            ↓
                  User may edit actions
                            ↓
                   Track over time
```

------------------------------------------------------------------------

# 22. AI Data Flow

The database should not directly communicate with the AI model.

Recommended architecture:

``` text
Frontend
   ↓
FastAPI
   ↓
Meeting Service
   ↓
AI Service
   ↓
Qualcomm Cloud AI
   ↓
Structured JSON
   ↓
Validation Layer
   ↓
Database
```

This keeps AI-specific logic separate from database logic.

------------------------------------------------------------------------

# 23. Example AI Output Stored in Database

Suppose the AI receives:

``` text
Rahul will finish the API by Friday.

Priya will review the UI tomorrow.

The team decided to use MongoDB.

Someone should prepare deployment documentation.

Testing starts after integration.
```

The database may contain:

### Meeting

``` text
title:
Backend Planning

summary:
The team selected MongoDB...
```

### Actions

``` text
1.
task = Complete API
owner = Rahul
deadline = Friday
priority = high
status = todo

2.
task = Review UI
owner = Priya
deadline = Tomorrow
priority = medium
status = todo

3.
task = Prepare deployment documentation
owner = NULL
deadline = NULL
is_unassigned = true
is_ambiguous = true
```

### Decision

``` text
decision:
The team decided to use MongoDB.
```

### Dependency

``` text
Integration → Testing
```

------------------------------------------------------------------------

# 24. User Corrections

User corrections must not destroy AI information.

Example:

``` text
AI:
owner = Rahul

User:
owner = Priya
```

Database:

``` text
ai_owner_name = Rahul
owner_name = Priya
```

Likewise:

``` text
ai_deadline = Friday
deadline = Monday
```

This allows future analysis of AI extraction quality and provides an
audit trail.

------------------------------------------------------------------------

# 25. Deletion Rules

Recommended cascade behavior:

### Delete User

``` text
User
 ↓
Meetings
 ↓
Actions
 ↓
Evidence
 ↓
Dependencies
 ↓
Decisions
 ↓
Questions
 ↓
Sources
 ↓
Verification
 ↓
Embeddings
```

Use:

``` sql
ON DELETE CASCADE
```

where child records have no independent meaning outside the parent
meeting.

### Owner User Deleted

For:

``` text
actions.owner_user_id
```

use:

``` sql
ON DELETE SET NULL
```

because the action itself should remain.

------------------------------------------------------------------------

# 26. Database Security

## Never store

-   API keys
-   Qualcomm credentials
-   JWT secrets
-   Database passwords
-   Third-party service credentials

These belong in:

``` text
.env
Secret Manager
Deployment Environment Variables
```

Example:

``` env
DATABASE_URL=...
QUALCOMM_API_KEY=...
JWT_SECRET=...
```

Never commit `.env` to Git.

------------------------------------------------------------------------

# 27. Backup Considerations

The deployed database should have:

-   Automated backups
-   Point-in-time recovery where available
-   Database migration versioning
-   Environment separation

Recommended environments:

``` text
Development
     ↓
Staging
     ↓
Production
```

------------------------------------------------------------------------

# 28. Database Migration Strategy

Use a migration tool rather than manually changing production tables.

For FastAPI/Python:

``` text
Alembic
```

Example:

``` bash
alembic init migrations
```

Then:

``` bash
alembic revision --autogenerate -m "create meeting tables"
alembic upgrade head
```

------------------------------------------------------------------------

# 29. Recommended MVP Database

For the hackathon MVP, implement these tables first:

``` text
1. users
2. meetings
3. actions
4. action_evidence
5. decisions
6. questions
7. dependencies
8. verification_results
```

Then add:

``` text
9. meeting_sources
10. meeting_embeddings
```

when document upload and semantic historical search are implemented.

------------------------------------------------------------------------

# 30. What Should NOT Be a Separate Table Initially?

Do not create separate tables for:

-   Ambiguities
-   Hallucinations
-   Conflicts
-   Meeting comparisons
-   Priority history
-   AI prompts
-   AI model metadata

These can initially be represented through existing tables:

``` text
Ambiguity
→ actions.is_ambiguous + ambiguity_reason

Hallucination
→ verification_results.unsupported_items

Conflict
→ verification_results.conflicts

Meeting comparison
→ calculated dynamically

AI extraction
→ ai_* fields in actions + verification_results
```

This keeps the MVP database simple and maintainable.

------------------------------------------------------------------------

# 31. Final Database Structure

``` text
┌──────────────────┐
│      users       │
├──────────────────┤
│ id               │
│ name             │
│ email            │
│ password_hash    │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌────────────────────────┐
│       meetings         │
├────────────────────────┤
│ id                     │
│ user_id                │
│ title                  │
│ meeting_date           │
│ original_notes         │
│ summary                │
│ language               │
│ analysis_status        │
└───────┬────────────────┘
        │
        ├───────────────┐
        │               │
        ▼               ▼
┌───────────────┐  ┌───────────────────┐
│ meeting_      │  │ verification_     │
│ sources       │  │ results            │
└───────────────┘  └───────────────────┘
        │
        │
        ├───────────────────────┐
        ▼                       ▼
┌───────────────┐       ┌────────────────┐
│    actions    │       │   decisions    │
├───────────────┤       └───────┬────────┘
│ task          │               │
│ owner         │               ▼
│ deadline      │       ┌────────────────┐
│ priority      │       │ decision_      │
│ status        │       │ evidence       │
│ confidence    │       └────────────────┘
│ ambiguity     │
└───────┬───────┘
        │
        ├───────────────┐
        ▼               ▼
┌───────────────┐  ┌────────────────┐
│ action_       │  │ dependencies   │
│ evidence      │  └────────────────┘
└───────────────┘

        meetings
           │
           ├──────────────► questions
           │
           └──────────────► meeting_embeddings
```

------------------------------------------------------------------------

# 32. Final Design Principle

The database should preserve a clear chain of trust:

``` text
ORIGINAL NOTES
      ↓
AI EXTRACTION
      ↓
EVIDENCE
      ↓
VERIFICATION
      ↓
USER CORRECTION
      ↓
FINAL ACTIONABLE DATA
```

This is the most important architectural principle of the Smart Meeting
Action Extractor.

The database is not merely storing the final AI answer. It is storing
enough information to answer:

> **"What did the AI extract, why did it extract it, what evidence
> supported it, was it verified, and did the user later change it?"**
