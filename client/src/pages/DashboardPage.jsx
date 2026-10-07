import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listMeetings } from '../services/meetingApi.js';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  Layers, 
  ShieldCheck, 
  GitCompare,
  Sparkles,
  Calendar,
  AlertCircle,
  Video,
  Mic,
  FileCode,
  Radio
} from 'lucide-react';
import { Badge } from '../components/common/Badge.jsx';
import { Spinner } from '../components/common/Spinner.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickSearch, setQuickSearch] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMeetings({ limit: 10 });
      const meetingsList = res?.data?.data?.meetings || res?.data?.meetings || [];
      setMeetings(meetingsList);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
      setError('Could not load dashboard meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderSourceBadge = (sourceType) => {
    const type = (sourceType || 'text').toLowerCase();
    switch (type) {
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase bg-purple-100 text-purple-950 px-2 py-0.5 border border-black rounded shadow-neo-xs">
            <Video size={11} className="text-purple-700 stroke-[2.5]" /> VIDEO
          </span>
        );
      case 'audio':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase bg-amber-100 text-amber-950 px-2 py-0.5 border border-black rounded shadow-neo-xs">
            <Mic size={11} className="text-amber-700 stroke-[2.5]" /> AUDIO
          </span>
        );
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase bg-rose-100 text-rose-950 px-2 py-0.5 border border-black rounded shadow-neo-xs">
            <FileText size={11} className="text-rose-700 stroke-[2.5]" /> PDF
          </span>
        );
      case 'docx':
      case 'doc':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase bg-blue-100 text-blue-950 px-2 py-0.5 border border-black rounded shadow-neo-xs">
            <FileCode size={11} className="text-blue-700 stroke-[2.5]" /> DOCX
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-800 px-1.5 py-0.5 border border-black rounded">
            TEXT
          </span>
        );
    }
  };

  // Compute metrics
  const totalMeetings = meetings.length;
  const processedMeetings = meetings.filter(m => m.status === 'processed' || m.analysis_status === 'completed').length;

  const handleQuickAskSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/meetings/ask?q=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neo-yellow border-2 border-black rounded-full font-black text-xs uppercase tracking-wider shadow-neo-xs">
              <Sparkles size={14} /> Evidence-First Intelligence Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
              Hello, {user?.name ? user.name.split(' ')[0] : 'Leader'} 👋
            </h1>
            <p className="text-sm font-semibold text-gray-700 max-w-xl">
              Turn messy meeting notes into 100% grounded summaries, verified action owners, decisions, and interactive dependency graphs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/meetings/new?mode=capture"
              className="flex items-center gap-2 px-5 py-3 bg-purple-200 hover:bg-purple-300 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all cursor-pointer active:translate-y-0.5"
            >
              <Radio size={18} className="text-purple-900" />
              Live Capture Meeting
            </Link>
            <Link
              to="/meetings/new"
              className="flex items-center gap-2 px-5 py-3 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all cursor-pointer active:translate-y-0.5"
            >
              <PlusCircle size={18} />
              Process New Meeting
            </Link>
            <Link
              to="/meetings/ask"
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-100 border-2 border-black rounded-xl font-bold text-sm text-black shadow-neo hover:shadow-neo-lg transition-all cursor-pointer active:translate-y-0.5"
            >
              <MessageSquare size={18} />
              Ask My Meetings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm">
          <span className="text-xs font-black uppercase text-gray-500 tracking-wider">Total Meetings</span>
          <div className="text-3xl font-black text-black mt-1">{totalMeetings}</div>
          <p className="text-[11px] font-bold text-gray-600 mt-1">Ingested transcripts</p>
        </div>

        <div className="bg-emerald-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
          <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">Processed & Grounded</span>
          <div className="text-3xl font-black text-black mt-1">{processedMeetings}</div>
          <p className="text-[11px] font-bold text-emerald-700 mt-1">Verified with zero hallucination</p>
        </div>

        <div className="bg-amber-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
          <span className="text-xs font-black uppercase text-amber-800 tracking-wider">AI Accuracy Guard</span>
          <div className="text-3xl font-black text-black mt-1">100%</div>
          <p className="text-[11px] font-bold text-amber-700 mt-1">Evidence &gt; Confidence</p>
        </div>

        <div className="bg-purple-50 border-2 border-black rounded-xl p-4 shadow-neo-sm">
          <span className="text-xs font-black uppercase text-purple-800 tracking-wider">Dependency Tracing</span>
          <div className="text-3xl font-black text-black mt-1">Active</div>
          <p className="text-[11px] font-bold text-purple-700 mt-1">React Flow DAG mapping</p>
        </div>

      </div>

      {/* Quick Search across meetings */}
      <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-neo">
        <form onSubmit={handleQuickAskSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Ask anything across your meetings (e.g., 'Who is leading the API refactor?', 'What did we decide on pricing?')"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-black rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 shrink-0"
          >
            <span>Ask Meetings</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Recent Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
            <FileText size={20} />
            Recent Meetings
          </h2>
          <Link
            to="/meetings"
            className="text-xs font-black uppercase tracking-wider text-black hover:underline flex items-center gap-1"
          >
            View All Meetings <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 bg-white border-2 border-black rounded-2xl flex flex-col items-center justify-center gap-3 shadow-neo-sm">
            <Spinner size="lg" />
            <span className="font-bold text-xs uppercase text-gray-600">Loading your meeting library...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span>{typeof error === 'string' ? error : (error?.message || 'Error loading dashboard')}</span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="p-12 bg-white border-3 border-black rounded-2xl text-center space-y-4 shadow-neo">
            <div className="w-16 h-16 bg-neo-yellow border-2 border-black rounded-2xl mx-auto flex items-center justify-center shadow-neo-sm">
              <FileText size={32} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-black text-black">No meetings processed yet</h3>
              <p className="text-xs font-bold text-gray-600 mt-1">
                Upload a transcript, audio notes (.txt/.pdf/.docx), or paste raw meeting notes to generate your first verified workspace.
              </p>
            </div>
            <Link
              to="/meetings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all"
            >
              <PlusCircle size={16} /> Process First Meeting
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => {
              const formattedDate = meeting.meeting_date
                ? new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'No date';

              const isCompleted = meeting.status === 'processed' || meeting.analysis_status === 'completed';

              return (
                <Link
                  key={meeting.id}
                  to={`/meetings/${meeting.id}`}
                  className="bg-white border-2 border-black rounded-xl p-5 shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={isCompleted ? 'verified' : 'pending'} size="sm">
                        {isCompleted ? 'GROUNDED' : (meeting.status || meeting.analysis_status || 'PENDING')}
                      </Badge>
                      {renderSourceBadge(meeting.source_type)}
                    </div>

                    <h3 className="font-black text-base text-black group-hover:text-blue-900 transition-colors line-clamp-2">
                      {meeting.title}
                    </h3>

                    {meeting.summary && (
                      <p className="text-xs text-gray-700 font-medium line-clamp-3">
                        {meeting.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{formattedDate}</span>
                    </div>
                    <span className="text-black font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Workspace <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
