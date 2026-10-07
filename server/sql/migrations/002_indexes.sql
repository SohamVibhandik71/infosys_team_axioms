-- MeetingOS Database Indexes Migration: 002_indexes.sql
-- Creates performance indexes for query optimization

-- Meetings Indexes
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(analysis_status);

-- Actions Indexes
CREATE INDEX IF NOT EXISTS idx_actions_meeting_id ON actions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_actions_owner_user_id ON actions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_deadline ON actions(deadline);
CREATE INDEX IF NOT EXISTS idx_actions_priority ON actions(priority);

-- Decisions Indexes
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);

-- Questions Indexes
CREATE INDEX IF NOT EXISTS idx_questions_meeting_id ON questions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- Dependencies Indexes
CREATE INDEX IF NOT EXISTS idx_dependencies_meeting_id ON dependencies(meeting_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_source ON dependencies(source_action_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_target ON dependencies(target_action_id);

-- Evidence Indexes
CREATE INDEX IF NOT EXISTS idx_action_evidence_action_id ON action_evidence(action_id);
CREATE INDEX IF NOT EXISTS idx_decision_evidence_decision_id ON decision_evidence(decision_id);
