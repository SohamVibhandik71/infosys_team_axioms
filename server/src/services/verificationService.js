import { logger } from '../utils/logger.js';

/**
 * 2-Pass Verification Service
 * Enforces "Evidence > Confidence" principle
 */

/**
 * Resilient evidence search across original document text
 * Handles line wraps, carriage returns, and spacing variations from PDF/DOCX extractions
 */
export const findEvidencePosition = (sourceText, originalNotes) => {
  if (!sourceText || !originalNotes) return { found: false, start: null, end: null };
  const lowerOriginal = originalNotes.toLowerCase();
  const searchLower = sourceText.toLowerCase().trim();

  // 1. Direct exact index match
  const directPos = lowerOriginal.indexOf(searchLower);
  if (directPos !== -1) {
    return { found: true, start: directPos, end: directPos + searchLower.length };
  }

  // 2. Whitespace & newline flexible regex match
  const words = searchLower.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    try {
      const regex = new RegExp(escapedWords.join('\\s+'), 'i');
      const match = originalNotes.match(regex);
      if (match && match.index !== undefined) {
        return { found: true, start: match.index, end: match.index + match[0].length };
      }
    } catch {
      // ignore regex error
    }
  }

  // 3. Fallback: High-overlap segment match (first 4+ words)
  if (words.length >= 4) {
    const subWords = words.slice(0, Math.min(words.length, 6)).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    try {
      const subRegex = new RegExp(subWords.join('\\s+'), 'i');
      const match = originalNotes.match(subRegex);
      if (match && match.index !== undefined) {
        return { found: true, start: match.index, end: match.index + match[0].length };
      }
    } catch {
      // ignore
    }
  }

  return { found: false, start: null, end: null };
};

/**
 * Verifies extracted intelligence against original meeting notes
 * @param {object} extraction Validated extraction from extractionService
 * @param {string} originalNotes Raw meeting text
 * @returns {object} { verifiedExtraction, verificationResult }
 */
export const verifyExtraction = async (extraction, originalNotes) => {
  const unsupportedItems = [];
  const conflicts = [];
  const lowerOriginal = (originalNotes || '').toLowerCase();

  const verifiedActions = (extraction.actions || []).map((action, index) => {
    const verifiedAction = { ...action };
    let hasEvidenceSupport = false;

    // 1. Evidence Verification
    if (action.evidence?.source_text) {
      const sourceText = action.evidence.source_text.trim();
      const posResult = findEvidencePosition(sourceText, originalNotes);

      if (posResult.found) {
        hasEvidenceSupport = true;
        verifiedAction.evidence = {
          ...action.evidence,
          start_position: posResult.start,
          end_position: posResult.end
        };
      } else {
        unsupportedItems.push({
          entity_type: 'action_evidence',
          index,
          task: action.task,
          claimed_evidence: sourceText,
          reason: 'Supporting evidence sentence could not be found in original meeting notes.'
        });
      }
    } else {
      unsupportedItems.push({
        entity_type: 'action_evidence',
        index,
        task: action.task,
        reason: 'No supporting evidence attached to action item.'
      });
    }

    // 2. Owner Support Verification
    if (action.owner && action.owner.trim() !== '') {
      const ownerName = action.owner.trim().toLowerCase();
      const evidenceText = action.evidence?.source_text?.toLowerCase() || '';

      const ownerMentionedInEvidence = evidenceText.includes(ownerName);
      const ownerMentionedInNotes = lowerOriginal.includes(ownerName);

      if (!ownerMentionedInEvidence && !ownerMentionedInNotes) {
        unsupportedItems.push({
          entity_type: 'action_owner',
          index,
          task: action.task,
          claimed_owner: action.owner,
          reason: `Owner "${action.owner}" is not mentioned anywhere in the source notes.`
        });
        // Downgrade hallucinated owner
        verifiedAction.owner = null;
        verifiedAction.is_unassigned = true;
        verifiedAction.verified = false;
      } else {
        verifiedAction.verified = hasEvidenceSupport;
      }
    } else {
      verifiedAction.owner = null;
      verifiedAction.is_unassigned = true;
      verifiedAction.verified = hasEvidenceSupport;
    }

    // 3. Deadline Verification
    if (action.deadline && action.deadline.trim() !== '') {
      const deadlineLower = action.deadline.trim().toLowerCase();
      const evidenceText = action.evidence?.source_text?.toLowerCase() || '';

      const temporalKeywords = ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'next week', 'by', 'due', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', '2026', '2025', 'eod', 'end of'];
      const hasTemporalCue = temporalKeywords.some((kw) => deadlineLower.includes(kw) || evidenceText.includes(kw));

      if (!hasTemporalCue) {
        unsupportedItems.push({
          entity_type: 'action_deadline',
          index,
          task: action.task,
          claimed_deadline: action.deadline,
          reason: `Extracted deadline "${action.deadline}" lacks supporting temporal cues in source evidence.`
        });
      }
    }

    // 4. Ambiguity Check
    if (verifiedAction.is_unassigned || !verifiedAction.deadline) {
      if (!verifiedAction.is_ambiguous) {
        verifiedAction.is_ambiguous = true;
        verifiedAction.ambiguity_reason = verifiedAction.is_unassigned && !verifiedAction.deadline
          ? 'Action has no assigned owner and no specific deadline.'
          : verifiedAction.is_unassigned
            ? 'Action has no assigned owner.'
            : 'Action has no explicit deadline.';
      }
    }

    return verifiedAction;
  });

  // 5. Decision Evidence Verification
  const verifiedDecisions = (extraction.decisions || []).map((decision, index) => {
    const verifiedDecision = { ...decision };

    if (decision.evidence?.source_text) {
      const sourceText = decision.evidence.source_text.trim();
      const posResult = findEvidencePosition(sourceText, originalNotes);

      if (posResult.found) {
        verifiedDecision.evidence = {
          ...decision.evidence,
          start_position: posResult.start,
          end_position: posResult.end
        };
        verifiedDecision.verified = true;
      } else {
        verifiedDecision.verified = false;
        unsupportedItems.push({
          entity_type: 'decision_evidence',
          index,
          decision: decision.decision,
          claimed_evidence: sourceText,
          reason: 'Decision evidence sentence could not be found in meeting notes.'
        });
      }
    } else {
      verifiedDecision.verified = false;
    }

    return verifiedDecision;
  });

  // 6. Conflict Detection (contradictory owners or deadlines)
  const taskMap = new Map();
  verifiedActions.forEach((act) => {
    const key = act.task.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (taskMap.has(key)) {
      const existing = taskMap.get(key);
      if (existing.owner && act.owner && existing.owner !== act.owner) {
        conflicts.push({
          type: 'OWNER_CONFLICT',
          task: act.task,
          description: `Conflicting owners identified for task "${act.task}": "${existing.owner}" vs "${act.owner}".`
        });
      }
      if (existing.deadline && act.deadline && existing.deadline !== act.deadline) {
        conflicts.push({
          type: 'DEADLINE_CONFLICT',
          task: act.task,
          description: `Conflicting deadlines identified for task "${act.task}": "${existing.deadline}" vs "${act.deadline}".`
        });
      }
    } else {
      taskMap.set(key, act);
    }
  });

  // Determine Overall Status
  let verificationStatus = 'verified';
  if (unsupportedItems.length > 0 || conflicts.length > 0) {
    verificationStatus = unsupportedItems.some((i) => i.entity_type === 'action_owner') ? 'warning' : 'warning';
  } else if (verifiedActions.some((a) => a.is_unassigned || a.is_ambiguous)) {
    verificationStatus = 'verified';
  }

  // Generate Verification Summary
  const issues = [];
  if (unsupportedItems.length > 0) issues.push(`${unsupportedItems.length} unsupported claim(s) flagged`);
  if (conflicts.length > 0) issues.push(`${conflicts.length} conflict(s) detected`);
  const unassignedCount = verifiedActions.filter((a) => a.is_unassigned).length;
  if (unassignedCount > 0) issues.push(`${unassignedCount} unassigned task(s)`);

  const verificationSummary = issues.length > 0
    ? `Verification complete with notes: ${issues.join(', ')}.`
    : 'All extracted actions, decisions, and evidence were verified against meeting notes.';

  return {
    verifiedExtraction: {
      ...extraction,
      actions: verifiedActions,
      decisions: verifiedDecisions
    },
    verificationResult: {
      verification_status: verificationStatus,
      verification_summary: verificationSummary,
      unsupported_items: unsupportedItems,
      conflicts,
      verified_at: new Date().toISOString()
    }
  };
};

export default {
  verifyExtraction
};
