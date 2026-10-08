-- MeetingOS Database Schema Migration: 001_initial_schema.sql
-- Enables required extensions and creates primary relational tables

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: meetings
CREATE TABLE IF NOT EXISTS meetings (
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
        CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Table: meeting_sources (for uploaded documents: txt, pdf, docx)
CREATE TABLE IF NOT EXISTS meeting_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    storage_path TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: actions
CREATE TABLE IF NOT EXISTS actions (
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
        CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT actions_status_check
        CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
    CONSTRAINT actions_confidence_check
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CONSTRAINT actions_ai_confidence_check
        CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

-- Table: action_evidence
CREATE TABLE IF NOT EXISTS action_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    confidence DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT action_evidence_position_check
        CHECK (start_position IS NULL OR end_position IS NULL OR end_position >= start_position),
    CONSTRAINT action_evidence_confidence_check
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Table: decisions
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    confidence DECIMAL(5,4),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT decisions_confidence_check
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Table: decision_evidence
CREATE TABLE IF NOT EXISTS decision_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    start_position INTEGER,
    end_position INTEGER,
    confidence DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT decision_evidence_position_check
        CHECK (start_position IS NULL OR end_position IS NULL OR end_position >= start_position),
    CONSTRAINT decision_evidence_confidence_check
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Table: questions
CREATE TABLE IF NOT EXISTS questions (
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
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Table: dependencies
CREATE TABLE IF NOT EXISTS dependencies (
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
        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CONSTRAINT dependencies_unique
        UNIQUE (source_action_id, target_action_id, relationship)
);

-- Table: verification_results
CREATE TABLE IF NOT EXISTS verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    verification_summary TEXT,
    unsupported_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    conflicts JSONB NOT NULL DEFAULT '[]'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT verification_status_check
        CHECK (verification_status IN ('pending', 'verified', 'warning', 'failed'))
);
