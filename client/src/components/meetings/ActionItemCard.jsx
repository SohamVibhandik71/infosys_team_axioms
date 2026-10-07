import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Calendar, 
  Trash2, 
  Search, 
  AlertTriangle,
  FileSearch,
  Check,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { EvidenceModal } from '../common/EvidenceModal.jsx';

export const ActionItemCard = ({
  action,
  originalNotes = '',
  onStatusChange,
  onUpdate,
  onDelete
}) => {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Full edit modal state
  const [editTask, setEditTask] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStatus, setEditStatus] = useState('todo');

  if (!action) return null;

  const isDone = action.status === 'completed' || action.status === 'done';
  const ownerName = action.owner || action.owner_name;
  const isUnassigned = action.is_unassigned || !ownerName || ownerName.trim() === '' || ownerName.toLowerCase() === 'unassigned';
  const dueDateStr = action.due_date || (action.deadline ? (typeof action.deadline === 'string' && action.deadline.includes('T') ? new Date(action.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : action.deadline) : null);
  const isNoDeadline = !dueDateStr || dueDateStr.trim() === '' || dueDateStr.toLowerCase() === 'no deadline';
  const taskTitle = action.task || action.title || 'Untitled Task';

  const getStatusBadge = () => {
    switch (action.status) {
      case 'completed':
      case 'done':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 border-2 border-black rounded-lg text-xs font-black uppercase text-emerald-950 shadow-neo-xs">
            <CheckCircle2 size={12} className="text-emerald-700 stroke-[2.5]" />
            <span>Completed</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 border-2 border-black rounded-lg text-xs font-black uppercase text-blue-950 shadow-neo-xs">
            <Clock size={12} className="text-blue-700 stroke-[2.5]" />
            <span>In Progress</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 border-2 border-black rounded-lg text-xs font-black uppercase text-rose-950 shadow-neo-xs">
            <AlertTriangle size={12} className="text-rose-700 stroke-[2.5]" />
            <span>Blocked</span>
          </div>
        );
      case 'todo':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border-2 border-black rounded-lg text-xs font-black uppercase text-gray-800 shadow-neo-xs">
            <Circle size={12} className="text-gray-600 stroke-[2.5]" />
            <span>To Do</span>
          </div>
        );
    }
  };

  const getPriorityBadge = () => {
    switch (action.priority?.toLowerCase()) {
      case 'critical':
        return <Badge variant="high" size="sm">CRITICAL</Badge>;
      case 'high':
        return <Badge variant="high" size="sm">HIGH PRIORITY</Badge>;
      case 'medium':
        return <Badge variant="medium" size="sm">MEDIUM</Badge>;
      case 'low':
        return <Badge variant="low" size="sm">LOW</Badge>;
      default:
        return <Badge variant="medium" size="sm">MEDIUM</Badge>;
    }
  };

  const getVerificationBadge = () => {
    const status = action.verification_status || (action.verified ? 'verified' : (action.is_ambiguous ? 'ambiguous' : 'verified'));
    switch (status) {
      case 'verified':
        return (
          <Badge 
            variant="verified" 
            size="sm" 
            onClick={() => setEvidenceOpen(true)}
            className="cursor-pointer"
            title="Evidence verified against notes"
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
            title="Conflicting speaker assignments detected"
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
            title="Task is ambiguous or unassigned"
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

  const handleToggleDone = () => {
    if (onStatusChange) {
      onStatusChange(action.id, isDone ? 'todo' : 'completed');
    }
  };

  // Open Full Edit Modal
  const openEditModal = () => {
    setEditTask(action.task || action.title || '');
    setEditOwner(action.owner || action.owner_name || '');
    let initialDate = '';
    const rawDate = action.deadline || action.due_date;
    if (rawDate && rawDate !== 'No deadline' && rawDate !== '[NO DEADLINE]') {
      try {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          initialDate = parsed.toISOString().split('T')[0];
        }
      } catch (_) {
        initialDate = '';
      }
    }
    setEditDeadline(initialDate);
    setEditPriority(action.priority || 'medium');
    setEditStatus(action.status || 'todo');
    setEditModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (onUpdate) {
      onUpdate(action.id, {
        task: editTask.trim(),
        ownerName: editOwner.trim() ? editOwner.trim() : null,
        deadline: editDeadline ? editDeadline : null,
        priority: editPriority,
        status: editStatus
      });
    }
    setEditModalOpen(false);
  };

  return (
    <>
      <div 
        className={`bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm hover:shadow-neo transition-all ${
          isDone ? 'opacity-70 bg-gray-50' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          
          {/* Checkbox & Main Info */}
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleToggleDone}
              className={`mt-0.5 w-6 h-6 rounded-md border-2 border-black flex items-center justify-center transition-colors cursor-pointer shadow-neo-xs shrink-0 ${
                isDone ? 'bg-emerald-400 text-black' : 'bg-white hover:bg-emerald-100'
              }`}
              aria-label={isDone ? 'Mark todo' : 'Mark completed'}
            >
              {isDone && <Check size={16} className="stroke-[3]" />}
            </button>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`font-black text-sm text-black tracking-tight ${isDone ? 'line-through text-gray-500' : ''}`}>
                  {taskTitle}
                </h3>
                {getPriorityBadge()}
                {getVerificationBadge()}
              </div>

              {action.description && (
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {action.description}
                </p>
              )}

              {/* Owner, Due Date, and Status Fixed Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Fixed Owner Pill */}
                {isUnassigned ? (
                  <Badge variant="unassigned" size="sm">
                    <User size={12} /> [UNASSIGNED]
                  </Badge>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border-2 border-black rounded-lg text-xs font-bold text-black shadow-neo-xs">
                    <User size={12} className="text-blue-700 stroke-[2.5]" />
                    <span>Owner: <strong className="text-blue-900">{ownerName}</strong></span>
                  </div>
                )}

                {/* Fixed Due Date Pill */}
                {isNoDeadline ? (
                  <Badge variant="no_deadline" size="sm">
                    <Calendar size={12} /> [NO DEADLINE]
                  </Badge>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border-2 border-black rounded-lg text-xs font-bold text-black shadow-neo-xs">
                    <Calendar size={12} className="text-amber-700 stroke-[2.5]" />
                    <span>Due: <strong className="text-amber-900">{dueDateStr}</strong></span>
                  </div>
                )}

                {/* Fixed Status Pill */}
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Action buttons on right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Dedicated Edit Button on Right */}
            <button
              onClick={openEditModal}
              className="p-1.5 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-lg shadow-neo-xs text-black transition-colors cursor-pointer"
              title="Edit Priority, Deadline, Owner & Task"
              aria-label="Edit action item"
            >
              <Edit3 size={15} className="stroke-[2.5]" />
            </button>

            {/* Evidence Modal Button */}
            <button
              onClick={() => setEvidenceOpen(true)}
              className="p-1.5 bg-amber-50 hover:bg-neo-yellow border-2 border-black rounded-lg shadow-neo-xs text-black transition-colors cursor-pointer"
              title="Inspect grounded evidence quote"
              aria-label="View evidence"
            >
              <FileSearch size={15} className="stroke-[2.5]" />
            </button>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => onDelete(action.id)}
                className="p-1.5 bg-white hover:bg-rose-100 text-rose-800 border-2 border-black rounded-lg shadow-neo-xs transition-colors cursor-pointer"
                title="Delete action item"
                aria-label="Delete action"
              >
                <Trash2 size={15} className="stroke-[2.5]" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Edit Action Item Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white border-3 border-black rounded-2xl p-6 shadow-neo-lg space-y-5 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neo-yellow border-2 border-black rounded-lg flex items-center justify-center shadow-neo-xs">
                  <Edit3 size={16} className="text-black" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Edit Action Item</h3>
                  <p className="text-[11px] font-bold text-gray-500">Update owner, deadline, priority, and task details</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg border-2 border-black hover:bg-rose-200 transition-colors shadow-neo-xs cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Task Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Task Description *
                </label>
                <input
                  type="text"
                  required
                  value={editTask}
                  onChange={(e) => setEditTask(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-neo-xs"
                />
              </div>

              {/* Owner Input with Quick Unassign Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Assigned Owner
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditOwner('')}
                    className="text-[10px] font-black uppercase text-amber-800 underline hover:text-black cursor-pointer"
                  >
                    Set as [UNASSIGNED]
                  </button>
                </div>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  placeholder="e.g. Elena Rostova or leave empty for [UNASSIGNED]"
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-neo-xs"
                />
              </div>

              {/* Deadline & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Target Deadline
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditDeadline('')}
                      className="text-[10px] font-black uppercase text-amber-800 underline hover:text-black cursor-pointer"
                    >
                      Clear Date
                    </button>
                  </div>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-neo-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                    Priority Level
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-black uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-neo-xs cursor-pointer"
                  >
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                  Workflow Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-black rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-black shadow-neo-xs cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border-2 border-black rounded-xl font-black text-xs shadow-neo-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-xs text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Evidence Inspection Modal */}
      <EvidenceModal
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title="Action Item Evidence & Grounding"
        itemType="Action Item"
        itemText={`${action.title || action.task}${action.description ? ` - ${action.description}` : ''}`}
        evidence={action.evidence || []}
        originalNotes={originalNotes}
        verificationStatus={action.verification_status}
        confidence={action.confidence_score ?? 1.0}
        flagReason={action.flag_reason}
      />
    </>
  );
};

export default ActionItemCard;
