import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { askMyMeetings } from '../services/meetingApi.js';
import { 
  MessageSquare, 
  Search, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Quote, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { Spinner } from '../components/common/Spinner.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { FormattedAnswer } from '../components/common/FormattedAnswer.jsx';
import { getErrorMessage } from '../utils/errorUtils.js';

const SAMPLE_QUERIES = [
  'Who owns the database migration?',
  'What decisions were made regarding PostgreSQL vs NoSQL?',
  'Are there any unresolved questions regarding API rate limits?',
  'What are the critical launch deadlines for November?'
];

export const AskMyMeetingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result?.answer) {
      navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = async (queryText) => {
    const q = queryText || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setSearchParams({ q });

    try {
      const res = await askMyMeetings({ question: q.trim(), query: q.trim() });
      const payload = res?.data?.data || res?.data || {};
      setResult(payload);
    } catch (err) {
      console.error('Ask My Meetings query failed:', err);
      setError(getErrorMessage(err, 'Failed to query meetings library.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleChipClick = (chipQuery) => {
    setQuery(chipQuery);
    handleSearch(chipQuery);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-yellow border-2 border-black rounded-md font-black text-xs uppercase shadow-neo-xs">
          <MessageSquare size={14} /> Cross-Meeting QA
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
          Ask My Meetings
        </h1>
        <p className="text-xs font-bold text-gray-600 max-w-lg mx-auto">
          Query across all past meetings with strict Qualcomm Cloud AI grounding. Answers cite verbatim source quotes and meeting dates.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'What did we decide about offline caching?', 'Who is leading the mobile sprint?')"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-black rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-neo-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 shrink-0"
          >
            {loading ? <Spinner size="sm" /> : <Sparkles size={18} />}
            <span>{loading ? 'Searching...' : 'Ask AI'}</span>
          </button>
        </form>

        {/* Suggested Quick Chips */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
            Suggested Questions:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(sample)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-amber-50 border border-black rounded-lg text-xs font-bold text-gray-800 transition-colors shadow-neo-xs cursor-pointer text-left"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-neo-sm animate-fadeIn">
          <AlertCircle size={16} />
          <span>{typeof error === 'string' ? error : (error?.message || 'Error processing query')}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 bg-white border-2 border-black rounded-2xl flex flex-col items-center justify-center gap-3 shadow-neo">
          <Spinner size="lg" />
          <span className="text-xs font-black uppercase text-gray-700">Synthesizing grounded answers across meetings...</span>
        </div>
      )}

      {/* Results Box */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Answer Card */}
          <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border-2 border-black flex items-center justify-center shadow-neo-xs">
                  <ShieldCheck size={18} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black tracking-tight">
                    Grounded Synthesis
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Zero-Hallucination Verified Answer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-white hover:bg-gray-50 border border-black rounded-lg shadow-neo-xs transition-all cursor-pointer active:translate-y-0.5"
                  title="Copy formatted answer to clipboard"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-gray-700" />}
                  <span>{copied ? 'Copied!' : 'Copy Answer'}</span>
                </button>

                <Badge variant="verified" size="sm">
                  Evidence Verified
                </Badge>
              </div>
            </div>

            {/* Formatted Content */}
            <div className="pt-1">
              <FormattedAnswer text={result.answer || 'No direct answer found for this query in your recorded meetings.'} />
            </div>
          </div>

          {/* Citations & Evidence Sources */}
          {((result.sources && result.sources.length > 0) || (result.citations && result.citations.length > 0)) && (
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-neo space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Quote size={16} className="text-amber-600" />
                Referenced Meeting Sources ({(result.sources || result.citations || []).length})
              </h4>

              <div className="space-y-3">
                {(result.sources || result.citations || []).map((cite, index) => {
                  const mId = cite.meetingId || cite.meeting_id;
                  const mTitle = cite.title || cite.meeting_title || 'Meeting Reference';
                  const mDate = cite.date || cite.meeting_date;

                  return (
                    <div
                      key={index}
                      className="p-4 bg-amber-50/60 border border-black rounded-xl space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-black" />
                          <span className="font-black text-xs text-black">
                            {mTitle}
                          </span>
                          {mDate && (
                            <span className="text-[10px] font-mono font-bold text-gray-500">
                              ({new Date(mDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                        {mId && (
                          <Link
                            to={`/meetings/${mId}`}
                            className="text-[11px] font-black text-black hover:underline flex items-center gap-1 bg-white px-2 py-0.5 border border-black rounded shadow-neo-xs"
                          >
                            Open Meeting Workspace <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {cite.source_quote && (
                        <blockquote className="font-mono text-xs text-gray-800 bg-white p-2.5 border-l-4 border-l-amber-400 border border-gray-200 rounded">
                          "{cite.source_quote}"
                        </blockquote>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AskMyMeetingsPage;
