import React from 'react';
import { Modal } from './Modal.jsx';
import { Badge } from './Badge.jsx';
import { CheckCircle, AlertTriangle, HelpCircle, XCircle, FileText, Quote, Info } from 'lucide-react';

export const EvidenceModal = ({
  isOpen,
  onClose,
  title = 'Evidence & Source Trace',
  itemType = 'Action Item',
  itemText = '',
  evidence = [],
  originalNotes = '',
  verificationStatus = 'verified',
  confidence = 1.0,
  flagReason = null
}) => {
  // Extract primary quote and offsets supporting all aliases and string/object types
  const evidenceArray = Array.isArray(evidence) ? evidence : (evidence ? [evidence] : []);
  const primaryEvidence = evidenceArray.length > 0 ? evidenceArray[0] : null;

  let quote = '';
  if (typeof primaryEvidence === 'string') {
    quote = primaryEvidence;
  } else if (primaryEvidence && typeof primaryEvidence === 'object') {
    quote = primaryEvidence.source_text || primaryEvidence.sourceText || primaryEvidence.source_quote || primaryEvidence.evidence || '';
  }

  // Calculate or extract character offsets
  let startOffset = primaryEvidence?.start_position ?? primaryEvidence?.startPosition ?? primaryEvidence?.char_start_offset ?? -1;
  let endOffset = primaryEvidence?.end_position ?? primaryEvidence?.endPosition ?? primaryEvidence?.char_end_offset ?? -1;

  if (startOffset < 0 && quote && originalNotes) {
    const foundIdx = originalNotes.indexOf(quote);
    if (foundIdx >= 0) {
      startOffset = foundIdx;
      endOffset = foundIdx + quote.length;
    }
  }

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Badge variant="verified" size="md">
            <CheckCircle size={14} className="stroke-[3]" /> VERIFIED (100% GROUNDED)
          </Badge>
        );
      case 'conflict':
        return (
          <Badge variant="conflict" size="md">
            <AlertTriangle size={14} className="stroke-[3]" /> CONFLICT DETECTED
          </Badge>
        );
      case 'ambiguous':
        return (
          <Badge variant="ambiguous" size="md">
            <HelpCircle size={14} className="stroke-[3]" /> AMBIGUOUS / UNCLEAR
          </Badge>
        );
      case 'unverified':
      default:
        return (
          <Badge variant="unverified" size="md">
            <XCircle size={14} className="stroke-[3]" /> UNVERIFIED / NO DIRECT EVIDENCE
          </Badge>
        );
    }
  };

  // Helper to render original notes with highlighted quote if offsets exist
  const renderHighlightedNotes = () => {
    if (!originalNotes) return <p className="text-gray-500 italic">No original notes available.</p>;

    if (startOffset >= 0 && endOffset > startOffset && endOffset <= originalNotes.length) {
      const before = originalNotes.slice(0, startOffset);
      const highlighted = originalNotes.slice(startOffset, endOffset);
      const after = originalNotes.slice(endOffset);

      return (
        <div className="p-4 bg-white border-2 border-black rounded-lg font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
          <span>{before}</span>
          <mark className="bg-neo-yellow text-black font-bold px-1 rounded-xs border-b-2 border-black">
            {highlighted}
          </mark>
          <span>{after}</span>
        </div>
      );
    }

    // Fallback: search for quote string within notes
    if (quote && originalNotes.includes(quote)) {
      const parts = originalNotes.split(quote);
      return (
        <div className="p-4 bg-white border-2 border-black rounded-lg font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <mark className="bg-neo-yellow text-black font-bold px-1 rounded-xs border-b-2 border-black">
                  {quote}
                </mark>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }

    // Default note snippet display
    return (
      <div className="p-4 bg-white border-2 border-black rounded-lg font-mono text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap text-gray-800">
        {originalNotes}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl">
      <div className="space-y-5">
        {/* Top Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-2 border-black rounded-lg shadow-neo-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-gray-500">Classification:</span>
            {getStatusBadge()}
          </div>
          <div className="text-xs font-bold text-gray-700">
            Confidence Score: <span className="font-black text-black">{(confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Target Item Display */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
            <Info size={14} /> Extracted {itemType}:
          </label>
          <div className="p-3.5 bg-amber-50 border-2 border-black rounded-lg font-bold text-sm text-black shadow-neo-sm">
            {itemText || 'No item text provided'}
          </div>
        </div>

        {/* Flag or Conflict details */}
        {flagReason && (
          <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-lg text-xs font-bold text-rose-900 flex items-start gap-2 shadow-neo-sm">
            <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-black">Verification Warning:</span> {flagReason}
            </div>
          </div>
        )}

        {/* Direct Source Quote */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
            <Quote size={14} /> Verbatim Evidence Quote:
          </label>
          {quote ? (
            <div className="p-3.5 bg-emerald-50 border-2 border-black rounded-lg font-mono text-xs text-black border-l-6 border-l-emerald-500 shadow-neo-sm">
              "{quote}"
              {startOffset >= 0 && (
                <div className="mt-2 text-[10px] font-bold text-gray-500">
                  Character Range: [{startOffset} - {endOffset}]
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-100 border-2 border-black rounded-lg text-xs font-semibold text-gray-600">
              ⚠️ No direct verbatim quote was linked by the extraction engine. Marked as unverified to prevent hallucination.
            </div>
          )}
        </div>

        {/* Full Context / Original Notes with Highlights */}
        {originalNotes && (
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
              <FileText size={14} /> Grounding Source Context (Meeting Transcript / Notes):
            </label>
            {renderHighlightedNotes()}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EvidenceModal;
