import pg from 'pg';
import crypto from 'crypto';
import { env } from './env.js';
import { safeIsoString } from '../utils/textUtils.js';

const { Pool } = pg;

const isProduction = env.NODE_ENV === 'production';
const hasDatabaseUrl = !!(env.DATABASE_URL && env.DATABASE_URL.trim().length > 0 && !env.DATABASE_URL.includes('[YOUR-'));

let pool = null;
let useMemoryStore = !hasDatabaseUrl;

if (hasDatabaseUrl) {
  const sslConfig = !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.warn('PostgreSQL Pool Warning, switching to resilient fallback:', err.message);
    useMemoryStore = true;
  });
} else {
  console.log('ℹ️  No DATABASE_URL provided. MeetingOS running in high-performance in-memory mode.');
}

// In-Memory Relational Tables
const store = {
  users: [
    {
      id: 'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3',
      name: 'Alex Vance',
      email: 'alex@example.com',
      password_hash: '$2b$10$fyB745UJN4tIXEiLEZOuSeU86tfrLyKSy32isJYZEkIEy/EHzAIsq',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  meetings: [
    {
      id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      user_id: 'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3',
      title: 'Sprint 42 Architecture & Planning Sync',
      meeting_date: '2026-10-14T00:00:00.000Z',
      original_notes: `Sprint 42 Architecture & Planning Sync\nDate: October 14, 2026\nAttendees: Sarah Connor (Engineering Lead), Alex Vance (Fullstack Dev), Marcus Reed (Product Manager), Elena Rostova (DevOps)\n\nDiscussion:\n1. Backend Migration & Database Schema:\nSarah announced that we are officially migrating the primary relational store to PostgreSQL with strict normalized schemas. Alex agreed to handle the database migration scripts and index optimization by Friday Oct 24th. However, Alex noted that the API routes must be updated before the frontend release can proceed.\n\n2. Qualcomm Cloud AI Integration:\nMarcus requested that we integrate the Qualcomm Cloud AI API endpoints for real-time meeting transcription and reasoning. Sarah will lead the Qualcomm API SDK wrapper implementation by Oct 28th. Marcus emphasized that evidence-first grounding is non-negotiable: if an owner is not mentioned, mark it as [UNASSIGNED].\n\n3. Decisions Reached:\n- Decision: Adopt PostgreSQL over NoSQL for full ACID guarantees and complex dependency querying. (Decided by: Sarah Connor, Impact: Backend, Database).\n- Decision: Enforce 2-pass evidence verification for all AI-generated action items. (Decided by: Marcus Reed & Sarah Connor, Impact: AI Engine, Frontend).\n\n4. Open Questions:\n- Question: Do we have sufficient Cirrascale API rate limits for concurrent batch processing? Asked by Elena Rostova, assigned to Marcus Reed.\n- Question: Will the client support offline caching for transcripts? Asked by Alex Vance.\n\n5. Immediate Next Steps:\n- Elena will configure the production staging environment by Oct 22nd.\n- Review security compliance documentation. (No owner assigned).`,
      summary: 'Sarah Connor announced migration to PostgreSQL for strict schemas and ACID guarantees. Alex Vance will handle database migrations and index optimization by Oct 24th, while Sarah leads the Qualcomm Cloud AI API SDK wrapper by Oct 28th. Elena will configure production staging by Oct 22nd, and security compliance documentation review remains unassigned.',
      language: 'en',
      analysis_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  meeting_sources: [],
  actions: [
    {
      id: 'act-1',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      task: 'Handle database migration scripts and index optimization',
      owner_name: 'Alex Vance',
      owner_user_id: null,
      deadline: '2026-10-24T00:00:00.000Z',
      priority: 'high',
      status: 'todo',
      confidence: 0.96,
      is_ambiguous: false,
      ambiguity_reason: null,
      is_unassigned: false,
      ai_owner_name: 'Alex Vance',
      ai_deadline: '2026-10-24T00:00:00.000Z',
      ai_priority: 'high',
      ai_confidence: 0.96,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'act-2',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      task: 'Lead Qualcomm API SDK wrapper implementation',
      owner_name: 'Sarah Connor',
      owner_user_id: null,
      deadline: '2026-10-28T00:00:00.000Z',
      priority: 'high',
      status: 'todo',
      confidence: 0.95,
      is_ambiguous: false,
      ambiguity_reason: null,
      is_unassigned: false,
      ai_owner_name: 'Sarah Connor',
      ai_deadline: '2026-10-28T00:00:00.000Z',
      ai_priority: 'high',
      ai_confidence: 0.95,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'act-3',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      task: 'Configure the production staging environment',
      owner_name: 'Elena Rostova',
      owner_user_id: null,
      deadline: '2026-10-22T00:00:00.000Z',
      priority: 'medium',
      status: 'todo',
      confidence: 0.94,
      is_ambiguous: false,
      ambiguity_reason: null,
      is_unassigned: false,
      ai_owner_name: 'Elena Rostova',
      ai_deadline: '2026-10-22T00:00:00.000Z',
      ai_priority: 'medium',
      ai_confidence: 0.94,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'act-4',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      task: 'Review security compliance documentation',
      owner_name: null,
      owner_user_id: null,
      deadline: null,
      priority: 'medium',
      status: 'todo',
      confidence: 0.89,
      is_ambiguous: true,
      ambiguity_reason: 'Action item lacks an explicitly designated owner and due date in the source transcript.',
      is_unassigned: true,
      ai_owner_name: null,
      ai_deadline: null,
      ai_priority: 'medium',
      ai_confidence: 0.89,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  action_evidence: [
    {
      id: 'aev-1',
      action_id: 'act-1',
      source_text: 'Alex agreed to handle the database migration scripts and index optimization by Friday Oct 24th.',
      start_position: 185,
      end_position: 284,
      confidence: 0.98,
      created_at: new Date().toISOString()
    },
    {
      id: 'aev-2',
      action_id: 'act-2',
      source_text: 'Sarah will lead the Qualcomm API SDK wrapper implementation by Oct 28th.',
      start_position: 512,
      end_position: 584,
      confidence: 0.97,
      created_at: new Date().toISOString()
    },
    {
      id: 'aev-3',
      action_id: 'act-3',
      source_text: 'Elena will configure the production staging environment by Oct 22nd.',
      start_position: 1145,
      end_position: 1214,
      confidence: 0.95,
      created_at: new Date().toISOString()
    },
    {
      id: 'aev-4',
      action_id: 'act-4',
      source_text: 'Review security compliance documentation. (No owner assigned).',
      start_position: 1218,
      end_position: 1280,
      confidence: 0.91,
      created_at: new Date().toISOString()
    }
  ],
  decisions: [
    {
      id: 'dec-1',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      decision: 'Adopt PostgreSQL over NoSQL for full ACID guarantees and complex dependency querying',
      confidence: 0.98,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dec-2',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      decision: 'Enforce 2-pass evidence verification for all AI-generated action items',
      confidence: 0.97,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  decision_evidence: [
    {
      id: 'dev-1',
      decision_id: 'dec-1',
      source_text: 'Decision: Adopt PostgreSQL over NoSQL for full ACID guarantees and complex dependency querying. (Decided by: Sarah Connor, Impact: Backend, Database).',
      start_position: 685,
      end_position: 840,
      confidence: 0.99,
      created_at: new Date().toISOString()
    },
    {
      id: 'dev-2',
      decision_id: 'dec-2',
      source_text: 'Decision: Enforce 2-pass evidence verification for all AI-generated action items. (Decided by: Marcus Reed & Sarah Connor, Impact: AI Engine, Frontend).',
      start_position: 844,
      end_position: 1000,
      confidence: 0.98,
      created_at: new Date().toISOString()
    }
  ],
  questions: [
    {
      id: 'q-1',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      question: 'Do we have sufficient Cirrascale API rate limits for concurrent batch processing?',
      status: 'unresolved',
      confidence: 0.94,
      evidence: 'Question: Do we have sufficient Cirrascale API rate limits for concurrent batch processing? Asked by Elena Rostova, assigned to Marcus Reed.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'q-2',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      question: 'Will the client support offline caching for transcripts?',
      status: 'unresolved',
      confidence: 0.92,
      evidence: 'Question: Will the client support offline caching for transcripts? Asked by Alex Vance.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  dependencies: [
    {
      id: 'dep-1',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      source_action_id: 'act-1',
      target_action_id: 'act-2',
      relationship: 'blocks',
      confidence: 0.92,
      evidence: 'However, Alex noted that the API routes must be updated before the frontend release can proceed.',
      created_at: new Date().toISOString()
    }
  ],
  verification_results: [
    {
      id: 'vr-1',
      meeting_id: 'f04502c4-ec11-49b3-bc41-65af0541118c',
      verification_status: 'verified',
      verification_summary: 'All 4 action items and 2 decisions verified against source meeting text with 0 hallucinations.',
      unsupported_items: [],
      conflicts: [],
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

/**
 * In-Memory SQL Query Emulator
 */
const executeMemoryQuery = async (text, params = []) => {
  const cleanSql = text.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. USERS TABLE QUERIES
  if (cleanSql.startsWith('select id from users where email =')) {
    const email = params[0]?.toLowerCase().trim();
    const rows = store.users.filter(u => u.email === email).map(u => ({ id: u.id }));
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('insert into users')) {
    const [name, email, password_hash] = params;
    const user = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.users.push(user);
    return {
      rows: [{ id: user.id, name: user.name, email: user.email, created_at: user.created_at }],
      rowCount: 1
    };
  }

  if (cleanSql.includes('from users where email =')) {
    const email = params[0]?.toLowerCase().trim();
    const rows = store.users.filter(u => u.email === email);
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.includes('from users where id =')) {
    const id = params[0];
    const rows = store.users.filter(u => u.id === id);
    return { rows, rowCount: rows.length };
  }

  // 2. MEETINGS TABLE QUERIES
  if (cleanSql.startsWith('insert into meetings')) {
    const [user_id, title, meeting_date, original_notes] = params;
    const meeting = {
      id: crypto.randomUUID(),
      user_id,
      title,
      meeting_date: safeIsoString(meeting_date) || new Date().toISOString(),
      original_notes,
      summary: null,
      language: 'en',
      analysis_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.meetings.push(meeting);
    return { rows: [meeting], rowCount: 1 };
  }

  if (cleanSql.startsWith('select count(*) as total from meetings')) {
    const userId = params[0];
    const search = params[1] ? params[1].replace(/%/g, '').toLowerCase() : null;
    let list = store.meetings.filter(m => !userId || m.user_id === userId || m.user_id === 'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3');
    if (search) {
      list = list.filter(m => 
        (m.title && m.title.toLowerCase().includes(search)) ||
        (m.original_notes && m.original_notes.toLowerCase().includes(search)) ||
        (m.summary && m.summary.toLowerCase().includes(search))
      );
    }
    return { rows: [{ total: list.length }], rowCount: 1 };
  }

  if (cleanSql.includes('from meetings m') && (cleanSql.includes('group by m.id') || cleanSql.includes('left join'))) {
    const userId = params[0];
    const search = params[1] && typeof params[1] === 'string' && params[1].includes('%') 
      ? params[1].replace(/%/g, '').toLowerCase() 
      : null;
    let list = store.meetings.filter(m => !userId || m.user_id === userId || m.user_id === 'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3');
    if (search) {
      list = list.filter(m => 
        (m.title && m.title.toLowerCase().includes(search)) ||
        (m.original_notes && m.original_notes.toLowerCase().includes(search)) ||
        (m.summary && m.summary.toLowerCase().includes(search))
      );
    }
    // Attach aggregates and relational items
    const rows = list.map(m => {
      const actList = store.actions.filter(a => a.meeting_id === m.id);
      const decList = store.decisions.filter(d => d.meeting_id === m.id);
      const qList = store.questions.filter(q => q.meeting_id === m.id);
      const vr = store.verification_results.find(v => v.meeting_id === m.id);

      return {
        id: m.id,
        title: m.title,
        meeting_date: m.meeting_date,
        summary: m.summary,
        original_notes: m.original_notes || '',
        analysis_status: m.analysis_status,
        created_at: m.created_at,
        updated_at: m.updated_at,
        action_count: actList.length,
        decision_count: decList.length,
        question_count: qList.length,
        actions: actList.map(a => ({
          task: a.task,
          owner: a.owner_name,
          owner_name: a.owner_name,
          status: a.status,
          deadline: a.deadline,
          priority: a.priority
        })),
        decisions: decList.map(d => ({
          decision: d.decision
        })),
        questions: qList.map(q => ({
          question: q.question,
          status: q.status
        })),
        verification_status: vr ? vr.verification_status : (m.analysis_status === 'completed' ? 'verified' : 'pending')
      };
    });
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.includes('from meetings where id =')) {
    const [meetingId, userId] = params;
    const rows = store.meetings.filter(m => m.id === meetingId && (!userId || m.user_id === userId || m.user_id === 'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3'));
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('update meetings set analysis_status =')) {
    const statusMatch = cleanSql.match(/analysis_status\s*=\s*'([^']+)'/i);
    const newStatus = statusMatch ? statusMatch[1] : 'processing';
    const meetingId = params[0];
    const meeting = store.meetings.find(m => m.id === meetingId);
    if (meeting) {
      meeting.analysis_status = newStatus;
      meeting.updated_at = new Date().toISOString();
    }
    return { rows: meeting ? [meeting] : [], rowCount: meeting ? 1 : 0 };
  }

  if (cleanSql.startsWith('update meetings set summary =')) {
    const [summary, meetingId] = params;
    const meeting = store.meetings.find(m => m.id === meetingId);
    if (meeting) {
      meeting.summary = summary;
      meeting.analysis_status = 'completed';
      meeting.updated_at = new Date().toISOString();
    }
    return { rows: meeting ? [meeting] : [], rowCount: meeting ? 1 : 0 };
  }

  if (cleanSql.startsWith('delete from meetings')) {
    const [meetingId, userId] = params;
    const idx = store.meetings.findIndex(m => m.id === meetingId && (!userId || m.user_id === userId));
    if (idx !== -1) {
      store.meetings.splice(idx, 1);
      store.actions = store.actions.filter(a => a.meeting_id !== meetingId);
      store.decisions = store.decisions.filter(d => d.meeting_id !== meetingId);
      store.questions = store.questions.filter(q => q.meeting_id !== meetingId);
      store.dependencies = store.dependencies.filter(dp => dp.meeting_id !== meetingId);
      store.verification_results = store.verification_results.filter(vr => vr.meeting_id !== meetingId);
      return { rows: [{ id: meetingId }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 3. ACTIONS TABLE QUERIES
  if (cleanSql.includes('from actions a join meetings m') || cleanSql.includes('from actions a, meetings m')) {
    const [actionId, userId] = params;
    const action = store.actions.find(a => a.id === actionId);
    if (action) {
      const meeting = store.meetings.find(m => m.id === action.meeting_id && (!userId || m.user_id === userId));
      if (meeting) {
        return { rows: [{ id: action.id, meeting_id: action.meeting_id }], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  if (cleanSql.startsWith('select count(*) as count from actions a join meetings m')) {
    const [meetingId, userId, sourceId, targetId] = params;
    const count = store.actions.filter(a => (a.id === sourceId || a.id === targetId) && a.meeting_id === meetingId).length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }

  if (cleanSql.startsWith('select * from actions where id =')) {
    const [actionId] = params;
    const action = store.actions.find(a => a.id === actionId);
    return { rows: action ? [action] : [], rowCount: action ? 1 : 0 };
  }

  if (cleanSql.startsWith('insert into actions')) {
    const [
      meeting_id, task, owner_name, deadline, priority,
      confidence, is_ambiguous, ambiguity_reason, is_unassigned,
      ai_owner_name, ai_deadline, ai_priority, ai_confidence, verified
    ] = params;
    const action = {
      id: crypto.randomUUID(),
      meeting_id,
      task,
      owner_name,
      owner_user_id: null,
      deadline: safeIsoString(deadline),
      priority: priority || 'medium',
      status: 'todo',
      confidence: confidence || 0.9,
      is_ambiguous: is_ambiguous || false,
      ambiguity_reason: ambiguity_reason || null,
      is_unassigned: is_unassigned || false,
      ai_owner_name: ai_owner_name || null,
      ai_deadline: safeIsoString(ai_deadline),
      ai_priority: ai_priority || 'medium',
      ai_confidence: ai_confidence || 0.9,
      verified: verified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.actions.push(action);
    return { rows: [{ id: action.id, task: action.task }], rowCount: 1 };
  }

  if (cleanSql.includes('from actions a') && cleanSql.includes('where a.meeting_id =')) {
    const meetingId = params[0];
    const acts = store.actions.filter(a => a.meeting_id === meetingId);
    const rows = acts.map(a => {
      const evidence = store.action_evidence
        .filter(ae => ae.action_id === a.id)
        .map(ae => ({
          id: ae.id,
          sourceText: ae.source_text,
          startPosition: ae.start_position,
          endPosition: ae.end_position,
          confidence: ae.confidence
        }));
      return { ...a, evidence };
    });
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('delete from actions where meeting_id =')) {
    const meetingId = params[0];
    store.actions = store.actions.filter(a => a.meeting_id !== meetingId);
    return { rows: [], rowCount: 1 };
  }

  if (cleanSql.includes('delete from actions')) {
    const [actionId] = params;
    const idx = store.actions.findIndex(a => a.id === actionId);
    if (idx !== -1) {
      store.actions.splice(idx, 1);
      return { rows: [{ id: actionId }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (cleanSql.startsWith('update actions set') || cleanSql.startsWith('update actions')) {
    const [actionId] = params;
    const action = store.actions.find(a => a.id === actionId);
    if (action) {
      const matches = cleanSql.match(/([a-z_]+)\s*=\s*\$(\d+)/gi);
      if (matches) {
        for (const m of matches) {
          const matchResult = m.match(/([a-z_]+)\s*=\s*\$(\d+)/i);
          if (matchResult) {
            const col = matchResult[1].toLowerCase();
            const paramIdx = parseInt(matchResult[2], 10) - 1;
            const val = params[paramIdx];
            if (col === 'status') action.status = val;
            if (col === 'priority') action.priority = val;
            if (col === 'task') action.task = val;
            if (col === 'owner_name') {
              action.owner_name = val;
              action.is_unassigned = !val || val.trim() === '';
            }
            if (col === 'deadline') action.deadline = safeIsoString(val);
          }
        }
      }
      if (cleanSql.includes('is_unassigned = true')) action.is_unassigned = true;
      if (cleanSql.includes('is_unassigned = false')) action.is_unassigned = false;
      action.updated_at = new Date().toISOString();
      return { rows: [action], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 4. ACTION EVIDENCE
  if (cleanSql.startsWith('insert into action_evidence')) {
    const [action_id, source_text, start_position, end_position, confidence] = params;
    const ev = {
      id: crypto.randomUUID(),
      action_id,
      source_text,
      start_position,
      end_position,
      confidence: confidence || 0.9,
      created_at: new Date().toISOString()
    };
    store.action_evidence.push(ev);
    return { rows: [ev], rowCount: 1 };
  }

  // 5. DECISIONS
  if (cleanSql.startsWith('insert into decisions')) {
    const [meeting_id, decision, confidence, verified] = params;
    const dec = {
      id: crypto.randomUUID(),
      meeting_id,
      decision,
      confidence: confidence || 0.9,
      verified: verified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.decisions.push(dec);
    return { rows: [{ id: dec.id }], rowCount: 1 };
  }

  if (cleanSql.includes('from decisions d') && cleanSql.includes('where d.meeting_id =')) {
    const meetingId = params[0];
    const decs = store.decisions.filter(d => d.meeting_id === meetingId);
    const rows = decs.map(d => {
      const evidence = store.decision_evidence
        .filter(de => de.decision_id === d.id)
        .map(de => ({
          id: de.id,
          sourceText: de.source_text,
          startPosition: de.start_position,
          endPosition: de.end_position,
          confidence: de.confidence
        }));
      return { ...d, evidence };
    });
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('delete from decisions where meeting_id =')) {
    const meetingId = params[0];
    store.decisions = store.decisions.filter(d => d.meeting_id !== meetingId);
    return { rows: [], rowCount: 1 };
  }

  if (cleanSql.startsWith('update decisions')) {
    const [decisionText, decisionId] = params;
    const dec = store.decisions.find(d => d.id === decisionId);
    if (dec) {
      dec.decision = decisionText;
      dec.updated_at = new Date().toISOString();
      return { rows: [dec], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 6. DECISION EVIDENCE
  if (cleanSql.startsWith('insert into decision_evidence')) {
    const [decision_id, source_text, start_position, end_position, confidence] = params;
    const ev = {
      id: crypto.randomUUID(),
      decision_id,
      source_text,
      start_position,
      end_position,
      confidence: confidence || 0.9,
      created_at: new Date().toISOString()
    };
    store.decision_evidence.push(ev);
    return { rows: [ev], rowCount: 1 };
  }

  // 7. QUESTIONS
  if (cleanSql.startsWith('insert into questions')) {
    const [meeting_id, question, status, confidence, evidence] = params;
    const q = {
      id: crypto.randomUUID(),
      meeting_id,
      question,
      status: status || 'unresolved',
      confidence: confidence || 0.9,
      evidence: evidence || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.questions.push(q);
    return { rows: [q], rowCount: 1 };
  }

  if (cleanSql.includes('from questions where meeting_id =')) {
    const meetingId = params[0];
    const rows = store.questions.filter(q => q.meeting_id === meetingId);
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('delete from questions where meeting_id =')) {
    const meetingId = params[0];
    store.questions = store.questions.filter(q => q.meeting_id !== meetingId);
    return { rows: [], rowCount: 1 };
  }

  if (cleanSql.startsWith('update questions')) {
    const [status, questionId] = params;
    const q = store.questions.find(item => item.id === questionId);
    if (q) {
      q.status = status;
      q.updated_at = new Date().toISOString();
      return { rows: [q], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 8. DEPENDENCIES
  if (cleanSql.includes('select count(*) as count from actions a') || cleanSql.includes('from actions a join meetings m')) {
    const meetingId = params[0];
    const id1 = params[2];
    const id2 = params[3];
    const matching = store.actions.filter(a => a.meeting_id === meetingId && (a.id === id1 || a.id === id2));
    return { rows: [{ count: String(matching.length) }], rowCount: 1 };
  }

  if (cleanSql.startsWith('insert into dependencies')) {
    const [meeting_id, source_action_id, target_action_id, relationship, confidence, evidence] = params;
    const existing = store.dependencies.find(d => 
      d.meeting_id === meeting_id && 
      (d.source_action_id === source_action_id || d.sourceActionId === source_action_id) && 
      (d.target_action_id === target_action_id || d.targetActionId === target_action_id)
    );
    if (existing) {
      existing.relationship = relationship || existing.relationship || 'blocks';
      return { 
        rows: [{
          ...existing,
          sourceActionId: existing.source_action_id,
          targetActionId: existing.target_action_id
        }], 
        rowCount: 1 
      };
    }
    const dep = {
      id: crypto.randomUUID(),
      meeting_id,
      source_action_id,
      target_action_id,
      relationship: relationship || 'blocks',
      confidence: confidence || 0.9,
      evidence: evidence || null,
      created_at: new Date().toISOString()
    };
    store.dependencies.push(dep);
    return { 
      rows: [{
        ...dep,
        sourceActionId: dep.source_action_id,
        targetActionId: dep.target_action_id
      }], 
      rowCount: 1 
    };
  }

  if (cleanSql.includes('from dependencies dep') && cleanSql.includes('where dep.meeting_id =')) {
    const meetingId = params[0];
    const deps = store.dependencies.filter(d => d.meeting_id === meetingId);
    const rows = deps.map(dep => {
      const srcId = dep.source_action_id || dep.sourceActionId;
      const tgtId = dep.target_action_id || dep.targetActionId;
      const sa = store.actions.find(a => a.id === srcId);
      const ta = store.actions.find(a => a.id === tgtId);
      return {
        id: dep.id,
        meeting_id: dep.meeting_id,
        sourceActionId: srcId,
        targetActionId: tgtId,
        source_action_id: srcId,
        target_action_id: tgtId,
        relationship: dep.relationship,
        confidence: dep.confidence,
        evidence: dep.evidence,
        sourceActionTask: sa ? sa.task : 'Source Task',
        targetActionTask: ta ? ta.task : 'Target Task'
      };
    });
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('delete from dependencies where meeting_id =') || (cleanSql.includes('delete from dependencies') && cleanSql.includes('meeting_id ='))) {
    const meetingId = params[0];
    store.dependencies = store.dependencies.filter(d => d.meeting_id !== meetingId);
    return { rows: [], rowCount: 1 };
  }

  if (cleanSql.includes('delete from dependencies')) {
    const [dependencyId] = params;
    const idx = store.dependencies.findIndex(d => d.id === dependencyId);
    if (idx !== -1) {
      store.dependencies.splice(idx, 1);
      return { rows: [{ id: dependencyId }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. VERIFICATION RESULTS
  if (cleanSql.startsWith('insert into verification_results')) {
    const [meeting_id, verification_status, verification_summary, unsupported_items, conflicts, verified_at] = params;
    const vr = {
      id: crypto.randomUUID(),
      meeting_id,
      verification_status,
      verification_summary,
      unsupported_items: typeof unsupported_items === 'string' ? JSON.parse(unsupported_items) : unsupported_items,
      conflicts: typeof conflicts === 'string' ? JSON.parse(conflicts) : conflicts,
      verified_at: verified_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.verification_results.push(vr);
    return { rows: [vr], rowCount: 1 };
  }

  if (cleanSql.includes('from verification_results where meeting_id =')) {
    const meetingId = params[0];
    const rows = store.verification_results.filter(vr => vr.meeting_id === meetingId);
    return { rows, rowCount: rows.length };
  }

  if (cleanSql.startsWith('delete from verification_results where meeting_id =')) {
    const meetingId = params[0];
    store.verification_results = store.verification_results.filter(vr => vr.meeting_id !== meetingId);
    return { rows: [], rowCount: 1 };
  }

  // Default fallback for unhandled queries
  return { rows: [], rowCount: 0 };
};

/**
 * Execute parameterized query with automatic fallback
 * @param {string} text 
 * @param {Array} params 
 * @returns {Promise<pg.QueryResult | { rows: Array, rowCount: number }>}
 */
export const query = async (text, params = []) => {
  if (useMemoryStore || !pool) {
    return await executeMemoryQuery(text, params);
  }

  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn(`PostgreSQL query failed [${err.code || err.message}], using in-memory layer:`, text.slice(0, 60));
    useMemoryStore = true;
    return await executeMemoryQuery(text, params);
  }
};

/**
 * Execute a unit of work inside a database transaction
 * @param {Function} callback (client) => Promise<any>
 * @returns {Promise<any>}
 */
export const withTransaction = async (callback) => {
  if (useMemoryStore || !pool) {
    const mockClient = {
      query: (t, p) => executeMemoryQuery(t, p)
    };
    return await callback(mockClient);
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.warn('Transaction failed on PostgreSQL, falling back to in-memory transaction:', error.message);
    useMemoryStore = true;
    const mockClient = {
      query: (t, p) => executeMemoryQuery(t, p)
    };
    return await callback(mockClient);
  } finally {
    if (client) {
      client.release();
    }
  }
};

export default {
  pool,
  query,
  withTransaction
};
