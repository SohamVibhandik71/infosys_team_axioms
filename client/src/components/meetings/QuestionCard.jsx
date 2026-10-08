import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  User, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Send 
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';

export const QuestionCard = ({
  question,
  onResolve
}) => {
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerText, setAnswerText] = useState(question.answer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!question) return null;

  const isAnswered = question.status === 'answered' || !!question.answer;

  const getStatusBadge = () => {
    switch (question.status) {
      case 'answered':
        return <Badge variant="verified" size="sm">ANSWERED</Badge>;
      case 'deferred':
        return <Badge variant="pending" size="sm">DEFERRED</Badge>;
      case 'unanswered':
      default:
        return <Badge variant="unverified" size="sm">UNRESOLVED</Badge>;
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !onResolve) return;
    setIsSubmitting(true);
    try {
      await onResolve(question.id, {
        answer: answerText.trim(),
        status: 'answered'
      });
      setIsAnswering(false);
    } catch (err) {
      console.error('Failed to resolve question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm hover:shadow-neo transition-all space-y-3">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 p-1 bg-amber-100 border border-black rounded-md text-black shadow-neo-xs shrink-0">
            <HelpCircle size={16} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-black text-sm text-black tracking-tight">
                {question.question_text}
              </h4>
              {getStatusBadge()}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-600">
              {question.asked_by && (
                <span>Asked by: <strong className="text-black">{question.asked_by}</strong></span>
              )}
              {question.assigned_to && (
                <span>Assigned to: <strong className="text-blue-900">{question.assigned_to}</strong></span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAnswering(!isAnswering)}
          className="text-xs font-bold px-2.5 py-1 bg-amber-50 hover:bg-neo-yellow border border-black rounded-md shadow-neo-xs transition-colors cursor-pointer shrink-0"
        >
          {isAnswered ? 'Edit Answer' : 'Answer'}
        </button>
      </div>

      {/* Existing Answer if present */}
      {question.answer && !isAnswering && (
        <div className="bg-emerald-50 border border-black rounded-lg p-3 text-xs font-medium text-black">
          <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-emerald-900 mb-1">
            <CheckCircle2 size={12} className="text-emerald-700" /> Resolution / Answer:
          </div>
          <p className="text-gray-800">{question.answer}</p>
        </div>
      )}

      {/* Answering Form Drawer */}
      {isAnswering && (
        <form onSubmit={handleSubmitAnswer} className="mt-2 space-y-2 pt-2 border-t border-gray-200 animate-fadeIn">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type answer or resolution here..."
            rows={2}
            className="w-full p-2.5 text-xs font-medium border-2 border-black rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAnswering(false)}
              className="px-3 py-1 text-xs font-bold border border-black rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !answerText.trim()}
              className="px-3.5 py-1 text-xs font-black bg-neo-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-md shadow-neo-xs flex items-center gap-1 cursor-pointer"
            >
              <Send size={12} />
              {isSubmitting ? 'Saving...' : 'Save Answer'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};

export default QuestionCard;
