import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Share2,
  Video,
  Mic,
  FileCode
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Spinner } from '../common/Spinner.jsx';

export const MeetingHeader = ({
  meeting,
  onReprocess,
  onExport,
  onDelete,
  isProcessing = false
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  if (!meeting) return null;

  const formattedDate = meeting.meeting_date 
    ? new Date(meeting.meeting_date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'No Date Specified';

  const getStatusBadge = () => {
    const status = (meeting.analysis_status || meeting.status || 'pending').toLowerCase();
    switch (status) {
      case 'completed':
      case 'processed':
      case 'verified':
        return (
          <Badge variant="verified">
            <CheckCircle2 size={12} className="stroke-[3]" /> Processed & Verified
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="pending">
            <Spinner size="sm" /> Processing AI Pipeline...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="unverified">
            <AlertCircle size={12} className="stroke-[3]" /> Pipeline Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            <Clock size={12} className="stroke-[3]" /> Pending Analysis
          </Badge>
        );
    }
  };

  const renderSourcePill = () => {
    const type = (meeting.source_type || 'text').toLowerCase();
    const fileName = meeting.source_file_name;
    switch (type) {
      case 'video':
        return (
          <div className="flex items-center gap-1.5 bg-purple-100 text-purple-950 px-2.5 py-1 border border-black rounded-md shadow-neo-xs font-mono" title={fileName || 'Video Recording'}>
            <Video size={14} className="text-purple-700 stroke-[2.5]" />
            <span className="uppercase font-black text-xs">VIDEO RECORDING</span>
            {fileName && <span className="text-[10px] font-bold text-purple-800 truncate max-w-[180px]">({fileName})</span>}
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-950 px-2.5 py-1 border border-black rounded-md shadow-neo-xs font-mono" title={fileName || 'Audio Recording'}>
            <Mic size={14} className="text-amber-700 stroke-[2.5]" />
            <span className="uppercase font-black text-xs">AUDIO RECORDING</span>
            {fileName && <span className="text-[10px] font-bold text-amber-800 truncate max-w-[180px]">({fileName})</span>}
          </div>
        );
      case 'pdf':
        return (
          <div className="flex items-center gap-1.5 bg-rose-100 text-rose-950 px-2.5 py-1 border border-black rounded-md shadow-neo-xs font-mono" title={fileName || 'PDF Document'}>
            <FileText size={14} className="text-rose-700 stroke-[2.5]" />
            <span className="uppercase font-black text-xs">PDF DOCUMENT</span>
            {fileName && <span className="text-[10px] font-bold text-rose-800 truncate max-w-[180px]">({fileName})</span>}
          </div>
        );
      case 'docx':
      case 'doc':
        return (
          <div className="flex items-center gap-1.5 bg-blue-100 text-blue-950 px-2.5 py-1 border border-black rounded-md shadow-neo-xs font-mono" title={fileName || 'DOCX Document'}>
            <FileCode size={14} className="text-blue-700 stroke-[2.5]" />
            <span className="uppercase font-black text-xs">DOCX DOCUMENT</span>
            {fileName && <span className="text-[10px] font-bold text-blue-800 truncate max-w-[180px]">({fileName})</span>}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2.5 py-1 border border-black rounded-md shadow-neo-xs font-mono">
            <FileText size={14} className="text-gray-700" />
            <span className="uppercase font-bold text-xs">RAW TEXT / NOTES</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border-3 border-black rounded-xl p-6 shadow-neo mb-8 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title & Metadata */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {meeting.title}
            </h1>
            {getStatusBadge()}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700">
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 border border-black rounded-md shadow-neo-xs">
              <Calendar size={14} className="text-black" />
              <span>{formattedDate}</span>
            </div>

            {meeting.attendees && meeting.attendees.length > 0 && (
              <div className="flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 border border-black rounded-md shadow-neo-xs">
                <Users size={14} className="text-black" />
                <span>{meeting.attendees.length} Attendees:</span>
                <span className="text-gray-900 font-mono">
                  {meeting.attendees.slice(0, 3).join(', ')}
                  {meeting.attendees.length > 3 ? ` +${meeting.attendees.length - 3}` : ''}
                </span>
              </div>
            )}

            {renderSourcePill()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          {onReprocess && (
            <button
              onClick={onReprocess}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-yellow-100 disabled:opacity-50 border-2 border-black rounded-lg font-bold text-xs shadow-neo-sm hover:shadow-neo transition-all cursor-pointer active:translate-y-0.5"
              title="Rerun AI extraction & verification pipeline"
            >
              <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />
              {isProcessing ? 'Processing...' : 'Re-run Pipeline'}
            </button>
          )}

          {onExport && (
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-lg font-bold text-xs shadow-neo-sm hover:shadow-neo transition-all cursor-pointer active:translate-y-0.5"
              >
                <Download size={14} />
                Export
              </button>
              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-black rounded-lg shadow-neo-md z-30 py-1 animate-scaleUp">
                  <button
                    onClick={() => {
                      onExport('json');
                      setExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-neo-yellow text-black flex items-center gap-2 cursor-pointer"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => {
                      onExport('markdown');
                      setExportDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-neo-yellow text-black flex items-center gap-2 border-t border-gray-200 cursor-pointer"
                  >
                    Export as Markdown
                  </button>
                </div>
              )}
            </div>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-black rounded-lg font-bold text-xs shadow-neo-sm hover:shadow-neo transition-all cursor-pointer active:translate-y-0.5"
              title="Delete meeting"
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default MeetingHeader;
