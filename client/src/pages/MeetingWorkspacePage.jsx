import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getMeetingById, 
  processMeeting, 
  deleteMeeting, 
  exportMeeting 
} from '../services/meetingApi.js';
import { updateAction, deleteAction } from '../services/actionApi.js';
import { resolveQuestion } from '../services/questionApi.js';
import { createDependency, deleteDependency } from '../services/dependencyApi.js';

import { MeetingHeader } from '../components/meetings/MeetingHeader.jsx';
import { ActionItemCard } from '../components/meetings/ActionItemCard.jsx';
import { DecisionCard } from '../components/meetings/DecisionCard.jsx';
import { QuestionCard } from '../components/meetings/QuestionCard.jsx';
import { VerificationPanel } from '../components/meetings/VerificationPanel.jsx';
import { DependencyGraphView } from '../components/meetings/DependencyGraphView.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { Badge } from '../components/common/Badge.jsx';

import { 
  FileText, 
  CheckSquare, 
  Layers, 
  HelpCircle, 
  GitFork, 
  ShieldCheck, 
  Search, 
  Filter, 
  Sparkles, 
  Quote, 
  AlertCircle,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getErrorMessage } from '../utils/errorUtils.js';

export const MeetingWorkspacePage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter state for action items
  const [actionSearch, setActionSearch] = useState('');
  const [actionStatusFilter, setActionStatusFilter] = useState('all');
  const [actionPriorityFilter, setActionPriorityFilter] = useState('all');

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMeetingById(meetingId);
      const data = res?.data?.data || res?.data;
      const meetingObj = data?.meeting || data || {};
      const actionsList = data?.actions || meetingObj.actions || [];
      const decisionsList = data?.decisions || meetingObj.decisions || [];
      const questionsList = data?.questions || meetingObj.questions || [];
      const dependenciesList = data?.dependencies || meetingObj.dependencies || [];
      const verificationData = data?.verification || meetingObj.verification || null;

      const fullMeeting = {
        ...meetingObj,
        actions: actionsList,
        decisions: decisionsList,
        questions: questionsList,
        dependencies: dependenciesList,
        verification: verificationData
      };
      setMeeting(fullMeeting);
    } catch (err) {
      console.error('Failed to load meeting workspace:', err);
      setError(getErrorMessage(err, 'Meeting not found or inaccessible.'));
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Reprocess pipeline
  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      await processMeeting(meetingId);
      await fetchMeeting();
    } catch (err) {
      console.error('Pipeline re-run failed:', err);
      alert(err?.response?.data?.error || err?.message || 'Failed to reprocess meeting.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export report
  const handleExport = async (format = 'json') => {
    try {
      const res = await exportMeeting(meetingId, format);
      const payload = res?.data?.data || res?.data;
      if (format === 'json') {
        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title.replace(/\s+/g, '_')}_MeetingOS_Report.json`;
        a.click();
      } else {
        const mdText = payload?.markdown || payload?.content || '';
        const blob = new Blob([mdText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title.replace(/\s+/g, '_')}_MeetingOS_Report.md`;
        a.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export meeting report.');
    }
  };

  // Delete meeting
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this meeting?')) {
      try {
        await deleteMeeting(meetingId);
        navigate('/meetings');
      } catch (err) {
        alert(err?.response?.data?.error || err?.message || 'Failed to delete meeting.');
      }
    }
  };

  // Action status update
  const handleActionStatusChange = async (actionId, newStatus) => {
    try {
      await updateAction(actionId, { status: newStatus });
      setMeeting((prev) => ({
        ...prev,
        actions: (prev.actions || []).map(a => a.id === actionId ? { ...a, status: newStatus } : a)
      }));
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  // Action update (priority, deadline, owner, task, status)
  const handleActionUpdate = async (actionId, updateData) => {
    try {
      const res = await updateAction(actionId, updateData);
      const updated = res?.data?.data?.action || res?.data?.action || updateData;
      setMeeting((prev) => ({
        ...prev,
        actions: (prev.actions || []).map((a) => {
          if (a.id !== actionId) return a;
          const newOwner = updateData.ownerName !== undefined ? updateData.ownerName : (a.owner || a.owner_name);
          const newDeadline = updateData.deadline !== undefined ? updateData.deadline : a.deadline;
          const newPriority = updateData.priority !== undefined ? updateData.priority : a.priority;
          const newStatus = updateData.status !== undefined ? updateData.status : a.status;
          const newTask = updateData.task !== undefined ? updateData.task : (a.task || a.title);

          return {
            ...a,
            ...updated,
            task: newTask,
            title: newTask,
            owner_name: newOwner,
            owner: newOwner,
            is_unassigned: !newOwner || newOwner.trim() === '' || newOwner.toLowerCase() === 'unassigned',
            deadline: newDeadline,
            due_date: newDeadline ? (typeof newDeadline === 'string' && newDeadline.includes('T') ? new Date(newDeadline).toLocaleDateString() : newDeadline) : null,
            priority: newPriority,
            status: newStatus
          };
        })
      }));
    } catch (err) {
      console.error('Failed to update action item:', err);
      alert('Failed to update action item: ' + (err?.response?.data?.error || err.message));
    }
  };

  // Action delete
  const handleActionDelete = async (actionId) => {
    try {
      await deleteAction(actionId);
      setMeeting((prev) => ({
        ...prev,
        actions: (prev.actions || []).filter(a => a.id !== actionId)
      }));
    } catch (err) {
      console.error('Failed to delete action:', err);
    }
  };

  // Question resolution
  const handleResolveQuestion = async (questionId, payload) => {
    try {
      await resolveQuestion(questionId, payload);
      setMeeting((prev) => ({
        ...prev,
        questions: (prev.questions || []).map(q => q.id === questionId ? { ...q, ...payload } : q)
      }));
    } catch (err) {
      console.error('Failed to resolve question:', err);
      throw err;
    }
  };

  // Dependency add
  const handleAddDependency = async (depData) => {
    try {
      const srcId = depData.source_action_id || depData.sourceActionId;
      const tgtId = depData.target_action_id || depData.targetActionId;
      const rel = depData.dependency_type || depData.relationship || 'blocks';
      
      const res = await createDependency({
        meetingId,
        meeting_id: meetingId,
        sourceActionId: srcId,
        targetActionId: tgtId,
        source_action_id: srcId,
        target_action_id: tgtId,
        relationship: rel
      });

      const newDep = res?.data?.data?.dependency || res?.data?.dependency || {
        id: crypto.randomUUID(),
        meeting_id: meetingId,
        source_action_id: srcId,
        target_action_id: tgtId,
        sourceActionId: srcId,
        targetActionId: tgtId,
        relationship: rel
      };

      setMeeting((prev) => ({
        ...prev,
        dependencies: [
          ...(prev.dependencies || []).filter(d => 
            !( ( (d.source_action_id === srcId || d.sourceActionId === srcId) && 
                (d.target_action_id === tgtId || d.targetActionId === tgtId) ) )
          ),
          newDep
        ]
      }));
    } catch (err) {
      console.error('Failed to create dependency:', err);
    }
  };

  // Dependency delete
  const handleDeleteDependency = async (dependencyId) => {
    try {
      await deleteDependency(dependencyId);
      setMeeting((prev) => ({
        ...prev,
        dependencies: (prev.dependencies || []).filter(d => d.id !== dependencyId)
      }));
    } catch (err) {
      console.error('Failed to delete dependency:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-black uppercase tracking-wider text-black">
          Loading Grounded Meeting Workspace...
        </p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="p-8 bg-white border-3 border-black rounded-2xl shadow-neo text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-rose-600" />
        <h2 className="text-xl font-black text-black">Error Accessing Workspace</h2>
        <p className="text-xs font-bold text-gray-700">
          {typeof error === 'string' ? error : (error?.message || 'Meeting not found or inaccessible.')}
        </p>
        <button
          onClick={() => navigate('/meetings')}
          className="px-4 py-2 bg-neo-yellow border-2 border-black rounded-lg font-black text-xs shadow-neo-sm hover:bg-yellow-300 cursor-pointer"
        >
          Return to Meetings List
        </button>
      </div>
    );
  }

  const actions = meeting.actions || [];
  const decisions = meeting.decisions || [];
  const questions = meeting.questions || [];
  const dependencies = meeting.dependencies || [];
  const originalNotes = meeting.original_notes || '';

  // Filtered actions
  const filteredActions = actions.filter(action => {
    const searchLower = actionSearch.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      (action.title && action.title.toLowerCase().includes(searchLower)) ||
      (action.task && action.task.toLowerCase().includes(searchLower)) ||
      (action.owner && action.owner.toLowerCase().includes(searchLower)) ||
      (action.owner_name && action.owner_name.toLowerCase().includes(searchLower));

    const matchesStatus = actionStatusFilter === 'all' || 
      action.status === actionStatusFilter ||
      (actionStatusFilter === 'todo' && (action.status === 'pending' || action.status === 'todo')) ||
      (actionStatusFilter === 'completed' && (action.status === 'done' || action.status === 'completed'));

    const actionPriority = (action.priority || 'medium').toLowerCase();
    const matchesPriority = actionPriorityFilter === 'all' || actionPriority === actionPriorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tabs = [
    { id: 'summary', label: 'Summary & Overview', icon: FileText, count: null },
    { id: 'actions', label: 'Action Items', icon: CheckSquare, count: actions.length },
    { id: 'decisions', label: 'Decisions', icon: Layers, count: decisions.length },
    { id: 'questions', label: 'Questions', icon: HelpCircle, count: questions.length },
    { id: 'dependencies', label: 'Dependency Graph', icon: GitFork, count: dependencies.length },
    { id: 'verification', label: 'Grounded Truth Report', icon: ShieldCheck, count: null }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header */}
      <MeetingHeader
        meeting={meeting}
        onReprocess={handleReprocess}
        onExport={handleExport}
        onDelete={handleDelete}
        isProcessing={isProcessing}
      />

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-3 border-black no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-neo-xs ${
                isActive
                  ? 'bg-neo-yellow text-black -translate-y-0.5 shadow-neo'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] border border-black ${
                  isActive ? 'bg-black text-white' : 'bg-gray-100 text-black'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div>
        
        {/* 1. Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Executive Summary Card */}
            <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-amber-600" />
                <h3 className="text-lg font-black text-black tracking-tight">
                  Executive Summary
                </h3>
              </div>
              <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                {meeting.summary || 'No summary generated yet.'}
              </p>
            </div>

            {/* Grounding Source Transcript Card */}
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-neo space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Quote size={14} /> Grounding Source Document (Verbatim Transcript / Notes)
                </h4>
                <span className="text-[10px] font-mono font-bold text-gray-500">
                  {originalNotes.length} Characters
                </span>
              </div>
              <div className="p-4 bg-gray-50 border-2 border-black rounded-xl font-mono text-xs max-h-72 overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed shadow-inner">
                {originalNotes}
              </div>
            </div>

          </div>
        )}

        {/* 2. Action Items Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Filter Controls */}
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={actionSearch}
                  onChange={(e) => setActionSearch(e.target.value)}
                  placeholder="Search actions by task title, description, or owner..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-black rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-gray-600 shrink-0" />
                  <select
                    value={actionStatusFilter}
                    onChange={(e) => setActionStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-black rounded-lg shadow-neo-xs cursor-pointer focus:outline-none"
                    aria-label="Filter by Status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do / Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed / Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-gray-600 shrink-0" />
                  <select
                    value={actionPriorityFilter}
                    onChange={(e) => setActionPriorityFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-black rounded-lg shadow-neo-xs cursor-pointer focus:outline-none"
                    aria-label="Filter by Priority"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">🔥 Critical</option>
                    <option value="high">⚡ High</option>
                    <option value="medium">🔷 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>
                </div>

                {/* Reset Filters Button */}
                {(actionSearch || actionStatusFilter !== 'all' || actionPriorityFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setActionSearch('');
                      setActionStatusFilter('all');
                      setActionPriorityFilter('all');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black bg-neo-yellow hover:bg-yellow-300 border border-black rounded-lg transition-all cursor-pointer shadow-neo-xs text-black"
                    title="Reset all filters"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Cards List */}
            {filteredActions.length === 0 ? (
              <div className="p-8 bg-white border-2 border-black rounded-xl text-center shadow-neo-sm space-y-2">
                <p className="text-xs font-bold text-gray-700">No matching action items found.</p>
                {(actionSearch || actionStatusFilter !== 'all' || actionPriorityFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setActionSearch('');
                      setActionStatusFilter('all');
                      setActionPriorityFilter('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-lg shadow-neo-xs cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActions.map((action) => (
                  <ActionItemCard
                    key={action.id}
                    action={{
                      ...action,
                      title: action.title || action.task,
                      owner: action.owner || action.owner_name,
                      due_date: action.due_date || (action.deadline ? new Date(action.deadline).toLocaleDateString() : null),
                      verification_status: action.verification_status || (action.verified ? 'verified' : (action.is_ambiguous ? 'ambiguous' : 'verified'))
                    }}
                    originalNotes={originalNotes}
                    onStatusChange={handleActionStatusChange}
                    onUpdate={handleActionUpdate}
                    onDelete={handleActionDelete}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* 3. Decisions Tab */}
        {activeTab === 'decisions' && (
          <div className="space-y-3 animate-fadeIn">
            {decisions.length === 0 ? (
              <div className="p-8 bg-white border-2 border-black rounded-xl text-center shadow-neo-sm">
                <p className="text-xs font-bold text-gray-600">No explicit decisions extracted from this meeting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={{
                      ...decision,
                      title: decision.title || decision.decision,
                      verification_status: decision.verification_status || (decision.verified ? 'verified' : 'verified')
                    }}
                    attendees={meeting?.attendees || []}
                    originalNotes={originalNotes}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-3 animate-fadeIn">
            {questions.length === 0 ? (
              <div className="p-8 bg-white border-2 border-black rounded-xl text-center shadow-neo-sm">
                <p className="text-xs font-bold text-gray-600">No unresolved questions detected in this meeting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={{
                      ...question,
                      question_text: question.question_text || question.question
                    }}
                    onResolve={handleResolveQuestion}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Dependency Graph Tab */}
        {activeTab === 'dependencies' && (
          <div className="animate-fadeIn">
            <DependencyGraphView
              actions={actions.map(a => ({
                ...a,
                title: a.title || a.task,
                owner: a.owner || a.owner_name,
                due_date: a.due_date || (a.deadline ? (typeof a.deadline === 'string' && a.deadline.includes('T') ? new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : a.deadline) : null)
              }))}
              dependencies={dependencies.map(d => ({
                ...d,
                source_action_id: d.source_action_id || d.sourceActionId,
                target_action_id: d.target_action_id || d.targetActionId,
                dependency_type: d.dependency_type || d.relationship || 'blocks'
              }))}
              onAddDependency={handleAddDependency}
              onDeleteDependency={handleDeleteDependency}
              onStatusChange={handleActionStatusChange}
            />
          </div>
        )}

        {/* 6. Verification Report Tab */}
        {activeTab === 'verification' && (
          <div className="animate-fadeIn">
            <VerificationPanel
              verificationResults={meeting.verification ? [meeting.verification] : (meeting.verification_results || [])}
              actions={actions}
              decisions={decisions}
              originalNotes={originalNotes}
            />
          </div>
        )}

      </div>

    </div>
  );
};

export default MeetingWorkspacePage;
