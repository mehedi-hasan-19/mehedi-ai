import React, { useState } from 'react';
import {
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  LayoutGrid,
  List as ListIcon,
  Search,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import {
  ApprovalActionType,
  ApprovalRecord,
  LanguageCode,
  SpecialistAgentId,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  WorkflowRecord,
} from '../types';
import { SPECIALIST_AGENTS } from '../constants/agents';
import { MarkdownRenderer } from './MarkdownRenderer';

interface OperationsViewProps {
  activeTab: 'tasks' | 'workflows' | 'approvals';
  language: LanguageCode;
  tasks: TaskRecord[];
  workflows: WorkflowRecord[];
  approvals: ApprovalRecord[];
  onCreateTask: (task: {
    title: string;
    description: string;
    agentId: SpecialistAgentId;
    priority: TaskPriority;
    dueDate: string;
    subtasks: string[];
  }) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<TaskRecord>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onExecuteTaskWithAI: (task: TaskRecord) => Promise<void>;
  executingTaskId: string | null;
  onCreateWorkflow: (wf: {
    name: string;
    description: string;
    triggerType: 'manual' | 'schedule' | 'event' | 'webhook';
    targetEndpoint: string;
  }) => Promise<void>;
  onTriggerWorkflow: (wf: WorkflowRecord) => Promise<void>;
  onDeleteWorkflow: (wfId: string) => Promise<void>;
  triggeringWorkflowId: string | null;
  onCreateApprovalRequest: (req: {
    actionTitle: string;
    actionType: ApprovalActionType;
    agentId: SpecialistAgentId;
    reason: string;
    targetService: string;
    payloadData: string;
    consequences: string;
  }) => Promise<void>;
  onResolveApproval: (
    approval: ApprovalRecord,
    decision: 'approved' | 'rejected',
    note: string
  ) => Promise<void>;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  activeTab,
  language,
  tasks,
  workflows,
  approvals,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onExecuteTaskWithAI,
  executingTaskId,
  onCreateWorkflow,
  onTriggerWorkflow,
  onDeleteWorkflow,
  triggeringWorkflowId,
  onCreateApprovalRequest,
  onResolveApproval,
}) => {
  // Task Manager State
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState<SpecialistAgentId>('research');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('high');
  const [newTaskDue, setNewTaskDue] = useState('2026-11-20');
  const [newTaskSubtasks, setNewTaskSubtasks] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Workflow State
  const [showWfForm, setShowWfForm] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfTrigger, setWfTrigger] = useState<'manual' | 'schedule' | 'event' | 'webhook'>('webhook');
  const [wfEndpoint, setWfEndpoint] = useState('');

  // Approval State
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const subtaskList = newTaskSubtasks
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);
    await onCreateTask({
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || newTaskTitle.trim(),
      agentId: newTaskAgent,
      priority: newTaskPriority,
      dueDate: newTaskDue || 'Flexible',
      subtasks: subtaskList,
    });
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskSubtasks('');
    setShowTaskForm(false);
  };

  const handleWfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim() || !wfDesc.trim()) return;
    await onCreateWorkflow({
      name: wfName.trim(),
      description: wfDesc.trim(),
      triggerType: wfTrigger,
      targetEndpoint: wfEndpoint.trim(),
    });
    setWfName('');
    setWfDesc('');
    setWfEndpoint('');
    setShowWfForm(false);
  };

  if (activeTab === 'tasks') {
    const filteredTasks = tasks.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesSearch =
        !taskSearch.trim() ||
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.agentId.toLowerCase().includes(taskSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    const boardColumns: Array<{ status: TaskStatus; label: string }> = [
      { status: 'planning', label: 'Planning' },
      { status: 'waiting', label: 'Waiting' },
      { status: 'running', label: 'Running' },
      { status: 'approval_required', label: 'Approval Required' },
      { status: 'completed', label: 'Completed' },
      { status: 'failed', label: 'Failed' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'টাস্ক ম্যানেজার ও অর্কেস্ট্রেশন' : 'Task Manager & Orchestration'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Assign specialist agents, track subtask progress, and execute tasks via the AI Orchestrator.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#111827]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'board'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Board View</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {showTaskForm && (
          <form
            onSubmit={handleTaskSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Create & Assign Specialist Task
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Audit Q4 SaaS conversion funnel and prepare growth plan"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Specialist Agent
                  </label>
                  <select
                    value={newTaskAgent}
                    onChange={(e) => setNewTaskAgent(e.target.value as SpecialistAgentId)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                  >
                    {SPECIALIST_AGENTS.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Task Instructions
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Detailed instructions for the assigned agent..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Subtasks (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newTaskSubtasks}
                  onChange={(e) => setNewTaskSubtasks(e.target.value)}
                  placeholder="1. Gather baseline data&#10;2. Compare alternatives&#10;3. Compile executive summary"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks by title, description, or agent..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3.5 pl-9 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#111827] dark:text-slate-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#111827]">
            {(['all', 'planning', 'waiting', 'running', 'approval_required', 'completed', 'failed'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Task List or Board */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No tasks match the current view
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Create a new task above or use the Dashboard Quick Command bar to orchestrate a multi-agent workflow.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {filteredTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isExecuting = executingTaskId === task.id;
              return (
                <div key={task.id} className="p-5 space-y-3">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="text-left font-display text-base font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {task.title}
                      </button>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Agent: {task.agentId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">Priority: {task.priority}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">Status: {task.status.replace('_', ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Progress: {task.progress}%</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Due: {task.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onUpdateTask(task.id, {
                            status: e.target.value as TaskStatus,
                            progress: e.target.value === 'completed' ? 100 : task.progress,
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-[#0A0E17] dark:text-slate-200"
                      >
                        <option value="planning">Planning</option>
                        <option value="waiting">Waiting</option>
                        <option value="running">Running</option>
                        <option value="approval_required">Approval Required</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>

                      <button
                        type="button"
                        disabled={isExecuting}
                        onClick={() => onExecuteTaskWithAI(task)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>{isExecuting ? 'Executing...' : 'Run Agent'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{task.description}</p>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Subtasks ({task.subtasks.length})
                      </p>
                      <ul className="grid gap-1 sm:grid-cols-2 text-xs text-slate-600 dark:text-slate-300">
                        {task.subtasks.map((st, idx) => (
                          <li key={idx} className="truncate">
                            {idx + 1}. {st}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {task.resultSummary && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0A0E17]">
                      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Agent Deliverable & Execution Log
                      </p>
                      <MarkdownRenderer content={task.resultSummary} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {boardColumns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#111827] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 dark:border-slate-800">
                    <h3 className="font-display text-xs font-semibold text-slate-900 dark:text-white">
                      {col.label}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="border-b border-slate-100 pb-2.5 last:border-b-0 dark:border-slate-800/80 space-y-1.5"
                      >
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{t.agentId}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{t.priority}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {t.progress}%
                          </span>
                          <button
                            type="button"
                            onClick={() => onExecuteTaskWithAI(t)}
                            disabled={executingTaskId === t.id}
                            className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {executingTaskId === t.id ? 'Running...' : 'Execute'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'workflows') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ওয়ার্কফ্লো অটোমেশন ও n8n ইন্টিগ্রেশন' : 'Workflow Automation & n8n Pipelines'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage server-proxied n8n webhooks and event-driven automation pipelines without exposing credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWfForm(!showWfForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Workflow</span>
          </button>
        </div>

        {showWfForm && (
          <form
            onSubmit={handleWfSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Register n8n or Webhook Automation Pipeline
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  placeholder="e.g., Daily Research Digest to Slack/n8n"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Trigger Mechanism
                </label>
                <select
                  value={wfTrigger}
                  onChange={(e) => setWfTrigger(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                >
                  <option value="webhook">n8n Webhook POST</option>
                  <option value="manual">Manual Dispatch</option>
                  <option value="schedule">Scheduled Cron</option>
                  <option value="event">Task Completion Event</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Webhook Endpoint (or leave blank to use server N8N_WEBHOOK_URL)
                </label>
                <input
                  type="text"
                  value={wfEndpoint}
                  onChange={(e) => setWfEndpoint(e.target.value)}
                  placeholder="https://your-n8n-instance.app/webhook/..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Pipeline Description & Payload Contract
              </label>
              <textarea
                rows={2}
                required
                value={wfDesc}
                onChange={(e) => setWfDesc(e.target.value)}
                placeholder="Describe what this workflow automates and what payload fields it expects..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowWfForm(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                Save Workflow
              </button>
            </div>
          </form>
        )}

        {workflows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No automation workflows registered yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Register an n8n webhook or manual pipeline above to test backend-proxied workflow execution.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <WorkflowIcon className="h-4 w-4 text-blue-500" />
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      {wf.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{wf.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">Trigger: {wf.triggerType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">Status: {wf.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Total Runs: {wf.runCount}</span>
                    {wf.targetEndpoint && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono truncate max-w-[260px]">{wf.targetEndpoint}</span>
                      </>
                    )}
                  </div>
                  {wf.lastRunResult && (
                    <p className="pt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                      Last Run Output: {wf.lastRunResult}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={triggeringWorkflowId === wf.id}
                    onClick={() => onTriggerWorkflow(wf)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>{triggeringWorkflowId === wf.id ? 'Triggering...' : 'Trigger Workflow'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteWorkflow(wf.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Approval Center (Semi-Autonomous Permission System)
  const filteredApprovals = approvals.filter(
    (a) => approvalFilter === 'all' || a.status === approvalFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'bn' ? 'অনুমোদন কেন্দ্র (সেমি-অটোনোমাস গেট)' : 'Approval Center — Semi-Autonomous Gate'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consequential external actions (emails, social posts, destructive deletes, webhooks) require explicit human verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onCreateApprovalRequest({
              actionTitle: 'Send Executive Q4 Roadmap Briefing Email',
              actionType: 'send_email',
              agentId: 'communication',
              reason: 'Requested by user to notify external stakeholders of Q4 deliverables.',
              targetService: 'Gmail Outbound Relay (stakeholders@enterprise.org)',
              payloadData:
                'Subject: Q4 AI Operating System Rollout\n\nBody: Dear Stakeholders, please find attached our verified Q4 security and orchestration milestones.',
              consequences: 'Transmits live external email to recipient list; cannot be recalled after dispatch.',
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          <span>Create Sample Approval Request</span>
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit dark:border-slate-800 dark:bg-[#111827]">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setApprovalFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
              approvalFilter === f
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredApprovals.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No approval requests in this queue
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            When an AI agent proposes sending an email, publishing a social post, or triggering an external transaction, it will halt here for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((item) => {
            const isPending = item.status === 'pending';
            const isBusy = processingApprovalId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      {item.actionTitle}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Action Type: {item.actionType}</span>
                      <span aria-hidden="true">·</span>
                      <span>Agent: {item.agentId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium capitalize">
                        Status: {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Reason for Action</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{item.reason}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Target Service / Account</p>
                    <p className="mt-1 font-mono text-slate-600 dark:text-slate-300">{item.targetService}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">Potential Consequences</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{item.consequences}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    Exact Payload / Content to be Transmitted
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-200">
                    {item.payloadData}
                  </pre>
                </div>

                {isPending ? (
                  <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={resolutionNotes[item.id] || ''}
                      onChange={(e) =>
                        setResolutionNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Optional audit note for approval or rejection..."
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setProcessingApprovalId(item.id);
                          try {
                            await onResolveApproval(
                              item,
                              'rejected',
                              resolutionNotes[item.id] || 'Rejected by user in Approval Center.'
                            );
                          } finally {
                            setProcessingApprovalId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400 whitespace-nowrap shrink-0"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject Request</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setProcessingApprovalId(item.id);
                          try {
                            await onResolveApproval(
                              item,
                              'approved',
                              resolutionNotes[item.id] || 'Explicitly approved and verified by user.'
                            );
                          } finally {
                            setProcessingApprovalId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isBusy ? 'Verifying...' : 'Approve & Execute'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <strong>Audit Resolution Note:</strong> {item.resolutionNote || 'Recorded in immutable audit log.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
