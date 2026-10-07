import React, { useState } from 'react';
import { 
  CheckCircle, 
  HelpCircle, 
  Layers, 
  UserCheck, 
  FileSearch, 
  Check, 
  AlertTriangle,
  Users
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { EvidenceModal } from '../common/EvidenceModal.jsx';

/**
 * Dynamically parses decision maker, rationale, and impacted areas
 * from decision object, evidence quotes, notes, or attendee context.
 */
export const parseDecisionDetails = (decision, attendees = [], originalNotes = '') => {
  if (!decision) {
    return {
      decisionMaker: 'Team Consensus',
      rationale: null,
      impactedAreas: [],
      isConsensus: true
    };
  }

  let decisionMaker = decision.decision_maker || decision.decided_by || decision.owner || decision.maker || null;
  let rationale = decision.rationale || null;
  let impactedAreas = Array.isArray(decision.impacted_areas) ? [...decision.impacted_areas] : [];

  // Gather text sources to search in: evidence, decision string, title
  const evidenceList = Array.isArray(decision.evidence)
    ? decision.evidence
    : decision.evidence
    ? [decision.evidence]
    : [];

  const textSources = [
    ...evidenceList.map((e) => (typeof e === 'string' ? e : e?.sourceText || e?.source_text || '')),
    decision.decision || '',
    decision.title || '',
    decision.source_text || ''
  ].filter(Boolean);

  const fullText = textSources.join('\n');

  // 1. Extract Decided By if not yet set
  if (!decisionMaker && fullText) {
    const decidedByMatch = fullText.match(/(?:decided\s*by|decision\s*maker|agreed\s*by|approved\s*by|led\s*by|championed\s*by|owner):\s*([^,;.()\r\n]+(?:\s*&\s*[^,;.()\r\n]+)?)/i);
    if (decidedByMatch && decidedByMatch[1]) {
      decisionMaker = decidedByMatch[1].trim();
    }
  }

  // 2. Extract Impacted Areas if empty
  if (impactedAreas.length === 0 && fullText) {
    const impactMatch = fullText.match(/(?:impact(?:ed\s*areas?)?):\s*([^.)\r\n]+)/i);
    if (impactMatch && impactMatch[1]) {
      impactedAreas = impactMatch[1]
        .split(/[,/|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // 3. Extract Rationale if not set
  if (!rationale && fullText) {
    const rationaleMatch = fullText.match(/(?:rationale|context|reason|because):\s*([^.)\r\n]+)/i);
    if (rationaleMatch && rationaleMatch[1]) {
      rationale = rationaleMatch[1].trim();
    }
  }

  // 4. Fallback based on attendees or consensus
  let isConsensus = false;
  if (!decisionMaker) {
    if (Array.isArray(attendees) && attendees.length === 1 && attendees[0]) {
      decisionMaker = attendees[0];
    } else if (Array.isArray(attendees) && attendees.length > 1) {
      decisionMaker = 'Team Consensus';
      isConsensus = true;
    } else {
      decisionMaker = 'Team Consensus';
      isConsensus = true;
    }
  } else if (/team\s*consensus|all\s*attendees|collective|everyone/i.test(decisionMaker)) {
    isConsensus = true;
  }

  return {
    decisionMaker,
    rationale,
    impactedAreas,
    isConsensus
  };
};

export const DecisionCard = ({
  decision,
  attendees = [],
  originalNotes = '',
  onStatusChange
}) => {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  if (!decision) return null;

  const { decisionMaker, rationale, impactedAreas, isConsensus } = parseDecisionDetails(
    decision,
    attendees,
    originalNotes
  );

  const getStatusBadge = () => {
    switch (decision.status) {
      case 'accepted':
        return <Badge variant="verified" size="sm">ACCEPTED</Badge>;
      case 'rejected':
        return <Badge variant="unverified" size="sm">REJECTED</Badge>;
      case 'proposed':
        return <Badge variant="pending" size="sm">PROPOSED</Badge>;
      case 'superseded':
        return <Badge variant="default" size="sm">SUPERSEDED</Badge>;
      default:
        return <Badge variant="default" size="sm">{decision.status || 'ACCEPTED'}</Badge>;
    }
  };

  const getVerificationBadge = () => {
    switch (decision.verification_status) {
      case 'verified':
        return (
          <Badge 
            variant="verified" 
            size="sm" 
            onClick={() => setEvidenceOpen(true)}
            className="cursor-pointer"
          >
            <Check size={12} className="stroke-[3]" /> VERIFIED
          </Badge>
        );
      case 'conflict':
        return (
          <Badge 
            variant="conflict" 
            size="sm" 
            onClick={() => setEvidenceOpen(true)}
            className="cursor-pointer"
          >
            <AlertTriangle size={12} className="stroke-[3]" /> CONFLICT
          </Badge>
        );
      case 'ambiguous':
        return (
          <Badge 
            variant="ambiguous" 
            size="sm" 
            onClick={() => setEvidenceOpen(true)}
            className="cursor-pointer"
          >
            AMBIGUOUS
          </Badge>
        );
      case 'unverified':
      default:
        return (
          <Badge 
            variant="unverified" 
            size="sm" 
            onClick={() => setEvidenceOpen(true)}
            className="cursor-pointer"
          >
            UNVERIFIED
          </Badge>
        );
    }
  };

  return (
    <>
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm hover:shadow-neo transition-all space-y-3">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-sm text-black tracking-tight">
                {decision.decision || decision.title}
              </h3>
              {getStatusBadge()}
              {getVerificationBadge()}
            </div>
          </div>

          <button
            onClick={() => setEvidenceOpen(true)}
            className="p-1.5 bg-amber-50 hover:bg-neo-yellow border border-black rounded-md shadow-neo-xs text-black transition-colors cursor-pointer shrink-0"
            title="Inspect decision source quote"
            aria-label="View evidence"
          >
            <FileSearch size={14} />
          </button>
        </div>

        {/* Rationale */}
        {rationale && (
          <div className="bg-amber-50/50 p-2.5 border border-black/30 rounded-lg text-xs font-medium text-gray-800">
            <strong className="text-black font-black uppercase text-[10px] tracking-wider block mb-0.5">
              Rationale / Context:
            </strong>
            {rationale}
          </div>
        )}

        {/* Footer Meta: Decision Maker & Impacted Areas */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs font-bold text-gray-700">
          <div className="flex items-center gap-1.5">
            {isConsensus ? (
              <Users size={14} className="text-purple-700 stroke-[2.5]" />
            ) : (
              <UserCheck size={14} className="text-purple-700 stroke-[2.5]" />
            )}
            <span>
              Decided By:{' '}
              <strong className="text-purple-950 bg-purple-50 px-1.5 py-0.5 border border-purple-200 rounded text-xs">
                {decisionMaker}
              </strong>
            </span>
          </div>

          {impactedAreas && impactedAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <Layers size={13} className="text-blue-700" />
              {impactedAreas.map((area, idx) => (
                <span 
                  key={idx} 
                  className="bg-purple-100 border border-black text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title="Decision Evidence & Grounding"
        itemType="Decision"
        itemText={`${decision.decision || decision.title}`}
        evidence={decision.evidence || []}
        originalNotes={originalNotes}
        verificationStatus={decision.verification_status || (decision.verified ? 'verified' : 'verified')}
        confidence={decision.confidence ?? decision.confidence_score ?? 1.0}
        flagReason={decision.flag_reason}
      />
    </>
  );
};

export default DecisionCard;
