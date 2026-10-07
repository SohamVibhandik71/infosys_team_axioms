import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  User, 
  Calendar, 
  GitFork, 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert, 
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MousePointer,
  RotateCcw,
  Info
} from 'lucide-react';

// Custom Action Item Node for React Flow
const ActionNode = ({ data }) => {
  const { 
    id,
    title, 
    task,
    owner, 
    owner_name,
    due_date, 
    deadline,
    status, 
    priority, 
    isBlocked,
    blockers = [],
    onStatusChange
  } = data;

  const isDone = status === 'completed' || status === 'done';
  const isDirectlyBlocked = status === 'blocked';
  // A task is only considered blocked if it is NOT done yet
  const isBlockedTask = !isDone && (isDirectlyBlocked || isBlocked);
  
  const displayTitle = title || task || 'Untitled Task';
  const displayOwner = owner || owner_name;
  const isUnassigned = !displayOwner || displayOwner.trim() === '' || displayOwner.toLowerCase() === 'unassigned';
  const displayDueDate = due_date || (deadline ? (typeof deadline === 'string' && deadline.includes('T') ? new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : deadline) : null);

  const getPriorityBadgeClass = () => {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return 'bg-rose-500 text-white';
      case 'high':
        return 'bg-rose-300 text-black';
      case 'medium':
        return 'bg-amber-300 text-black';
      case 'low':
        return 'bg-emerald-200 text-black';
      default:
        return 'bg-gray-200 text-black';
    }
  };

  return (
    <div
      className={`min-w-[250px] max-w-[300px] p-3.5 rounded-2xl border-3 font-sans transition-all select-none relative ${
        isDone
          ? 'bg-emerald-50 border-emerald-600 shadow-neo-sm opacity-90'
          : isBlockedTask
          ? 'bg-rose-50 border-rose-600 shadow-[4px_4px_0px_0px_rgba(225,29,72,1)] ring-2 ring-rose-400'
          : status === 'in_progress'
          ? 'bg-sky-50 border-black shadow-neo'
          : 'bg-white border-black shadow-neo'
      }`}
    >
      {/* React Flow Connection Handles (Target on Left/Top, Source on Right/Bottom) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3.5 !h-3.5 !bg-neo-yellow !border-2 !border-black !-left-2 rounded-full cursor-crosshair hover:scale-125 transition-transform"
        title="Target Handle (Drop a blocker connection here)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-3.5 !h-3.5 !bg-neo-yellow !border-2 !border-black !-top-2 rounded-full cursor-crosshair hover:scale-125 transition-transform"
        title="Target Handle (Drop a blocker connection here)"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3.5 !h-3.5 !bg-black !border-2 !border-neo-yellow !-right-2 rounded-full cursor-crosshair hover:scale-125 transition-transform"
        title="Source Handle (Drag from here to block downstream tasks)"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3.5 !h-3.5 !bg-black !border-2 !border-neo-yellow !-bottom-2 rounded-full cursor-crosshair hover:scale-125 transition-transform"
        title="Source Handle (Drag from here to block downstream tasks)"
      />

      {/* Header Badges & Inline Status Switcher */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={`text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded shadow-neo-xs flex items-center gap-1 ${
            isDone
              ? 'bg-emerald-400 text-black'
              : isBlockedTask
              ? 'bg-rose-500 text-white animate-pulse'
              : status === 'in_progress'
              ? 'bg-sky-300 text-black'
              : 'bg-amber-200 text-black'
          }`}
        >
          {isDone ? '✓ COMPLETED' : isBlockedTask ? '🚨 BLOCKED' : status === 'in_progress' ? 'IN PROGRESS' : (status || 'TODO').toUpperCase()}
        </span>

        <div className="flex items-center gap-1">
          {priority && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 border border-black rounded ${getPriorityBadgeClass()}`}
            >
              {priority}
            </span>
          )}

          {/* Inline Status Dropdown (nodrag prevents canvas movement) */}
          <select
            value={status || 'todo'}
            onChange={(e) => {
              e.stopPropagation();
              if (onStatusChange) {
                onStatusChange(id, e.target.value);
              }
            }}
            className="nodrag px-1.5 py-0.5 text-[9px] font-black bg-white border border-black rounded shadow-neo-xs cursor-pointer focus:outline-none hover:bg-gray-50"
            title="Change status directly"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Task Title */}
      <div className={`font-black text-xs text-black leading-snug mb-2 ${isDone ? 'line-through text-gray-500' : ''}`}>
        {displayTitle}
      </div>

      {/* Blocked Alert Banner if blocked by active prerequisites (only when NOT done) */}
      {isBlockedTask && !isDone && blockers && blockers.length > 0 && (
        <div className="mb-2 p-1.5 bg-rose-100 border border-rose-400 rounded-lg text-[9px] text-rose-900 font-bold flex items-start gap-1">
          <AlertCircle size={12} className="shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-tight">
            Blocked by: <strong className="underline">{blockers.join(', ')}</strong>
          </span>
        </div>
      )}

      {/* Owner & Due */}
      <div className="space-y-1 text-[10px] font-bold text-gray-700 border-t border-black/20 pt-1.5">
        <div className="flex items-center gap-1">
          <User size={11} className="text-gray-600 shrink-0" />
          {isUnassigned ? (
            <span className="text-rose-700 font-mono font-black">[UNASSIGNED]</span>
          ) : (
            <span className="text-black truncate">{displayOwner}</span>
          )}
        </div>
        {displayDueDate && (
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar size={11} className="shrink-0" />
            <span>{displayDueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  actionNode: ActionNode
};

export const DependencyGraphView = ({
  actions = [],
  dependencies = [],
  onAddDependency,
  onDeleteDependency,
  onStatusChange
}) => {
  const [showGuide, setShowGuide] = useState(true);

  // Set up nodes & edges layout
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!actions || actions.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Build action lookup
    const actionMap = new Map();
    actions.forEach(a => {
      actionMap.set(String(a.id), a);
    });

    // Determine blocked nodes (target nodes of any dependency where source is not yet done/completed)
    const blockedNodeIds = new Set();
    const blockerTitlesMap = new Map(); // targetId -> Array of blocker task titles

    dependencies.forEach((dep) => {
      const sourceId = String(dep.source_action_id || dep.sourceActionId || dep.blocker_task_id || dep.blocker_id || '');
      const targetId = String(dep.target_action_id || dep.targetActionId || dep.blocked_task_id || dep.blocked_id || dep.dependent_action_id || '');

      if (!sourceId || !targetId) return;

      const sourceAction = actionMap.get(sourceId);
      const targetAction = actionMap.get(targetId);
      const isSourceCompleted = sourceAction && (sourceAction.status === 'completed' || sourceAction.status === 'done');
      const isTargetCompleted = targetAction && (targetAction.status === 'completed' || targetAction.status === 'done');

      if (!isSourceCompleted && !isTargetCompleted) {
        blockedNodeIds.add(targetId);
        const list = blockerTitlesMap.get(targetId) || [];
        if (sourceAction) {
          list.push(sourceAction.title || sourceAction.task || 'Prerequisite Task');
        }
        blockerTitlesMap.set(targetId, list);
      }
    });

    // Also mark any action whose status is directly 'blocked' (if not completed)
    actions.forEach(action => {
      const isActDone = action.status === 'completed' || action.status === 'done';
      if (action.status === 'blocked' && !isActDone) {
        blockedNodeIds.add(String(action.id));
      }
    });

    // Create DAG / Grid Layout
    const nodes = actions.map((action, index) => {
      const actId = String(action.id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const isBlockedByPrereq = blockedNodeIds.has(actId);
      const isDirectlyBlocked = action.status === 'blocked';
      const blockers = blockerTitlesMap.get(actId) || [];

      return {
        id: actId,
        type: 'actionNode',
        position: { x: col * 350 + 40, y: row * 220 + 40 },
        data: {
          ...action,
          id: action.id,
          title: action.title || action.task,
          owner: action.owner || action.owner_name,
          due_date: action.due_date,
          deadline: action.deadline,
          status: action.status || 'todo',
          priority: action.priority || 'medium',
          isBlocked: isBlockedByPrereq || isDirectlyBlocked,
          isDirectlyBlocked,
          blockers,
          onStatusChange
        }
      };
    });

    // Create styled Edges linking blocker to blocked task
    const edges = dependencies
      .map((dep, index) => {
        const sourceId = String(dep.source_action_id || dep.sourceActionId || dep.blocker_task_id || dep.blocker_id || '');
        const targetId = String(dep.target_action_id || dep.targetActionId || dep.blocked_task_id || dep.blocked_id || dep.dependent_action_id || '');

        if (!sourceId || !targetId) return null;

        const sourceAction = actionMap.get(sourceId);
        const isSourceCompleted = sourceAction && (sourceAction.status === 'completed' || sourceAction.status === 'done');

        return {
          id: String(dep.id || `edge-${sourceId}-${targetId}-${index}`),
          source: sourceId,
          target: targetId,
          label: isSourceCompleted ? '✓ Unblocked' : (dep.relationship || dep.dependency_type || 'blocks').toUpperCase(),
          animated: !isSourceCompleted,
          style: {
            stroke: isSourceCompleted ? '#059669' : '#e11d48',
            strokeWidth: 3
          },
          labelStyle: {
            fill: '#111111',
            fontWeight: 900,
            fontSize: 10
          },
          labelBgStyle: {
            fill: isSourceCompleted ? '#86efac' : '#FFD93D',
            stroke: '#111111',
            strokeWidth: 2,
            rx: 4,
            ry: 4
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: isSourceCompleted ? '#059669' : '#e11d48'
          }
        };
      })
      .filter(Boolean);

    return { initialNodes: nodes, initialEdges: edges };
  }, [actions, dependencies, onStatusChange]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-sync state when actions or dependencies change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Connect new blocker edge via handle drag-and-drop
  const onConnect = useCallback(
    async (params) => {
      const sourceAction = actions.find(a => String(a.id) === String(params.source));
      const isSourceCompleted = sourceAction && (sourceAction.status === 'completed' || sourceAction.status === 'done');

      if (onAddDependency) {
        await onAddDependency({
          source_action_id: params.source,
          target_action_id: params.target,
          dependency_type: 'blocks'
        });
      }
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: !isSourceCompleted,
            label: isSourceCompleted ? '✓ Unblocked' : 'BLOCKS',
            style: { stroke: isSourceCompleted ? '#059669' : '#e11d48', strokeWidth: 3 },
            labelStyle: { fill: '#111111', fontWeight: 900, fontSize: 10 },
            labelBgStyle: {
              fill: isSourceCompleted ? '#86efac' : '#FFD93D',
              stroke: '#111111',
              strokeWidth: 2,
              rx: 4,
              ry: 4
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: isSourceCompleted ? '#059669' : '#e11d48'
            }
          },
          eds
        )
      );
    },
    [onAddDependency, setEdges, actions]
  );

  // Delete edge when user removes connection
  const onEdgesDelete = useCallback(
    async (deletedEdges) => {
      if (onDeleteDependency && deletedEdges && deletedEdges.length > 0) {
        for (const edge of deletedEdges) {
          if (edge.id && !edge.id.startsWith('edge-')) {
            await onDeleteDependency(edge.id);
          }
        }
      }
    },
    [onDeleteDependency]
  );

  if (actions.length === 0) {
    return (
      <div className="p-8 bg-white border-2 border-black rounded-xl text-center shadow-neo-sm">
        <GitFork size={36} className="mx-auto text-gray-400 mb-2" />
        <h4 className="font-black text-sm text-black">No Action Items Available</h4>
        <p className="text-xs font-medium text-gray-600 mt-1">
          Once action items are extracted from your meeting, their visual dependency network will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Interactive Quick-Start Guide Accordion */}
      <div className="bg-white border-3 border-black rounded-2xl shadow-neo overflow-hidden">
        <div 
          onClick={() => setShowGuide(prev => !prev)}
          className="p-3.5 bg-neo-yellow/30 hover:bg-neo-yellow/50 flex items-center justify-between cursor-pointer transition-colors border-b-2 border-black"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-700" />
            <span className="font-black text-xs text-black tracking-tight uppercase">
              How the Dependency Graph Works (Interactive Guide)
            </span>
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold rounded-md">
              Guide
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <span>{showGuide ? 'Collapse Guide' : 'Expand Instructions'}</span>
            {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {showGuide && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#FFFDF5] text-xs">
            
            {/* Step 1 */}
            <div className="p-3 bg-white border-2 border-black rounded-xl shadow-neo-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-black">
                <span className="w-5 h-5 rounded-full bg-neo-yellow border border-black flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Drag to Link Blockers</span>
              </div>
              <p className="text-[11px] font-medium text-gray-700 leading-snug">
                Drag from the <strong className="text-black bg-gray-100 px-1 border border-black rounded">⚫ Black Dot</strong> (Source / Prerequisite) to the <strong className="text-black bg-yellow-100 px-1 border border-black rounded">🟡 Yellow Dot</strong> (Target) on another card.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-rose-50/70 border-2 border-black rounded-xl shadow-neo-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-rose-950">
                <span className="w-5 h-5 rounded-full bg-rose-300 border border-black flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Blocked Status (Red)</span>
              </div>
              <p className="text-[11px] font-medium text-rose-900 leading-snug">
                Downstream tasks stay <strong className="text-rose-700">🔴 Rose-Red (BLOCKED)</strong> with animated arrows until all their prerequisite tasks are finished.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-emerald-50/70 border-2 border-black rounded-xl shadow-neo-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-emerald-950">
                <span className="w-5 h-5 rounded-full bg-emerald-300 border border-black flex items-center justify-center text-[10px] font-mono">3</span>
                <span>Auto-Unblock (Green)</span>
              </div>
              <p className="text-[11px] font-medium text-emerald-900 leading-snug">
                Select <strong className="text-emerald-800">"Completed"</strong> on any blocker card to immediately turn connecting lines <strong className="text-emerald-700">🟢 Green (✓ Unblocked)</strong>!
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-white border-2 border-black rounded-xl shadow-neo-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-black">
                <span className="w-5 h-5 rounded-full bg-sky-200 border border-black flex items-center justify-center text-[10px] font-mono">4</span>
                <span>Edit & Navigate</span>
              </div>
              <p className="text-[11px] font-medium text-gray-700 leading-snug">
                Click any line and hit <kbd className="font-mono bg-gray-100 border border-black px-1 rounded text-[9px]">Delete</kbd> to remove it. Drag canvas to pan and scroll to zoom.
              </p>
            </div>

          </div>
        )}
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-2 border-black rounded-xl shadow-neo-sm text-xs font-bold">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-500 uppercase font-black text-[10px] tracking-wider">Legend:</span>
          
          <span className="flex items-center gap-1.5 text-black">
            <span className="w-3.5 h-3.5 bg-white border-2 border-black rounded-xs inline-block shadow-neo-xs"></span> 
            To Do / Normal
          </span>

          <span className="flex items-center gap-1.5 text-sky-800">
            <span className="w-3.5 h-3.5 bg-sky-200 border-2 border-black rounded-xs inline-block shadow-neo-xs"></span> 
            In Progress
          </span>

          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-3.5 h-3.5 bg-rose-400 border-2 border-black rounded-xs inline-block shadow-neo-xs"></span> 
            Blocked Task
          </span>

          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-3.5 h-3.5 bg-emerald-300 border-2 border-black rounded-xs inline-block shadow-neo-xs"></span> 
            Completed (Unblocks)
          </span>
        </div>

        <div className="text-[11px] text-gray-700 font-bold flex items-center gap-1.5">
          <MousePointer size={13} className="text-black" />
          <span>Tip: Drag ⚫ Source dot ➔ 🟡 Target dot to establish task blockers</span>
        </div>
      </div>

      {/* React Flow Canvas Container */}
      <div className="w-full h-[580px] bg-[#FFFDF5] border-3 border-black rounded-2xl shadow-neo overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#111111" gap={24} size={1} opacity={0.15} />
          <Controls className="!bg-white !border-2 !border-black !rounded-xl !shadow-neo-sm" />
          <MiniMap
            className="!bg-white !border-2 !border-black !rounded-xl !shadow-neo-sm overflow-hidden"
            nodeColor={(node) => {
              const status = node.data?.status;
              if (status === 'completed' || status === 'done') return '#34d399';
              if (node.data?.isBlocked || status === 'blocked') return '#f43f5e';
              if (status === 'in_progress') return '#38bdf8';
              return '#ffd93d';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DependencyGraphView;
