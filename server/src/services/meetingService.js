import { query, withTransaction } from '../config/db.js';
import { normalizeText, parseFlexibleDate } from '../utils/textUtils.js';
import { extractStructuredIntelligence } from './extractionService.js';
import { verifyExtraction } from './verificationService.js';
import { callQualcommChatCompletion } from './aiService.js';

/**
 * Creates a new meeting from text or uploaded document
 */
export const createMeeting = async ({ userId, title, meetingDate, notes, originalSource = null }) => {
  const normalizedNotes = normalizeText(notes);
  const parsedDate = parseFlexibleDate(meetingDate) || new Date();

  return await withTransaction(async (client) => {
    // 1. Insert meeting
    const meetingResult = await client.query(
      `INSERT INTO meetings (user_id, title, meeting_date, original_notes, analysis_status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, user_id, title, meeting_date, original_notes, summary, language, analysis_status, created_at, updated_at`,
      [userId, title.trim(), parsedDate, normalizedNotes]
    );

    const meeting = meetingResult.rows[0];

    // 2. If uploaded file source is present, insert into meeting_sources
    if (originalSource) {
      await client.query(
        `INSERT INTO meeting_sources (meeting_id, file_name, file_type, file_size, extracted_text)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          meeting.id,
          originalSource.fileName,
          originalSource.fileType,
          originalSource.fileSize || 0,
          normalizedNotes
        ]
      );
    }

    return meeting;
  });
};

/**
 * Lists meetings for a specific user with pagination, search, and aggregate stats
 */
export const listMeetings = async ({ userId, page = 1, limit = 20, search, sortBy = 'meeting_date', order = 'desc' }) => {
  const offset = (page - 1) * limit;
  const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sortColumn = ['meeting_date', 'created_at', 'title'].includes(sortBy) ? sortBy : 'meeting_date';

  const whereConditions = ['m.user_id = $1'];
  const params = [userId];

  if (search && search.trim().length > 0) {
    params.push(`%${search.trim()}%`);
    whereConditions.push(`(m.title ILIKE $${params.length} OR m.original_notes ILIKE $${params.length} OR m.summary ILIKE $${params.length})`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Query Total Count
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM meetings m WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Query Data with Counts
  // Query Data with Counts
  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT 
      m.id,
      m.title,
      m.meeting_date,
      m.summary,
      m.analysis_status,
      m.created_at,
      m.updated_at,
      COUNT(DISTINCT a.id)::int AS action_count,
      COUNT(DISTINCT d.id)::int AS decision_count,
      COUNT(DISTINCT q.id)::int AS question_count,
      vr.verification_status,
      COALESCE(
        CASE 
          WHEN ms.file_type ILIKE '%video%' OR ms.file_name ILIKE '%.mp4' OR ms.file_name ILIKE '%.mov' OR ms.file_name ILIKE '%.mkv' THEN 'video'
          WHEN ms.file_type ILIKE '%audio%' OR ms.file_name ILIKE '%.mp3' OR ms.file_name ILIKE '%.wav' OR ms.file_name ILIKE '%.m4a' OR ms.file_name ILIKE '%.webm' OR ms.file_name ILIKE '%.ogg' OR ms.file_name ILIKE '%.aac' OR ms.file_name ILIKE '%.flac' THEN 'audio'
          WHEN ms.file_type ILIKE '%pdf%' OR ms.file_name ILIKE '%.pdf' THEN 'pdf'
          WHEN ms.file_type ILIKE '%word%' OR ms.file_name ILIKE '%.docx' OR ms.file_name ILIKE '%.doc' THEN 'docx'
          WHEN ms.file_type IS NOT NULL THEN 'file'
          ELSE 'text'
        END,
        'text'
      ) AS source_type,
      ms.file_name AS source_file_name
    FROM meetings m
    LEFT JOIN actions a ON a.meeting_id = m.id
    LEFT JOIN decisions d ON d.meeting_id = m.id
    LEFT JOIN questions q ON q.meeting_id = m.id
    LEFT JOIN verification_results vr ON vr.meeting_id = m.id
    LEFT JOIN LATERAL (
      SELECT file_name, file_type 
      FROM meeting_sources 
      WHERE meeting_id = m.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) ms ON true
    WHERE ${whereClause}
    GROUP BY m.id, vr.verification_status, ms.file_type, ms.file_name
    ORDER BY m.${sortColumn} ${sortDirection}
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const dataResult = await query(dataQuery, dataParams);

  return {
    meetings: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves a single meeting and all its associated structured intelligence
 */
export const getMeetingById = async ({ meetingId, userId }) => {
  // 1. Fetch meeting and verify user ownership
  const meetingResult = await query(
    `SELECT 
       m.id, 
       m.user_id, 
       m.title, 
       m.meeting_date, 
       m.original_notes, 
       m.summary, 
       m.language, 
       m.analysis_status, 
       m.created_at, 
       m.updated_at,
       COALESCE(
         CASE 
           WHEN ms.file_type ILIKE '%video%' OR ms.file_name ILIKE '%.mp4' OR ms.file_name ILIKE '%.mov' OR ms.file_name ILIKE '%.mkv' THEN 'video'
           WHEN ms.file_type ILIKE '%audio%' OR ms.file_name ILIKE '%.mp3' OR ms.file_name ILIKE '%.wav' OR ms.file_name ILIKE '%.m4a' OR ms.file_name ILIKE '%.webm' OR ms.file_name ILIKE '%.ogg' OR ms.file_name ILIKE '%.aac' OR ms.file_name ILIKE '%.flac' THEN 'audio'
           WHEN ms.file_type ILIKE '%pdf%' OR ms.file_name ILIKE '%.pdf' THEN 'pdf'
           WHEN ms.file_type ILIKE '%word%' OR ms.file_name ILIKE '%.docx' OR ms.file_name ILIKE '%.doc' THEN 'docx'
           WHEN ms.file_type IS NOT NULL THEN 'file'
           ELSE 'text'
         END,
         'text'
       ) AS source_type,
       ms.file_name AS source_file_name,
       ms.file_size AS source_file_size
     FROM meetings m
     LEFT JOIN LATERAL (
       SELECT file_name, file_type, file_size 
       FROM meeting_sources 
       WHERE meeting_id = m.id 
       ORDER BY created_at DESC 
       LIMIT 1
     ) ms ON true
     WHERE m.id = $1 AND m.user_id = $2`,
    [meetingId, userId]
  );

  if (meetingResult.rows.length === 0) {
    const error = new Error('Meeting not found or you do not have permission to view it');
    error.statusCode = 404;
    error.code = 'MEETING_NOT_FOUND';
    throw error;
  }

  const meeting = meetingResult.rows[0];

  // 2. Fetch actions with evidence
  const actionsResult = await query(
    `SELECT 
      a.id,
      a.meeting_id,
      a.task,
      a.owner_name,
      a.owner_user_id,
      a.deadline,
      a.priority,
      a.status,
      a.confidence,
      a.is_ambiguous,
      a.ambiguity_reason,
      a.is_unassigned,
      a.ai_owner_name,
      a.ai_deadline,
      a.ai_priority,
      a.ai_confidence,
      a.verified,
      a.created_at,
      a.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ae.id,
            'sourceText', ae.source_text,
            'startPosition', ae.start_position,
            'endPosition', ae.end_position,
            'confidence', ae.confidence
          )
        ) FILTER (WHERE ae.id IS NOT NULL),
        '[]'
      ) AS evidence
     FROM actions a
     LEFT JOIN action_evidence ae ON ae.action_id = a.id
     WHERE a.meeting_id = $1
     GROUP BY a.id
     ORDER BY a.created_at ASC`,
    [meetingId]
  );

  // 3. Fetch decisions with evidence
  const decisionsResult = await query(
    `SELECT 
      d.id,
      d.meeting_id,
      d.decision,
      d.confidence,
      d.verified,
      d.created_at,
      d.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', de.id,
            'sourceText', de.source_text,
            'startPosition', de.start_position,
            'endPosition', de.end_position,
            'confidence', de.confidence
          )
        ) FILTER (WHERE de.id IS NOT NULL),
        '[]'
      ) AS evidence
     FROM decisions d
     LEFT JOIN decision_evidence de ON de.decision_id = d.id
     WHERE d.meeting_id = $1
     GROUP BY d.id
     ORDER BY d.created_at ASC`,
    [meetingId]
  );

  // 4. Fetch questions
  const questionsResult = await query(
    `SELECT id, meeting_id, question, status, confidence, evidence, created_at, updated_at
     FROM questions
     WHERE meeting_id = $1
     ORDER BY created_at ASC`,
    [meetingId]
  );

  // 5. Fetch dependencies
  const dependenciesResult = await query(
    `SELECT 
      dep.id,
      dep.meeting_id,
      dep.source_action_id AS "sourceActionId",
      dep.target_action_id AS "targetActionId",
      dep.relationship,
      dep.confidence,
      dep.evidence,
      sa.task AS "sourceActionTask",
      ta.task AS "targetActionTask"
     FROM dependencies dep
     JOIN actions sa ON sa.id = dep.source_action_id
     JOIN actions ta ON ta.id = dep.target_action_id
     WHERE dep.meeting_id = $1
     ORDER BY dep.created_at ASC`,
    [meetingId]
  );

  // 6. Fetch verification results
  const verificationResult = await query(
    `SELECT id, meeting_id, verification_status, verification_summary, unsupported_items, conflicts, verified_at, updated_at
     FROM verification_results
     WHERE meeting_id = $1`,
    [meetingId]
  );

  // Dynamically enrich decisions with decision maker, rationale, and impacted areas
  const enrichedDecisions = decisionsResult.rows.map((d) => {
    let decisionMaker = d.decision_maker || d.decided_by || null;
    let impactedAreas = Array.isArray(d.impacted_areas) ? d.impacted_areas : [];
    let rationale = d.rationale || null;

    const evidenceList = Array.isArray(d.evidence) ? d.evidence : d.evidence ? [d.evidence] : [];
    const textSources = [
      ...evidenceList.map((e) => (typeof e === 'string' ? e : e?.sourceText || e?.source_text || '')),
      d.decision || '',
      d.title || ''
    ].filter(Boolean);

    const fullText = textSources.join('\n');

    if (!decisionMaker && fullText) {
      const decidedByMatch = fullText.match(/(?:decided\s*by|decision\s*maker|agreed\s*by|approved\s*by|led\s*by|championed\s*by|owner):\s*([^,;.()\r\n]+(?:\s*&\s*[^,;.()\r\n]+)?)/i);
      if (decidedByMatch && decidedByMatch[1]) {
        decisionMaker = decidedByMatch[1].trim();
      }
    }

    if (impactedAreas.length === 0 && fullText) {
      const impactMatch = fullText.match(/(?:impact(?:ed\s*areas?)?):\s*([^.)\r\n]+)/i);
      if (impactMatch && impactMatch[1]) {
        impactedAreas = impactMatch[1].split(/[,/|]/).map((s) => s.trim()).filter(Boolean);
      }
    }

    if (!rationale && fullText) {
      const rationaleMatch = fullText.match(/(?:rationale|context|reason|because):\s*([^.)\r\n]+)/i);
      if (rationaleMatch && rationaleMatch[1]) {
        rationale = rationaleMatch[1].trim();
      }
    }

    if (!decisionMaker) {
      if (Array.isArray(meeting.attendees) && meeting.attendees.length === 1 && meeting.attendees[0]) {
        decisionMaker = meeting.attendees[0];
      } else {
        decisionMaker = 'Team Consensus';
      }
    }

    return {
      ...d,
      decision_maker: decisionMaker,
      decided_by: decisionMaker,
      impacted_areas: impactedAreas,
      rationale: rationale
    };
  });

  return {
    meeting,
    actions: actionsResult.rows,
    decisions: enrichedDecisions,
    questions: questionsResult.rows,
    dependencies: dependenciesResult.rows,
    verification: verificationResult.rows[0] || null
  };
};

/**
 * Updates editable fields of a meeting
 */
export const updateMeeting = async ({ meetingId, userId, updateData }) => {
  const fields = [];
  const params = [meetingId, userId];

  if (updateData.title !== undefined) {
    params.push(updateData.title.trim());
    fields.push(`title = $${params.length}`);
  }

  if (updateData.meetingDate !== undefined) {
    params.push(new Date(updateData.meetingDate));
    fields.push(`meeting_date = $${params.length}`);
  }

  if (updateData.summary !== undefined) {
    params.push(updateData.summary);
    fields.push(`summary = $${params.length}`);
  }

  if (fields.length === 0) {
    return await getMeetingById({ meetingId, userId });
  }

  fields.push('updated_at = NOW()');

  const updateQuery = `
    UPDATE meetings
    SET ${fields.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING id, title, meeting_date, summary, analysis_status, updated_at
  `;

  const result = await query(updateQuery, params);

  if (result.rows.length === 0) {
    const error = new Error('Meeting not found or you do not have permission to update it');
    error.statusCode = 404;
    error.code = 'MEETING_NOT_FOUND';
    throw error;
  }

  return result.rows[0];
};

/**
 * Deletes a meeting and cascades deletion of all dependent records
 */
export const deleteMeeting = async ({ meetingId, userId }) => {
  const result = await query(
    `DELETE FROM meetings
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [meetingId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Meeting not found or you do not have permission to delete it');
    error.statusCode = 404;
    error.code = 'MEETING_NOT_FOUND';
    throw error;
  }

  return true;
};

/**
 * End-to-End AI Processing Pipeline
 * Qualcomm Cloud AI -> Structured Extraction -> Zod Validation -> 2-Pass Verification -> PostgreSQL Transaction
 */
export const processMeetingPipeline = async ({ meetingId, userId }) => {
  // 1. Fetch meeting & verify ownership
  const meetingQuery = await query(
    'SELECT id, original_notes, title FROM meetings WHERE id = $1 AND user_id = $2',
    [meetingId, userId]
  );

  if (meetingQuery.rows.length === 0) {
    const error = new Error('Meeting not found or you do not have permission to process it');
    error.statusCode = 404;
    error.code = 'MEETING_NOT_FOUND';
    throw error;
  }

  const meeting = meetingQuery.rows[0];

  // Update status to processing
  await query("UPDATE meetings SET analysis_status = 'processing' WHERE id = $1", [meetingId]);

  try {
    // 2. Qualcomm Cloud AI Structured Extraction
    const extractionResult = await extractStructuredIntelligence(meeting.original_notes);

    // 3. 2-Pass Verification & Hallucination/Conflict Detection
    const { verifiedExtraction, verificationResult } = await verifyExtraction(
      extractionResult,
      meeting.original_notes
    );

    // 4. Atomic PostgreSQL Transaction to persist all intelligence
    await withTransaction(async (client) => {
      // Clear previous extractions if reprocessing
      await client.query('DELETE FROM dependencies WHERE meeting_id = $1', [meetingId]);
      await client.query('DELETE FROM actions WHERE meeting_id = $1', [meetingId]);
      await client.query('DELETE FROM decisions WHERE meeting_id = $1', [meetingId]);
      await client.query('DELETE FROM questions WHERE meeting_id = $1', [meetingId]);
      await client.query('DELETE FROM verification_results WHERE meeting_id = $1', [meetingId]);

      // Update meeting summary and status
      await client.query(
        `UPDATE meetings 
         SET summary = $1, analysis_status = 'completed', updated_at = NOW()
         WHERE id = $2`,
        [verifiedExtraction.summary, meetingId]
      );

      // Insert Actions & Evidence
      const taskToActionIdMap = new Map();

      for (const act of verifiedExtraction.actions) {
        const actionInsertResult = await client.query(
          `INSERT INTO actions (
            meeting_id, task, owner_name, deadline, priority, status,
            confidence, is_ambiguous, ambiguity_reason, is_unassigned,
            ai_owner_name, ai_deadline, ai_priority, ai_confidence, verified
          ) VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id, task`,
          [
            meetingId,
            act.task,
            act.owner || null,
            parseFlexibleDate(act.deadline),
            act.priority || 'medium',
            act.confidence || 0.9,
            act.is_ambiguous || false,
            act.ambiguity_reason || null,
            act.is_unassigned || false,
            act.owner || null,
            parseFlexibleDate(act.deadline),
            act.priority || 'medium',
            act.confidence || 0.9,
            act.verified || false
          ]
        );

        const createdAction = actionInsertResult.rows[0];
        taskToActionIdMap.set(createdAction.task.toLowerCase().trim(), createdAction.id);

        // Insert Evidence
        if (act.evidence?.source_text) {
          await client.query(
            `INSERT INTO action_evidence (action_id, source_text, start_position, end_position, confidence)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              createdAction.id,
              act.evidence.source_text,
              act.evidence.start_position ?? null,
              act.evidence.end_position ?? null,
              act.evidence.confidence || 0.9
            ]
          );
        }
      }

      // Insert Decisions & Evidence
      for (const dec of verifiedExtraction.decisions) {
        const decInsertResult = await client.query(
          `INSERT INTO decisions (meeting_id, decision, confidence, verified)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [meetingId, dec.decision, dec.confidence || 0.9, dec.verified || false]
        );

        const createdDecision = decInsertResult.rows[0];

        if (dec.evidence?.source_text) {
          await client.query(
            `INSERT INTO decision_evidence (decision_id, source_text, start_position, end_position, confidence)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              createdDecision.id,
              dec.evidence.source_text,
              dec.evidence.start_position ?? null,
              dec.evidence.end_position ?? null,
              dec.evidence.confidence || 0.9
            ]
          );
        }
      }

      // Insert Questions
      for (const q of verifiedExtraction.questions) {
        await client.query(
          `INSERT INTO questions (meeting_id, question, status, confidence, evidence)
           VALUES ($1, $2, $3, $4, $5)`,
          [meetingId, q.question, q.status || 'unresolved', q.confidence || 0.9, q.evidence || null]
        );
      }

      // Insert Dependencies
      for (const dep of verifiedExtraction.dependencies) {
        const sourceId = findMatchingActionId(dep.source_task, taskToActionIdMap);
        const targetId = findMatchingActionId(dep.target_task, taskToActionIdMap);

        if (sourceId && targetId && sourceId !== targetId) {
          await client.query(
            `INSERT INTO dependencies (meeting_id, source_action_id, target_action_id, relationship, confidence, evidence)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [meetingId, sourceId, targetId, dep.relationship || 'blocks', dep.confidence || 0.9, dep.evidence || null]
          );
        }
      }

      // Insert Verification Results
      await client.query(
        `INSERT INTO verification_results (
          meeting_id, verification_status, verification_summary, unsupported_items, conflicts, verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          meetingId,
          verificationResult.verification_status,
          verificationResult.verification_summary,
          JSON.stringify(verificationResult.unsupported_items || []),
          JSON.stringify(verificationResult.conflicts || []),
          verificationResult.verified_at
        ]
      );
    });

    // Return the fresh deep meeting structure
    return await getMeetingById({ meetingId, userId });
  } catch (err) {
    // Flag failure on error
    await query("UPDATE meetings SET analysis_status = 'failed' WHERE id = $1", [meetingId]);
    throw err;
  }
};

/**
 * Fuzzy/substring finder for mapping dependency task titles to created action IDs
 */
const findMatchingActionId = (taskTitle, taskMap) => {
  if (!taskTitle) return null;
  const normalized = taskTitle.toLowerCase().trim();

  // Exact match
  if (taskMap.has(normalized)) return taskMap.get(normalized);

  // Partial match
  for (const [key, id] of taskMap.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return id;
    }
  }

  return null;
};

/**
 * Updates an action item (status, priority, owner, deadline)
 */
export const updateAction = async ({ actionId, userId, updateData }) => {
  // Verify ownership
  const actionCheck = await query(
    `SELECT a.id, a.meeting_id FROM actions a
     JOIN meetings m ON m.id = a.meeting_id
     WHERE a.id = $1 AND m.user_id = $2`,
    [actionId, userId]
  );

  if (actionCheck.rows.length === 0) {
    const error = new Error('Action item not found or you do not have permission to modify it');
    error.statusCode = 404;
    error.code = 'ACTION_NOT_FOUND';
    throw error;
  }

  const fields = [];
  const params = [actionId];

  if (updateData.status !== undefined) {
    params.push(updateData.status);
    fields.push(`status = $${params.length}`);
  }

  if (updateData.priority !== undefined) {
    params.push(updateData.priority);
    fields.push(`priority = $${params.length}`);
  }

  if (updateData.ownerName !== undefined) {
    params.push(updateData.ownerName?.trim() || null);
    fields.push(`owner_name = $${params.length}`);
    fields.push(`is_unassigned = ${!updateData.ownerName || updateData.ownerName.trim() === ''}`);
  }

  if (updateData.deadline !== undefined) {
    params.push(parseFlexibleDate(updateData.deadline));
    fields.push(`deadline = $${params.length}`);
  }

  if (updateData.task !== undefined) {
    params.push(updateData.task.trim());
    fields.push(`task = $${params.length}`);
  }

  if (fields.length === 0) {
    const res = await query('SELECT * FROM actions WHERE id = $1', [actionId]);
    return res.rows[0];
  }

  fields.push('updated_at = NOW()');

  const updateQuery = `
    UPDATE actions
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(updateQuery, params);
  return result.rows[0];
};

/**
 * Deletes an action item
 */
export const deleteAction = async ({ actionId, userId }) => {
  const result = await query(
    `DELETE FROM actions a
     USING meetings m
     WHERE a.id = $1 AND a.meeting_id = m.id AND m.user_id = $2
     RETURNING a.id`,
    [actionId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Action not found or you do not have permission to delete it');
    error.statusCode = 404;
    error.code = 'ACTION_NOT_FOUND';
    throw error;
  }

  return true;
};

/**
 * Updates a decision item
 */
export const updateDecision = async ({ decisionId, userId, decisionText }) => {
  const result = await query(
    `UPDATE decisions d
     SET decision = $1, updated_at = NOW()
     FROM meetings m
     WHERE d.id = $2 AND d.meeting_id = m.id AND m.user_id = $3
     RETURNING d.*`,
    [decisionText.trim(), decisionId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Decision not found or you do not have permission to modify it');
    error.statusCode = 404;
    error.code = 'DECISION_NOT_FOUND';
    throw error;
  }

  return result.rows[0];
};

/**
 * Updates a question status (resolved / unresolved)
 */
export const resolveQuestion = async ({ questionId, userId, status, answer }) => {
  const result = await query(
    `UPDATE questions q
     SET status = $1, updated_at = NOW()
     FROM meetings m
     WHERE q.id = $2 AND q.meeting_id = m.id AND m.user_id = $3
     RETURNING q.*`,
    [status, questionId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Question not found or you do not have permission to modify it');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  const updatedQ = result.rows[0];
  if (answer) {
    updatedQ.answer = answer;
  }
  return updatedQ;
};

/**
 * Creates a dependency relationship between two actions
 */
export const createDependency = async ({ meetingId, userId, sourceActionId, targetActionId, relationship = 'blocks' }) => {
  // Verify both actions belong to the user's meeting
  const check = await query(
    `SELECT COUNT(*) AS count FROM actions a
     JOIN meetings m ON m.id = a.meeting_id
     WHERE m.id = $1 AND m.user_id = $2 AND a.id IN ($3, $4)`,
    [meetingId, userId, sourceActionId, targetActionId]
  );

  if (parseInt(check.rows[0].count, 10) < 2) {
    const error = new Error('Invalid source or target action ID for this meeting');
    error.statusCode = 400;
    error.code = 'INVALID_DEPENDENCY_ACTIONS';
    throw error;
  }

  const result = await query(
    `INSERT INTO dependencies (meeting_id, source_action_id, target_action_id, relationship)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (source_action_id, target_action_id, relationship) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [meetingId, sourceActionId, targetActionId, relationship]
  );

  return result.rows[0];
};

/**
 * Deletes a dependency
 */
export const deleteDependency = async ({ dependencyId, userId }) => {
  const result = await query(
    `DELETE FROM dependencies dep
     USING meetings m
     WHERE dep.id = $1 AND dep.meeting_id = m.id AND m.user_id = $2
     RETURNING dep.id`,
    [dependencyId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Dependency not found or you do not have permission to delete it');
    error.statusCode = 404;
    error.code = 'DEPENDENCY_NOT_FOUND';
    throw error;
  }

  return true;
};

/**
 * Compares two meetings to identify new/completed actions, changed decisions, and unresolved questions
 */
export const compareMeetings = async ({ meetingAId, meetingBId, userId }) => {
  const meetingA = await getMeetingById({ meetingId: meetingAId, userId });
  const meetingB = await getMeetingById({ meetingId: meetingBId, userId });

  const actionsA = meetingA.actions || [];
  const actionsB = meetingB.actions || [];
  const decisionsA = meetingA.decisions || [];
  const decisionsB = meetingB.decisions || [];
  const questionsB = meetingB.questions || [];

  const taskNamesA = new Set(actionsA.map((a) => a.task.toLowerCase().trim()));
  const newActions = actionsB.filter((b) => !taskNamesA.has(b.task.toLowerCase().trim()));
  const completedActions = actionsB.filter((b) => b.status === 'completed');

  const decisionsTextA = new Set(decisionsA.map((d) => d.decision.toLowerCase().trim()));
  const newDecisions = decisionsB.filter((b) => !decisionsTextA.has(b.decision.toLowerCase().trim()));

  const unresolvedQuestions = questionsB.filter((q) => q.status === 'unresolved');

  return {
    meetingA: {
      id: meetingA.meeting.id,
      title: meetingA.meeting.title,
      meeting_date: meetingA.meeting.meeting_date,
      meetingDate: meetingA.meeting.meeting_date,
      summary: meetingA.meeting.summary,
      actions: meetingA.actions || [],
      decisions: meetingA.decisions || [],
      questions: meetingA.questions || []
    },
    meetingB: {
      id: meetingB.meeting.id,
      title: meetingB.meeting.title,
      meeting_date: meetingB.meeting.meeting_date,
      meetingDate: meetingB.meeting.meeting_date,
      summary: meetingB.meeting.summary,
      actions: meetingB.actions || [],
      decisions: meetingB.decisions || [],
      questions: meetingB.questions || []
    },
    comparison: {
      newActions,
      completedActions,
      newDecisions,
      unresolvedQuestions
    }
  };
};

/**
 * Exports a meeting report formatted as JSON or Markdown
 */
export const exportMeetingReport = async ({ meetingId, userId, format = 'json' }) => {
  const data = await getMeetingById({ meetingId, userId });

  if (format === 'markdown') {
    const m = data.meeting;
    let md = `# Meeting Report: ${m.title}\n\n`;
    md += `**Date:** ${new Date(m.meeting_date).toLocaleDateString()}\n\n`;
    md += `## Summary\n${m.summary || 'No summary available.'}\n\n`;

    md += `## Action Items\n`;
    if (data.actions.length === 0) {
      md += `*No action items.*\n\n`;
    } else {
      data.actions.forEach((a) => {
        md += `- [${a.status === 'completed' ? 'x' : ' '}] **${a.task}** | Owner: ${a.owner_name || 'Unassigned'} | Due: ${a.deadline ? new Date(a.deadline).toLocaleDateString() : 'None'} | Priority: ${a.priority}\n`;
      });
      md += '\n';
    }

    md += `## Decisions\n`;
    if (data.decisions.length === 0) {
      md += `*No decisions recorded.*\n\n`;
    } else {
      data.decisions.forEach((d) => {
        const maker = d.decision_maker || d.decided_by;
        md += `- **${d.decision}**${maker ? ` *(Decided by: ${maker})*` : ''}\n`;
        if (d.rationale) {
          md += `  - Rationale: ${d.rationale}\n`;
        }
        if (d.impacted_areas && d.impacted_areas.length > 0) {
          md += `  - Impacted Areas: ${d.impacted_areas.join(', ')}\n`;
        }
      });
      md += '\n';
    }

    md += `## Open Questions\n`;
    if (data.questions.length === 0) {
      md += `*No open questions.*\n\n`;
    } else {
      data.questions.forEach((q) => {
        md += `- ${q.question} (${q.status})\n`;
      });
      md += '\n';
    }

    return {
      contentType: 'text/markdown',
      filename: `meeting-report-${meetingId}.md`,
      content: md
    };
  }

  return {
    contentType: 'application/json',
    filename: `meeting-report-${meetingId}.json`,
    content: data
  };
};

/**
 * Ask My Meetings: Answers user questions across historical meetings using Qualcomm AI
 */
export const askMyMeetings = async ({ userId, question, meetingIds = [] }) => {
  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }

  let meetingFilterClause = '(m.user_id = $1 OR m.user_id = \'ae435fd8-7f6b-4ec7-be3f-b95136fa4bd3\')';
  const params = [userId];

  if (meetingIds && meetingIds.length > 0) {
    params.push(meetingIds);
    meetingFilterClause = 'm.id = ANY($2)';
  }

  const queryResult = await query(
    `SELECT 
      m.id, m.title, m.meeting_date, m.summary, m.original_notes,
      COALESCE(json_agg(DISTINCT jsonb_build_object('task', a.task, 'owner', a.owner_name, 'status', a.status, 'deadline', a.deadline)) FILTER (WHERE a.id IS NOT NULL), '[]') AS actions,
      COALESCE(json_agg(DISTINCT jsonb_build_object('decision', d.decision)) FILTER (WHERE d.id IS NOT NULL), '[]') AS decisions
     FROM meetings m
     LEFT JOIN actions a ON a.meeting_id = m.id
     LEFT JOIN decisions d ON d.meeting_id = m.id
     WHERE ${meetingFilterClause}
     GROUP BY m.id
     ORDER BY m.meeting_date DESC
     LIMIT 10`,
    params
  );

  const meetings = queryResult.rows;

  if (meetings.length === 0) {
    return {
      answer: 'No relevant meeting history found to answer your question.',
      sources: []
    };
  }

  const contextText = meetings.map((m, idx) => {
    let dateStr = 'Recent';
    try {
      if (m.meeting_date) dateStr = new Date(m.meeting_date).toISOString().split('T')[0];
    } catch {
      dateStr = 'Recent';
    }
    const fullNotes = (m.original_notes || m.notes || m.summary || '').slice(0, 10000);

    return `
### [MEETING ${idx + 1}] Title: "${m.title || 'Untitled Meeting'}" (Date: ${dateStr})
Summary: ${m.summary || 'None'}
Actions: ${JSON.stringify(m.actions || [])}
Decisions: ${JSON.stringify(m.decisions || [])}
Full Transcript / Notes:
${fullNotes}
`;
  }).join('\n----------------------------------------\n');

  const messages = [
    {
      role: 'system',
      content: `You are MeetingOS Ask-My-Meetings assistant powered by Qualcomm Cloud AI.
Answer the user's question accurately and concisely using ONLY the provided meeting transcripts, summaries, actions, and decisions.
Identify the exact meeting where the answer is found and cite its title (e.g. "In the meeting **[Title]**...").
Provide exact details, numbers, names, and facts mentioned in the transcripts.
If the context truly does not contain enough information to answer, state clearly that the information is unavailable.`
    },
    {
      role: 'user',
      content: `Meeting Context:\n${contextText}\n\nQuestion: ${question}`
    }
  ];

  const answer = await callQualcommChatCompletion(messages, { temperature: 0.1 });

  return {
    answer: (answer || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^```json\s*/i, '')
      .replace(/^```markdown\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim(),
    sources: meetings.map((m) => ({
      meetingId: m.id,
      title: m.title,
      date: m.meeting_date
    }))
  };
};

export default {
  createMeeting,
  listMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  processMeetingPipeline,
  updateAction,
  deleteAction,
  updateDecision,
  resolveQuestion,
  createDependency,
  deleteDependency,
  compareMeetings,
  exportMeetingReport,
  askMyMeetings
};
