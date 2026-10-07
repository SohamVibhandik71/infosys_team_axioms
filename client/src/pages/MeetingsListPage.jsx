import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMeetings, deleteMeeting } from '../services/meetingApi.js';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Calendar, 
  Users, 
  Trash2, 
  GitCompare, 
  ArrowRight,
  AlertCircle,
  Sparkles,
  Video,
  Mic,
  FileCode
} from 'lucide-react';
import { Badge } from '../components/common/Badge.jsx';
import { Spinner } from '../components/common/Spinner.jsx';

export const MeetingsListPage = () => {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMeetings({ search, page, limit: 12 });
      const payload = res?.data?.data || res?.data || {};
      setMeetings(payload.meetings || []);
      setTotalPages(payload.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load meetings:', err);
      setError('Could not load meetings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMeetings();
  };

  const handleToggleCompareSelect = (meetingId) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(meetingId)) {
        return prev.filter(id => id !== meetingId);
      }
      if (prev.length >= 2) {
        return [prev[1], meetingId];
      }
      return [...prev, meetingId];
    });
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 2) {
      navigate(`/meetings/compare?meetingA=${selectedForCompare[0]}&meetingB=${selectedForCompare[1]}`);
    }
  };

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

  const handleDelete = async (meetingId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteMeeting(meetingId);
        setMeetings((prev) => prev.filter(m => m.id !== meetingId));
        setSelectedForCompare((prev) => prev.filter(id => id !== meetingId));
      } catch (err) {
        alert(err?.response?.data?.error || err?.message || 'Failed to delete meeting.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Meeting Intelligence Library
          </h1>
          <p className="text-xs font-bold text-gray-600 mt-0.5">
            All ingested transcripts, grounded decisions, and verified action items
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedForCompare.length === 2 && (
            <button
              onClick={handleLaunchCompare}
              className="flex items-center gap-2 px-4 py-2.5 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-xs shadow-neo hover:shadow-neo-lg transition-all cursor-pointer animate-pulse"
            >
              <GitCompare size={16} /> Compare 2 Selected
            </button>
          )}

          <Link
            to="/meetings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white border-2 border-black rounded-xl font-black text-xs shadow-neo hover:shadow-neo-lg transition-all cursor-pointer active:translate-y-0.5"
          >
            <PlusCircle size={16} className="text-neo-yellow" /> Process New
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings by title, notes, or attendee name..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-black rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-lg font-black text-xs shadow-neo-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Selection prompt for Compare */}
      <div className="p-3 bg-amber-50 border-2 border-black rounded-xl text-xs font-bold text-black flex items-center justify-between shadow-neo-xs">
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-amber-700" />
          <span>Select any 2 meetings with the checkbox to run a side-by-side delta comparison.</span>
        </div>
        <span className="font-mono text-[11px] bg-white px-2 py-0.5 border border-black rounded">
          {selectedForCompare.length} / 2 Selected
        </span>
      </div>

      {/* Meeting Cards List */}
      {loading ? (
        <div className="p-12 bg-white border-2 border-black rounded-xl flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs font-bold uppercase text-gray-600">Loading meeting library...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{typeof error === 'string' ? error : (error?.message || 'Error loading meetings')}</span>
        </div>
      ) : meetings.length === 0 ? (
        <div className="p-12 bg-white border-2 border-black rounded-2xl text-center space-y-3 shadow-neo">
          <p className="font-black text-base text-black">No meetings found</p>
          <p className="text-xs font-bold text-gray-600">Try adjusting your search criteria or create a new meeting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => {
            const isSelected = selectedForCompare.includes(meeting.id);
            const formattedDate = meeting.meeting_date
              ? new Date(meeting.meeting_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'No date';

            const isCompleted = meeting.status === 'processed' || meeting.analysis_status === 'completed';

            return (
              <div
                key={meeting.id}
                className={`bg-white border-2 border-black rounded-xl p-5 shadow-neo-sm hover:shadow-neo transition-all flex flex-col justify-between relative ${
                  isSelected ? 'ring-3 ring-black bg-amber-50/70' : ''
                }`}
              >
                {/* Top Row: Compare Checkbox + Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCompareSelect(meeting.id)}
                      className="w-4 h-4 rounded border-2 border-black accent-black cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase text-gray-600">Compare</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {renderSourceBadge(meeting.source_type)}
                    <Badge variant={isCompleted ? 'verified' : 'pending'} size="sm">
                      {isCompleted ? 'GROUNDED' : (meeting.status || meeting.analysis_status || 'PENDING')}
                    </Badge>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-2 mb-4">
                  <Link
                    to={`/meetings/${meeting.id}`}
                    className="font-black text-base text-black hover:text-blue-900 transition-colors line-clamp-2 block"
                  >
                    {meeting.title}
                  </Link>
                  {meeting.summary && (
                    <p className="text-xs text-gray-700 font-medium line-clamp-3">
                      {meeting.summary}
                    </p>
                  )}
                </div>

                {/* Footer Meta & Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(meeting.id, meeting.title)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-gray-200 transition-colors cursor-pointer"
                      title="Delete meeting"
                    >
                      <Trash2 size={13} />
                    </button>
                    <Link
                      to={`/meetings/${meeting.id}`}
                      className="px-2.5 py-1 bg-neo-yellow hover:bg-yellow-300 border border-black rounded-md text-black font-black text-xs shadow-neo-xs flex items-center gap-1"
                    >
                      Open <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-1.5 bg-white disabled:opacity-40 border-2 border-black rounded-lg font-bold text-xs shadow-neo-xs hover:bg-gray-100 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-black px-3 py-1 bg-neo-yellow border-2 border-black rounded-lg">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-1.5 bg-white disabled:opacity-40 border-2 border-black rounded-lg font-bold text-xs shadow-neo-xs hover:bg-gray-100 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default MeetingsListPage;
