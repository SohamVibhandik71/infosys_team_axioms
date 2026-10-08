import { z } from 'zod';
import { callQualcommChatCompletion } from './aiService.js';
import { logger } from '../utils/logger.js';

// Evidence Schema
const evidenceSchema = z.union([
  z.string().transform((s) => ({ source_text: s, start_position: null, end_position: null, confidence: 0.9 })),
  z.object({
    source_text: z.string().optional().default(''),
    start_position: z.number().int().optional().nullable(),
    end_position: z.number().int().optional().nullable(),
    confidence: z.number().optional().default(0.9)
  })
]).optional().nullable();

// Action Schema
const actionItemSchema = z.object({
  task: z.string().min(1, 'Task description cannot be empty'),
  owner: z.string().nullable().optional().default(null),
  deadline: z.string().nullable().optional().default(null),
  priority: z.string().optional().transform((p) => {
    const val = (p || 'medium').toLowerCase();
    return ['critical', 'high', 'medium', 'low'].includes(val) ? val : 'medium';
  }),
  confidence: z.number().optional().default(0.9),
  is_ambiguous: z.boolean().optional().default(false),
  ambiguity_reason: z.string().nullable().optional().default(null),
  is_unassigned: z.boolean().optional().default(false),
  evidence: evidenceSchema
});

// Decision Schema
const decisionItemSchema = z.object({
  decision: z.string().min(1, 'Decision text cannot be empty'),
  decision_maker: z.string().nullable().optional().default(null),
  decided_by: z.string().nullable().optional().default(null),
  rationale: z.string().nullable().optional().default(null),
  impacted_areas: z.union([z.array(z.string()), z.string().transform((s) => [s])]).optional().default([]),
  confidence: z.number().optional().default(0.9),
  evidence: evidenceSchema
});

// Question Schema
const questionItemSchema = z.object({
  question: z.string().min(1, 'Question text cannot be empty'),
  status: z.string().optional().transform((s) => (s === 'resolved' ? 'resolved' : 'unresolved')),
  confidence: z.number().optional().default(0.9),
  evidence: z.union([z.string(), z.object({ source_text: z.string().optional() })]).optional().nullable().transform((e) => (typeof e === 'object' && e?.source_text ? e.source_text : (typeof e === 'string' ? e : null)))
});

// Dependency Schema
const dependencyItemSchema = z.object({
  source_task: z.string().min(1),
  target_task: z.string().min(1),
  relationship: z.string().optional().default('blocks'),
  confidence: z.number().optional().default(0.9),
  evidence: z.union([z.string(), z.object({ source_text: z.string().optional() })]).optional().nullable().transform((e) => (typeof e === 'object' && e?.source_text ? e.source_text : (typeof e === 'string' ? e : null)))
});

// Full Extraction Schema
export const extractionResultSchema = z.object({
  summary: z.string().min(1, 'Summary cannot be empty'),
  actions: z.array(actionItemSchema).default([]),
  decisions: z.array(decisionItemSchema).default([]),
  questions: z.array(questionItemSchema).default([]),
  dependencies: z.array(dependencyItemSchema).default([]),
  ambiguities: z.array(
    z.union([
      z.string().transform((s) => ({ description: s, reason: '' })),
      z.object({
        description: z.string().optional(),
        task: z.string().optional(),
        item: z.string().optional(),
        reason: z.string().optional().default('')
      }).transform((obj) => ({
        description: obj.description || obj.task || obj.item || 'Ambiguous item',
        reason: obj.reason || ''
      }))
    ])
  ).default([])
});

const SYSTEM_PROMPT = `
You are the MeetingOS AI extraction engine powered by Qualcomm Cloud AI.
Your purpose is to convert messy meeting notes into structured, verifiable meeting intelligence.

CORE PRODUCT PRINCIPLE: EVIDENCE > CONFIDENCE
You must NEVER invent, hallucinate, or assume facts that are not explicitly stated in the meeting notes.

EXTRACTION RULES:
1. SUMMARY: Provide a clear, factual, multi-sentence overview covering main topics, outcomes, and decisions. Do not invent details.
2. ACTION ITEMS:
   - Identify concrete tasks and commitments.
   - OWNER: If someone is explicitly assigned or commits, extract their name. If not explicitly assigned, return owner: null and is_unassigned: true. NEVER guess or invent a person.
   - DEADLINE: Extract the exact or relative date mentioned. If no deadline exists, return deadline: null. NEVER invent a deadline.
   - PRIORITY: Classify as "critical", "high", "medium", or "low" based only on urgency cues in the text. Default to "medium".
   - CONFIDENCE: Rate extraction confidence between 0.0 and 1.0.
   - AMBIGUITY: If a task is vague (e.g. "someone should do X", "finish soon"), set is_ambiguous: true and explain ambiguity_reason.
   - EVIDENCE: Provide the EXACT verbatim sentence from the meeting notes in evidence.source_text.
3. DECISIONS:
   - Extract final, agreed-upon decisions.
   - DECIDED_BY: Identify who made/proposed the decision (e.g. specific attendee, or "Team Consensus"). If unmentioned, return null.
   - RATIONALE: Motivation or context for the decision if mentioned.
   - IMPACTED_AREAS: List affected systems, departments, or areas (e.g. ["Backend", "Frontend"]).
   - Do NOT turn casual suggestions, open questions, or discussions into decisions.
   - Provide verbatim supporting evidence.
4. QUESTIONS / UNRESOLVED POINTS:
   - Extract open questions, unresolved debates, or unconfirmed commitments.
   - Set status to "unresolved".
5. DEPENDENCIES:
   - Identify task sequences (e.g. "Task A must be done before Task B").
   - source_task is the upstream prerequisite; target_task is the dependent action.
   - relationship: "blocks" or "depends_on".

OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
{
  "summary": "...",
  "actions": [
    {
      "task": "...",
      "owner": "Name or null",
      "deadline": "Date or null",
      "priority": "critical"|"high"|"medium"|"low",
      "confidence": 0.95,
      "is_ambiguous": false,
      "ambiguity_reason": null,
      "is_unassigned": false,
      "evidence": {
        "source_text": "Exact verbatim quote from notes",
        "confidence": 0.95
      }
    }
  ],
  "decisions": [
    {
      "decision": "...",
      "decided_by": "Name or Team Consensus or null",
      "rationale": "...",
      "impacted_areas": ["..."],
      "confidence": 0.95,
      "evidence": {
        "source_text": "Exact verbatim quote from notes",
        "confidence": 0.95
      }
    }
  ],
  "questions": [
    {
      "question": "...",
      "status": "unresolved",
      "confidence": 0.90,
      "evidence": "..."
    }
  ],
  "dependencies": [
    {
      "source_task": "...",
      "target_task": "...",
      "relationship": "blocks",
      "confidence": 0.90,
      "evidence": "..."
    }
  ],
  "ambiguities": []
}
`;

const SECTION_PROMPT = `
You are the MeetingOS AI extraction engine powered by Qualcomm Cloud AI.
Extract structured meeting intelligence from the notes below into plain text sections.

Meeting Notes:
{MEETING_NOTES}

Return plain text with this exact section layout:
===SUMMARY===
(Write 2-4 sentence factual overview)
===ACTIONS===
- Task: (Task description) | Owner: (Name or null) | Due: (Date or null) | Priority: (high/medium/low) | Evidence: (Exact sentence)
===DECISIONS===
- Decision: (Decision text) | Evidence: (Exact sentence)
===QUESTIONS===
- Question: (Question text) | Status: unresolved | Evidence: (Exact sentence)
===DEPENDENCIES===
- Upstream: (Task A) | Blocks: (Task B) | Evidence: (Exact sentence)
`;

/**
 * Parses section-based text output into structured JSON
 */
export const parseSectionExtraction = (text) => {
  const sections = {
    summary: '',
    actions: [],
    decisions: [],
    questions: [],
    dependencies: [],
    ambiguities: []
  };

  const summaryMatch = text.match(/===SUMMARY===([\s\S]*?)(?====[A-Z]+===|$)/i);
  if (summaryMatch) sections.summary = summaryMatch[1].trim();

  const actionsMatch = text.match(/===ACTIONS===([\s\S]*?)(?====[A-Z]+===|$)/i);
  if (actionsMatch) {
    const lines = actionsMatch[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'));
    for (const line of lines) {
      const taskM = line.match(/Task:\s*([^|]+)/i);
      const ownerM = line.match(/Owner:\s*([^|]+)/i);
      const dueM = line.match(/Due:\s*([^|]+)/i);
      const priorityM = line.match(/Priority:\s*([^|]+)/i);
      const evidenceM = line.match(/Evidence:\s*(.*)/i);

      const task = taskM ? taskM[1].trim() : null;
      if (!task) continue;

      const rawOwner = ownerM ? ownerM[1].trim() : null;
      const isUnassigned = !rawOwner || rawOwner.toLowerCase() === 'null' || rawOwner.toLowerCase() === 'none' || rawOwner.toLowerCase().includes('unassigned');
      const owner = isUnassigned ? null : rawOwner;

      const rawDue = dueM ? dueM[1].trim() : null;
      const deadline = (!rawDue || rawDue.toLowerCase() === 'null' || rawDue.toLowerCase() === 'none') ? null : rawDue;

      const rawPriority = priorityM ? priorityM[1].trim().toLowerCase() : 'medium';
      const priority = ['critical', 'high', 'medium', 'low'].includes(rawPriority) ? rawPriority : 'medium';

      const evidenceText = evidenceM ? evidenceM[1].trim() : line;

      sections.actions.push({
        task,
        owner,
        deadline,
        priority,
        confidence: 0.95,
        is_ambiguous: isUnassigned,
        ambiguity_reason: isUnassigned ? 'Action has no explicit owner assigned.' : null,
        is_unassigned: isUnassigned,
        evidence: {
          source_text: evidenceText,
          confidence: 0.95
        }
      });
    }
  }

  const decisionsMatch = text.match(/===DECISIONS===([\s\S]*?)(?====[A-Z]+===|$)/i);
  if (decisionsMatch) {
    const lines = decisionsMatch[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'));
    for (const line of lines) {
      const decM = line.match(/Decision:\s*([^|]+)/i);
      const evidenceM = line.match(/Evidence:\s*(.*)/i);
      const decision = decM ? decM[1].trim() : line.replace(/^[-*]\s*/, '').trim();
      if (!decision) continue;

      let decisionMaker = null;
      let impactedAreas = [];
      let rationale = null;

      const decidedByMatch = line.match(/(?:decided\s*by|decision\s*maker|agreed\s*by|approved\s*by|led\s*by|championed\s*by|owner):\s*([^,;.()\r\n]+(?:\s*&\s*[^,;.()\r\n]+)?)/i);
      if (decidedByMatch && decidedByMatch[1]) {
        decisionMaker = decidedByMatch[1].trim();
      }
      const impactMatch = line.match(/(?:impact(?:ed\s*areas?)?):\s*([^.)\r\n]+)/i);
      if (impactMatch && impactMatch[1]) {
        impactedAreas = impactMatch[1].split(/[,/|]/).map((s) => s.trim()).filter(Boolean);
      }
      const rationaleMatch = line.match(/(?:rationale|context|reason|because):\s*([^.)\r\n]+)/i);
      if (rationaleMatch && rationaleMatch[1]) {
        rationale = rationaleMatch[1].trim();
      }

      sections.decisions.push({
        decision,
        decision_maker: decisionMaker,
        decided_by: decisionMaker,
        impacted_areas: impactedAreas,
        rationale: rationale,
        confidence: 0.95,
        evidence: {
          source_text: evidenceM ? evidenceM[1].trim() : decision,
          confidence: 0.95
        }
      });
    }
  }

  const questionsMatch = text.match(/===QUESTIONS===([\s\S]*?)(?====[A-Z]+===|$)/i);
  if (questionsMatch) {
    const lines = questionsMatch[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'));
    for (const line of lines) {
      const qM = line.match(/Question:\s*([^|]+)/i);
      const evidenceM = line.match(/Evidence:\s*(.*)/i);
      const question = qM ? qM[1].trim() : line.replace(/^[-*]\s*/, '').trim();
      if (!question) continue;
      sections.questions.push({
        question,
        status: 'unresolved',
        confidence: 0.90,
        evidence: evidenceM ? evidenceM[1].trim() : question
      });
    }
  }

  const depMatch = text.match(/===DEPENDENCIES===([\s\S]*?)(?====[A-Z]+===|$)/i);
  if (depMatch) {
    const lines = depMatch[1].split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*'));
    for (const line of lines) {
      const upM = line.match(/Upstream:\s*([^|]+)/i);
      const blkM = line.match(/Blocks:\s*([^|]+)/i);
      const evM = line.match(/Evidence:\s*(.*)/i);
      if (upM && blkM) {
        sections.dependencies.push({
          source_task: upM[1].trim(),
          target_task: blkM[1].trim(),
          relationship: 'blocks',
          confidence: 0.90,
          evidence: evM ? evM[1].trim() : null
        });
      }
    }
  }

  if (!sections.summary && text.length > 0) {
    sections.summary = text.slice(0, 300);
  }

  return sections;
};

/**
 * Extracts structured intelligence from raw meeting text using Qualcomm AI
 * @param {string} meetingNotes 
 * @returns {Promise<z.infer<typeof extractionResultSchema>>}
 */
export const extractStructuredIntelligence = async (meetingNotes) => {
  if (!meetingNotes || meetingNotes.trim().length === 0) {
    throw new Error('Cannot perform AI extraction on empty meeting notes.');
  }

  const promptContent = SECTION_PROMPT.replace('{MEETING_NOTES}', meetingNotes);

  const messages = [
    {
      role: 'user',
      content: promptContent
    }
  ];

  const rawOutput = await callQualcommChatCompletion(messages, { max_tokens: 1500 });

  let parsedData;

  // 1. Check if output uses section layout (===SUMMARY=== ...)
  if (rawOutput.includes('===SUMMARY===') || rawOutput.includes('===ACTIONS===')) {
    parsedData = parseSectionExtraction(rawOutput);
  } else {
    // 2. Fallback: Parse JSON / DeepSeek think tags
    try {
      const cleaned = rawOutput
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
      parsedData = JSON.parse(jsonStr);
    } catch (err) {
      logger.warn('Direct JSON parsing failed, attempting fallback text parsing:', err.message);
      parsedData = parseSectionExtraction(rawOutput);
    }
  }

  try {
    const validatedResult = extractionResultSchema.parse(parsedData);
    return validatedResult;
  } catch (err) {
    logger.error('AI extraction failed schema validation:', err, { parsedData });
    const error = new Error('AI response structure failed validation schema.');
    error.statusCode = 502;
    error.code = 'AI_SCHEMA_VALIDATION_FAILED';
    throw error;
  }
};

export default {
  extractStructuredIntelligence,
  parseSectionExtraction,
  extractionResultSchema
};