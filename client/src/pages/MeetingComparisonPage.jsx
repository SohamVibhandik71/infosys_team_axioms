import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { listMeetings, compareMeetings } from '../services/meetingApi.js';
import { 
  GitCompare, 
  ArrowLeft, 
  Layers, 
  CheckSquare, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Badge } from '../components/common/Badge.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { getErrorMessage } from '../utils/errorUtils.js';

export const MeetingComparisonPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const meetingAId = searchParams.get('meetingA') || '';
  const meetingBId = searchParams.get('meetingB') || '';

  const [allMeetings, setAllMeetings] = useState([]);
  const [selectedA, setSelectedA] = useState(meetingAId);
  const [selectedB, setSelectedB] = useState(meetingBId);

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch meeting library for dropdown pickers
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await listMeetings({ limit: 50 });
        const list = res?.data?.data?.meetings || res?.data?.meetings || [];
        setAllMeetings(list);
      } catch (err) {
        console.error('Failed to load meetings for comparison dropdown:', err);
      }
    };
    fetchList();
  }, []);

  // Execute comparison when both IDs are set
  const runComparison = async (idA, idB) => {
    if (!idA || !idB || idA === idB) {
      setComparisonData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await compareMeetings(idA, idB);
      const payload = res?.data?.data || res?.data || {};
      setComparisonData(payload);
    } catch (err) {
      console.error('Comparison failed:', err);
      setError(getErrorMessage(err, 'Failed to compare the selected meetings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meetingAId && meetingBId) {
      setSelectedA(meetingAId);
      setSelectedB(meetingBId);
      runComparison(meetingAId, meetingBId);
    }
  }, [meetingAId, meetingBId]);

  const handleApplySelection = (e) => {
    e.preventDefault();
    if (selectedA && selectedB) {
      setSearchParams({ meetingA: selectedA, meetingB: selectedB });
    }
  };

  const meetingA = comparisonData?.meetingA;
  const meetingB = comparisonData?.meetingB;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Back button & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/meetings"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-black mb-1"
          >
            <ArrowLeft size={14} /> Back to Meetings Library
          </Link>
          <h1 className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
            <GitCompare size={28} />
            Cross-Meeting Intelligence Comparison
          </h1>
          <p className="text-xs font-bold text-gray-600">
            Compare decisions, scope shifts, and action item deltas between two sessions
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <form onSubmit={handleApplySelection} className="bg-white border-3 border-black rounded-2xl p-6 shadow-neo space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-black">
          Select Two Meetings to Compare:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1">
              Meeting A (Baseline)
            </label>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
            >
              <option value="">-- Choose First Meeting --</option>
              {allMeetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : 'No date'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1">
              Meeting B (Follow-up / Comparative)
            </label>
            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
            >
              <option value="">-- Choose Second Meeting --</option>
              {allMeetings.map((m) => (
                <option key={m.id} value={m.id} disabled={m.id === selectedA}>
                  {m.title} ({m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : 'No date'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!selectedA || !selectedB || selectedA === selectedB || loading}
            className="px-6 py-2.5 bg-neo-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-xl font-black text-xs text-black shadow-neo hover:shadow-neo-lg transition-all cursor-pointer"
          >
            {loading ? 'Running Comparison...' : 'Compare Selected Meetings'}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="p-12 bg-white border-2 border-black rounded-2xl flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs font-bold uppercase text-gray-600">Analyzing meeting differences...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{typeof error === 'string' ? error : (error?.message || 'Error comparing meetings')}</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && !loading && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Side-by-Side Metadata Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Meeting A Card */}
            <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-neo space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2 py-0.5 border border-black rounded shadow-neo-xs">
                Meeting A (Baseline)
              </span>
              <h2 className="text-xl font-black text-black">
                {meetingA?.title}
              </h2>
              <div className="text-xs font-bold text-gray-600 flex items-center gap-2">
                <Calendar size={13} />
                <span>{meetingA?.meeting_date ? new Date(meetingA.meeting_date).toLocaleDateString() : (meetingA?.meetingDate ? new Date(meetingA.meetingDate).toLocaleDateString() : 'No date')}</span>
              </div>
              {meetingA?.summary && (
                <p className="text-xs text-gray-700 font-medium line-clamp-3 bg-gray-50 p-3 rounded-xl border border-black/10">
                  {meetingA.summary}
                </p>
              )}
            </div>

            {/* Meeting B Card */}
            <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-neo space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-neo-yellow text-black px-2 py-0.5 border border-black rounded shadow-neo-xs">
                Meeting B (Follow-up)
              </span>
              <h2 className="text-xl font-black text-black">
                {meetingB?.title}
              </h2>
              <div className="text-xs font-bold text-gray-600 flex items-center gap-2">
                <Calendar size={13} />
                <span>{meetingB?.meeting_date ? new Date(meetingB.meeting_date).toLocaleDateString() : (meetingB?.meetingDate ? new Date(meetingB.meetingDate).toLocaleDateString() : 'No date')}</span>
              </div>
              {meetingB?.summary && (
                <p className="text-xs text-gray-700 font-medium line-clamp-3 bg-yellow-50/50 p-3 rounded-xl border border-black/10">
                  {meetingB.summary}
                </p>
              )}
            </div>

          </div>

          {/* Delta Intelligence Highlights Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">New Action Items</span>
              <div className="text-2xl font-black text-black mt-1">
                {comparisonData?.comparison?.newActions?.length || 0}
              </div>
              <p className="text-[11px] font-bold text-gray-600 mt-1">Introduced in Meeting B</p>
            </div>

            <div className="bg-purple-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
              <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider">New Decisions</span>
              <div className="text-2xl font-black text-black mt-1">
                {comparisonData?.comparison?.newDecisions?.length || 0}
              </div>
              <p className="text-[11px] font-bold text-purple-700 mt-1">Agreed in Follow-up</p>
            </div>

            <div className="bg-amber-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Unresolved Questions</span>
              <div className="text-2xl font-black text-black mt-1">
                {comparisonData?.comparison?.unresolvedQuestions?.length || 0}
              </div>
              <p className="text-[11px] font-bold text-amber-700 mt-1">Pending follow-up</p>
            </div>

            <div className="bg-emerald-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Completed Tasks</span>
              <div className="text-2xl font-black text-black mt-1">
                {comparisonData?.comparison?.completedActions?.length || 0}
              </div>
              <p className="text-[11px] font-bold text-emerald-700 mt-1">Marked completed</p>
            </div>
          </div>

          {/* Decisions Comparison Section */}
          <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-neo space-y-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <Layers size={18} className="text-purple-700" />
              Decisions Evolution & Scope
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meeting A Decisions */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider flex items-center justify-between">
                  <span>Decisions in Meeting A</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 border border-black rounded text-[11px]">
                    {meetingA?.decisions?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2">
                  {(meetingA?.decisions || []).map((d, i) => (
                    <div key={d.id || i} className="p-3.5 bg-gray-50 border-2 border-black rounded-xl text-xs shadow-neo-xs space-y-1">
                      <p className="font-black text-black">{d.decision || d.title}</p>
                      {d.evidence && typeof d.evidence === 'string' && (
                        <p className="text-[11px] text-gray-600 italic">Proof: "{d.evidence}"</p>
                      )}
                    </div>
                  ))}
                  {(!meetingA?.decisions || meetingA.decisions.length === 0) && (
                    <p className="text-xs italic text-gray-500 py-3 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">No decisions recorded.</p>
                  )}
                </div>
              </div>

              {/* Meeting B Decisions */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider flex items-center justify-between">
                  <span>Decisions in Meeting B</span>
                  <span className="font-mono bg-yellow-100 px-2 py-0.5 border border-black rounded text-[11px]">
                    {meetingB?.decisions?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2">
                  {(meetingB?.decisions || []).map((d, i) => (
                    <div key={d.id || i} className="p-3.5 bg-amber-50/70 border-2 border-black rounded-xl text-xs shadow-neo-xs space-y-1">
                      <p className="font-black text-black">{d.decision || d.title}</p>
                      {d.evidence && typeof d.evidence === 'string' && (
                        <p className="text-[11px] text-gray-600 italic">Proof: "{d.evidence}"</p>
                      )}
                    </div>
                  ))}
                  {(!meetingB?.decisions || meetingB.decisions.length === 0) && (
                    <p className="text-xs italic text-gray-500 py-3 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">No decisions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items Comparison Section */}
          <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-neo space-y-4">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-700" />
              Action Items & Progress Delta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meeting A Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider flex items-center justify-between">
                  <span>Action Items in Meeting A</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 border border-black rounded text-[11px]">
                    {meetingA?.actions?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2">
                  {(meetingA?.actions || []).map((a, i) => {
                    const task = a.task || a.title;
                    const owner = a.owner_name || a.owner || (a.is_unassigned ? '[UNASSIGNED]' : 'Unassigned');
                    const priority = a.priority || 'medium';
                    const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString() : null;
                    return (
                      <div key={a.id || i} className="p-3.5 bg-gray-50 border-2 border-black rounded-xl text-xs shadow-neo-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-black">{task}</span>
                          <span className="text-[10px] font-mono uppercase bg-white px-1.5 py-0.5 border border-black rounded shrink-0">
                            {a.status || 'todo'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-700">
                          <span className="bg-white px-2 py-0.5 border border-black rounded">
                            Owner: <strong className={a.is_unassigned ? 'text-amber-800' : 'text-black'}>{owner}</strong>
                          </span>
                          {deadline && (
                            <span className="bg-white px-2 py-0.5 border border-black rounded">
                              Due: {deadline}
                            </span>
                          )}
                          <span className="bg-white px-2 py-0.5 border border-black rounded uppercase text-[10px]">
                            {priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {(!meetingA?.actions || meetingA.actions.length === 0) && (
                    <p className="text-xs italic text-gray-500 py-3 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">No action items recorded.</p>
                  )}
                </div>
              </div>

              {/* Meeting B Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider flex items-center justify-between">
                  <span>Action Items in Meeting B</span>
                  <span className="font-mono bg-yellow-100 px-2 py-0.5 border border-black rounded text-[11px]">
                    {meetingB?.actions?.length || 0}
                  </span>
                </h4>
                <div className="space-y-2">
                  {(meetingB?.actions || []).map((a, i) => {
                    const task = a.task || a.title;
                    const owner = a.owner_name || a.owner || (a.is_unassigned ? '[UNASSIGNED]' : 'Unassigned');
                    const priority = a.priority || 'medium';
                    const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString() : null;
                    return (
                      <div key={a.id || i} className="p-3.5 bg-emerald-50/60 border-2 border-black rounded-xl text-xs shadow-neo-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-black">{task}</span>
                          <span className="text-[10px] font-mono uppercase bg-white px-1.5 py-0.5 border border-black rounded shrink-0">
                            {a.status || 'todo'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-700">
                          <span className="bg-white px-2 py-0.5 border border-black rounded">
                            Owner: <strong className={a.is_unassigned ? 'text-amber-800' : 'text-black'}>{owner}</strong>
                          </span>
                          {deadline && (
                            <span className="bg-white px-2 py-0.5 border border-black rounded">
                              Due: {deadline}
                            </span>
                          )}
                          <span className="bg-white px-2 py-0.5 border border-black rounded uppercase text-[10px]">
                            {priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {(!meetingB?.actions || meetingB.actions.length === 0) && (
                    <p className="text-xs italic text-gray-500 py-3 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">No action items recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Open Questions Comparison */}
          {(comparisonData?.comparison?.unresolvedQuestions?.length > 0 || (meetingA?.questions?.length > 0 || meetingB?.questions?.length > 0)) && (
            <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-neo space-y-4">
              <h3 className="text-base font-black text-black flex items-center gap-2">
                <HelpCircle size={18} className="text-amber-600" />
                Unresolved Inquiries & Open Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Meeting A Questions ({meetingA?.questions?.length || 0})</h4>
                  {(meetingA?.questions || []).map((q, i) => (
                    <div key={q.id || i} className="p-3 bg-gray-50 border border-black rounded-xl text-xs">
                      <p className="font-bold text-black">{q.question}</p>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{q.status}</span>
                    </div>
                  ))}
                  {(!meetingA?.questions || meetingA.questions.length === 0) && (
                    <p className="text-xs italic text-gray-500">No open questions.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Meeting B Questions ({meetingB?.questions?.length || 0})</h4>
                  {(meetingB?.questions || []).map((q, i) => (
                    <div key={q.id || i} className="p-3 bg-amber-50/70 border border-black rounded-xl text-xs">
                      <p className="font-bold text-black">{q.question}</p>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{q.status}</span>
                    </div>
                  ))}
                  {(!meetingB?.questions || meetingB.questions.length === 0) && (
                    <p className="text-xs italic text-gray-500">No open questions.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default MeetingComparisonPage;
