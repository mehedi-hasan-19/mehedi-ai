import React, { useState, useEffect, useMemo } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Store,
  CheckSquare,
  Workflow,
  Brain,
  FolderOpen,
  Compass,
  Code2,
  Palette,
  Plug,
  ShieldCheck,
  Activity,
  Settings as SettingsIcon,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Send,
  Mic,
  Search,
  RefreshCw,
  Trash2,
  Paperclip,
  Sun,
  Moon,
  Globe,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import {
  auth,
  db,
  OperationType,
  handleFirestoreError,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  makeSafeId,
  clampText,
  safeCreateDoc,
  safeUpdateDoc,
  safeDeleteDoc,
  testFirestoreConnection,
} from './firebase';
import {
  ActivityLogRecord,
  AgentConfigRecord,
  ApprovalActionType,
  ApprovalRecord,
  ConversationRecord,
  FileRecord,
  IntegrationRecord,
  LanguageCode,
  MemoryRecord,
  MessageRecord,
  ModuleId,
  SpecialistAgentId,
  TaskPriority,
  TaskRecord,
  ThemeMode,
  UserProfileRecord,
  UserSettingsRecord,
  WorkflowRecord,
} from './types';
import { SPECIALIST_AGENTS } from './constants/agents';
import { MODULE_LABELS, UI_TEXT } from './constants/translations';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { StudiosView } from './components/StudiosView';
import { OperationsView } from './components/OperationsView';
import { KnowledgeAndSystemView } from './components/KnowledgeAndSystemView';

export default function App() {
  // Auth & Boot State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'login' | 'register'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Navigation & UI Shell State
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System Health State
  const [systemHealth, setSystemHealth] = useState({
    geminiConfigured: true,
    defaultModel: 'gemini-3.1-flash-lite',
    n8nConfigured: false,
    firestoreConnected: true,
  });

  // Firestore Real-Time Collections State
  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettingsRecord | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfigRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);

  // Dashboard Orchestrator State
  const [orchestratorInput, setOrchestratorInput] = useState('');
  const [orchestrating, setOrchestrating] = useState(false);
  const [lastOrchestrationResult, setLastOrchestrationResult] = useState<{
    planTitle: string;
    intentSummary: string;
    primaryAgentId: string;
    subtasks: Array<{ stepNumber: number; title: string; agentId: string; outputSummary: string }>;
    finalDeliverable: string;
    requiresApproval: boolean;
  } | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [triggeringWorkflowId, setTriggeringWorkflowId] = useState<string | null>(null);

  // AI Chat Workspace State
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedChatAgent, setSelectedChatAgent] = useState<SpecialistAgentId>('personal-assistant');
  const [chatInput, setChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [attachedFileId, setAttachedFileId] = useState<string>('');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [localChatMessages, setLocalChatMessages] = useState<MessageRecord[]>([]);
  const [chatSourcesMap, setChatSourcesMap] = useState<
    Record<string, Array<{ uri: string; title: string }>>
  >({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Agent Marketplace Custom Agent Form State
  const [customAgentName, setCustomAgentName] = useState('');
  const [customAgentRole, setCustomAgentRole] = useState('');
  const [customAgentDesc, setCustomAgentDesc] = useState('');
  const [customAgentPrompt, setCustomAgentPrompt] = useState('');
  const [showCustomAgentForm, setShowCustomAgentForm] = useState(false);

  const language: LanguageCode = userSettings?.language || 'en';
  const theme: ThemeMode = userSettings?.theme || 'dark';
  const t = UI_TEXT[language];

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync dark/light class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check backend & Firestore status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const [sysRes, fsOk] = await Promise.all([
          fetch('/api/system/status').then((r) => (r.ok ? r.json() : null)),
          testFirestoreConnection(),
        ]);
        if (sysRes) {
          setSystemHealth({
            geminiConfigured: Boolean(sysRes.geminiConfigured),
            defaultModel: sysRes.defaultModel || 'gemini-3.8-flash',
            n8nConfigured: Boolean(sysRes.n8nConfigured),
            firestoreConnected: fsOk,
          });
        }
      } catch {
        // Keep defaults
      }
    }
    checkStatus();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (user && user.emailVerified) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await safeCreateDoc('users', user.uid, {
              ownerId: user.uid,
              displayName: clampText(user.displayName, 100, 'MEHEDI Operator'),
              email: clampText(user.email, 254, 'operator@mehedi.ai'),
              title: 'Principal AI Systems Operator',
              bio: 'Operating MEHEDI AI semi-autonomous multi-agent platform.',
            });
          }

          const settingsRef = doc(db, 'userSettings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists()) {
            await safeCreateDoc('userSettings', user.uid, {
              ownerId: user.uid,
              language: 'en',
              theme: 'dark',
              defaultModel: 'gemini-3.8-flash',
              semiAutonomousLevel: 'strict',
              voiceEnabled: true,
            });
          }
        } catch (err) {
          console.error('Bootstrap user profile notice:', err);
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Real-Time Firestore Listeners when Authenticated
  useEffect(() => {
    if (!authReady || !currentUser) {
      setUserProfile(null);
      setUserSettings(null);
      setConversations([]);
      setMessages([]);
      setAgentConfigs([]);
      setTasks([]);
      setApprovals([]);
      setMemories([]);
      setWorkflows([]);
      setIntegrations([]);
      setFiles([]);
      setActivityLogs([]);
      return;
    }

    const uid = currentUser.uid;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...(snap.data() as Omit<UserProfileRecord, 'id'>) });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubSettings = onSnapshot(
      doc(db, 'userSettings', uid),
      (snap) => {
        if (snap.exists()) {
          setUserSettings({ id: snap.id, ...(snap.data() as Omit<UserSettingsRecord, 'id'>) });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `userSettings/${uid}`)
    );

    const makeOwnerListener = <T extends { id: string }>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const q = query(collection(db, colName), where('ownerId', '==', uid));
      return onSnapshot(
        q,
        (snap) => {
          const list: T[] = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as unknown as T)
          );
          setter(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, colName)
      );
    };

    const unsubs = [
      unsubUser,
      unsubSettings,
      makeOwnerListener<ConversationRecord>('conversations', setConversations),
      makeOwnerListener<MessageRecord>('messages', setMessages),
      makeOwnerListener<AgentConfigRecord>('agents', setAgentConfigs),
      makeOwnerListener<TaskRecord>('tasks', setTasks),
      makeOwnerListener<ApprovalRecord>('approvals', setApprovals),
      makeOwnerListener<MemoryRecord>('memories', setMemories),
      makeOwnerListener<WorkflowRecord>('workflows', setWorkflows),
      makeOwnerListener<IntegrationRecord>('integrations', setIntegrations),
      makeOwnerListener<FileRecord>('files', setFiles),
      makeOwnerListener<ActivityLogRecord>('activityLogs', setActivityLogs),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, currentUser]);

  // Select first conversation automatically if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Helper: Append Immutable Activity Log
  const logActivity = async (
    category: ActivityLogRecord['category'],
    action: string,
    agentId: string,
    status: ActivityLogRecord['status'],
    details: string
  ) => {
    if (!currentUser) return;
    const logId = makeSafeId('log');
    await safeCreateDoc(
      'activityLogs',
      logId,
      {
        ownerId: currentUser.uid,
        category,
        action: clampText(action, 200, 'System Event'),
        agentId: clampText(agentId, 64, 'system').replace(/[^a-zA-Z0-9_-]/g, '-'),
        status,
        details: clampText(details, 2000, ''),
      },
      false
    );
  };

  // Helper: Create Approval Request in Firestore
  const createApprovalRequest = async (req: {
    actionTitle: string;
    actionType: ApprovalActionType;
    agentId: SpecialistAgentId;
    reason: string;
    targetService: string;
    payloadData: string;
    consequences: string;
  }) => {
    if (!currentUser) return;
    const approvalId = makeSafeId('apr');
    await safeCreateDoc('approvals', approvalId, {
      ownerId: currentUser.uid,
      actionTitle: clampText(req.actionTitle, 200, 'External Action Approval'),
      actionType: req.actionType,
      agentId: req.agentId,
      reason: clampText(req.reason, 1000, 'Requested during agent execution.'),
      targetService: clampText(req.targetService, 200, 'External Service'),
      payloadData: clampText(req.payloadData, 8000, '{}'),
      consequences: clampText(
        req.consequences,
        1000,
        'Executes an external side effect upon approval.'
      ),
      status: 'pending',
      resolutionNote: '',
    });
    await logActivity(
      'approval',
      `Approval required: ${req.actionTitle}`,
      req.agentId,
      'warning',
      `Target: ${req.targetService}`
    );
    notify('Approval required! Review request in the Approval Center.');
  };

  // Resolve Approval (Approve or Reject with Backend Validation)
  const handleResolveApproval = async (
    approval: ApprovalRecord,
    decision: 'approved' | 'rejected',
    note: string
  ) => {
    if (!currentUser) return;
    let finalNote = note;

    if (decision === 'approved') {
      const res = await fetch('/api/approvals/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: approval.id,
          actionType: approval.actionType,
          targetService: approval.targetService,
          payloadData: approval.payloadData,
          decision: 'approved',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Approval verification failed');
        return;
      }
      finalNote = `${note} | ${data.executionNote || 'Executed on backend'}`;
    }

    await safeUpdateDoc('approvals', approval.id, {
      status: decision,
      resolutionNote: clampText(finalNote, 1000, decision),
    });

    await logActivity(
      'approval',
      `User ${decision} request: ${approval.actionTitle}`,
      approval.agentId,
      decision === 'approved' ? 'success' : 'info',
      finalNote
    );
    notify(`Request ${decision} and recorded in Activity Logs.`);
  };

  // Run Central Multi-Agent Orchestrator
  const handleOrchestrateCommand = async (e?: React.FormEvent, presetCommand?: string) => {
    if (e) e.preventDefault();
    const cmd = (presetCommand ?? orchestratorInput).trim();
    if (!cmd || !currentUser || orchestrating) return;

    setOrchestrating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch('/api/ai/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          command: cmd,
          memories: memories.slice(0, 6),
          language,
          model: userSettings?.defaultModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Orchestration request failed');

      const orch = data.orchestration;
      setLastOrchestrationResult(orch);

      if (!presetCommand) setOrchestratorInput('');
      notify('Multi-agent orchestration completed and saved to Task Manager.');

      const validAgentIds = new Set(SPECIALIST_AGENTS.map((a) => a.id));
      const primaryAgent: SpecialistAgentId = validAgentIds.has(orch.primaryAgentId)
        ? orch.primaryAgentId
        : 'research';

      const validPriorities = new Set(['low', 'medium', 'high', 'critical']);
      const priority: TaskPriority = validPriorities.has(orch.priority)
        ? orch.priority
        : 'high';

      const taskId = makeSafeId('task');
      const subtaskStrings: string[] = Array.isArray(orch.subtasks)
        ? orch.subtasks
            .slice(0, 15)
            .map((s: any) =>
              clampText(`[${s.agentId}] ${s.title}: ${s.outputSummary}`, 290, 'Subtask')
            )
        : [];

      const taskStatus = orch.requiresApproval ? 'approval_required' : 'completed';

      (async () => {
        try {
          await safeCreateDoc('tasks', taskId, {
            ownerId: currentUser.uid,
            title: clampText(orch.planTitle, 200, cmd.slice(0, 120)),
            description: clampText(orch.intentSummary, 4000, cmd),
            agentId: primaryAgent,
            priority,
            status: taskStatus,
            progress: orch.requiresApproval ? 75 : 100,
            dueDate: new Date().toISOString().slice(0, 10),
            resultSummary: clampText(orch.finalDeliverable, 14500, 'Completed.'),
            subtasks: subtaskStrings,
          });

          if (orch.requiresApproval && orch.approvalDetails) {
            const validActionTypes = new Set([
              'send_email',
              'publish_post',
              'delete_file',
              'trigger_webhook',
              'external_api',
              'account_change',
            ]);
            const actType: ApprovalActionType = validActionTypes.has(
              orch.approvalDetails.actionType
            )
              ? orch.approvalDetails.actionType
              : 'external_api';

            await createApprovalRequest({
              actionTitle: orch.approvalDetails.actionTitle || orch.planTitle,
              actionType: actType,
              agentId: primaryAgent,
              reason: orch.approvalDetails.reason || orch.intentSummary,
              targetService: orch.approvalDetails.targetService || 'External Gateway',
              payloadData: orch.approvalDetails.payloadData || orch.finalDeliverable.slice(0, 2000),
              consequences:
                orch.approvalDetails.consequences ||
                'Requires human approval before executing external side effects.',
            });
          }

          await logActivity(
            'task',
            `Orchestrated multi-agent plan: ${orch.planTitle}`,
            primaryAgent,
            'success',
            `Subtasks: ${subtaskStrings.length} | Approval Required: ${Boolean(orch.requiresApproval)}`
          );
        } catch (bgErr) {
          console.warn('Background Firestore orchestration sync notice:', bgErr);
        }
      })();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Orchestration request timed out after 35 seconds. Please try again.'
          : err instanceof Error
          ? err.message
          : 'Orchestration failed';
      notify(msg);
    } finally {
      clearTimeout(timeoutId);
      setOrchestrating(false);
    }
  };

  // Execute an existing Task in Task Manager via the Orchestrator
  const handleExecuteTaskWithAI = async (task: TaskRecord) => {
    if (!currentUser) return;
    setExecutingTaskId(task.id);
    try {
      await safeUpdateDoc('tasks', task.id, { status: 'running', progress: 45 });
      const res = await fetch('/api/ai/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `${task.title}\n\nDetails: ${task.description}`,
          memories: memories.slice(0, 6),
          language,
          model: userSettings?.defaultModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Task execution failed');

      const orch = data.orchestration;
      await safeUpdateDoc('tasks', task.id, {
        status: orch.requiresApproval ? 'approval_required' : 'completed',
        progress: orch.requiresApproval ? 80 : 100,
        resultSummary: clampText(orch.finalDeliverable, 14500, 'Completed.'),
      });

      await logActivity(
        'task',
        `Executed task with ${task.agentId}: ${task.title}`,
        task.agentId,
        'success',
        'Deliverable synthesized and stored on task record.'
      );
      notify(`Task "${task.title}" completed by ${task.agentId}.`);
    } catch (err: unknown) {
      await safeUpdateDoc('tasks', task.id, { status: 'failed' });
      notify(err instanceof Error ? err.message : 'Task execution failed');
    } finally {
      setExecutingTaskId(null);
    }
  };

  // AI Chat Message Send Handler
  const handleSendChatMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText ?? chatInput).trim();
    if (!textToSend || !currentUser || chatSending) return;

    setChatSending(true);
    setChatError(null);
    if (!overrideText) setChatInput('');

    let convId = activeConversationId;
    const isNewConv = !convId;
    if (!convId) {
      convId = makeSafeId('conv');
      setActiveConversationId(convId);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const userMsgId = makeSafeId('msg');
    const optimisticUserMsg: MessageRecord = {
      id: userMsgId,
      ownerId: currentUser.uid,
      conversationId: convId,
      role: 'user',
      agentId: selectedChatAgent,
      content: clampText(textToSend, 19000, textToSend),
      createdAt: { seconds: nowSeconds },
    };

    // Display user message immediately in the chat stream
    setLocalChatMessages((prev) => [...prev, optimisticUserMsg]);

    // Persist conversation & user message asynchronously so Firestore latency never blocks the AI response
    (async () => {
      try {
        if (isNewConv) {
          await safeCreateDoc('conversations', convId!, {
            ownerId: currentUser.uid,
            title: clampText(textToSend, 180, 'New Conversation'),
            agentId: selectedChatAgent,
            lastMessagePreview: clampText(textToSend, 450, ''),
          });
        }
        await safeCreateDoc(
          'messages',
          userMsgId,
          {
            ownerId: currentUser.uid,
            conversationId: convId!,
            role: 'user',
            agentId: selectedChatAgent,
            content: clampText(textToSend, 19000, textToSend),
          },
          false
        );
      } catch (fsErr) {
        console.warn('Background Firestore user message sync notice:', fsErr);
      }
    })();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const convHistory = activeMessages
        .filter((m) => m.conversationId === convId && m.id !== userMsgId)
        .map((m) => ({ role: m.role, content: m.content }));

      const attachedFile = files.find((f) => f.id === attachedFileId);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          agentId: selectedChatAgent,
          history: convHistory,
          memories: memories.slice(0, 8),
          fileContext: attachedFile
            ? `File: ${attachedFile.name}\n${attachedFile.textContent}`
            : '',
          language,
          model: userSettings?.defaultModel,
          useSearchGrounding,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Invalid response from AI server (HTTP ${res.status}).`);
      }

      if (!res.ok) {
        throw new Error(data.error || `AI Chat request failed with status ${res.status}.`);
      }

      const replyContent = clampText(data.reply, 19500, 'Response generated.');
      const aiMsgId = makeSafeId('msg');
      const aiMessageRecord: MessageRecord = {
        id: aiMsgId,
        ownerId: currentUser.uid,
        conversationId: convId,
        role: 'assistant',
        agentId: selectedChatAgent,
        content: replyContent,
        createdAt: { seconds: Math.floor(Date.now() / 1000) + 1 },
      };

      // Display the real Gemini response immediately in the chat
      setLocalChatMessages((prev) => [...prev, aiMessageRecord]);

      if (Array.isArray(data.sources) && data.sources.length > 0) {
        setChatSourcesMap((prev) => ({ ...prev, [aiMsgId]: data.sources }));
      }

      // Persist AI message, conversation preview, approvals, and audit log in background
      (async () => {
        try {
          await safeCreateDoc(
            'messages',
            aiMsgId,
            {
              ownerId: currentUser.uid,
              conversationId: convId!,
              role: 'assistant',
              agentId: selectedChatAgent,
              content: replyContent,
            },
            false
          );

          await safeUpdateDoc('conversations', convId!, {
            agentId: selectedChatAgent,
            lastMessagePreview: clampText(replyContent, 450, ''),
          });

          if (data.approvalProposal && data.approvalProposal.requiresApproval) {
            await createApprovalRequest({
              actionTitle: data.approvalProposal.actionTitle,
              actionType: data.approvalProposal.actionType,
              agentId: selectedChatAgent,
              reason: data.approvalProposal.reason,
              targetService: data.approvalProposal.targetService,
              payloadData: data.approvalProposal.payloadData,
              consequences: data.approvalProposal.consequences,
            });
          }

          await logActivity(
            'agent',
            `Chat response from ${selectedChatAgent}`,
            selectedChatAgent,
            'success',
            clampText(textToSend, 180, '')
          );
        } catch (bgErr) {
          console.warn('Background Firestore AI message sync notice:', bgErr);
        }
      })();
    } catch (err: unknown) {
      let errMsg = 'Chat request failed. Please try again.';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errMsg = 'The AI request timed out after 30 seconds. Please try sending your message again.';
        } else {
          errMsg = err.message;
        }
      }
      setChatError(errMsg);
      notify(errMsg);
    } finally {
      clearTimeout(timeoutId);
      setChatSending(false);
    }
  };

  // Sorted conversation messages (merging Firestore snapshot + immediate local messages)
  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    const byId = new Map<string, MessageRecord>();
    for (const m of localChatMessages) {
      if (m.conversationId === activeConversationId) {
        byId.set(m.id, m);
      }
    }
    for (const m of messages) {
      if (m.conversationId === activeConversationId) {
        byId.set(m.id, m);
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const ta = (a.createdAt as any)?.seconds || 0;
      const tb = (b.createdAt as any)?.seconds || 0;
      return ta - tb;
    });
  }, [messages, localChatMessages, activeConversationId]);

  const pendingApprovalsCount = useMemo(
    () => approvals.filter((a) => a.status === 'pending').length,
    [approvals]
  );

  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks]
  );

  // Auth Screen when Signed Out
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0A0E17]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            Initializing MEHEDI AI Operating System...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 dark:bg-[#0A0E17] dark:text-slate-100">
        {/* Top Bar Contract (3 Zones) */}
        <header className="flex items-center justify-between gap-8 border-b border-slate-200 px-6 py-4 dark:border-slate-800/80">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            MEHEDI AI
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#architecture" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Orchestrator
            </a>
            <a href="#agents" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              10 Specialist Agents
            </a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Approval Gate
            </a>
            <a href="#desktop" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Web & Desktop OS
            </a>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={async () => {
                setAuthError('');
                setAuthBusy(true);
                try {
                  await loginWithGoogle();
                } catch (err: unknown) {
                  setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed');
                } finally {
                  setAuthBusy(false);
                }
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In with Google
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Personal AI Operating System · English & বাংলা
            </p>
            <h1
              className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Coordinate 10 Specialist AI Agents with Human-in-the-Loop Security.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              MEHEDI AI unifies server-side Google Gemini intelligence, multi-agent task orchestration, persistent Firestore memory, and a strict Approval Center so consequential external actions never execute without your explicit consent.
            </p>

            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  10 Agents
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Research, Developer, Designer, Data, Automation & more
                </p>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  16 Modules
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Chat, Studios, Task Board, Memory Vault, File Q&A, Audit Logs
                </p>
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  Zero-Trust
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Hardened Firestore ABAC Rules + Backend Approval Enforcement
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Authenticate to Launch MEHEDI AI
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Sign in with your verified Google account to access your isolated Firestore workspace.
                </p>
              </div>

              {authError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                  {authError}
                </div>
              )}

              <button
                type="button"
                disabled={authBusy}
                onClick={async () => {
                  setAuthError('');
                  setAuthBusy(true);
                  try {
                    await loginWithGoogle();
                  } catch (err: unknown) {
                    setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed');
                  } finally {
                    setAuthBusy(false);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
              >
                <span>{authBusy ? 'Authenticating...' : 'Continue with Google (Recommended)'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Or Email & Password (if enabled in Firebase Console)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode(authMode === 'register' ? 'login' : 'register')
                    }
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {authMode === 'register' ? 'Switch to Sign In' : 'Create Account'}
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAuthError('');
                    setAuthBusy(true);
                    try {
                      if (authMode === 'register') {
                        await registerWithEmail(nameInput, emailInput, passwordInput);
                      } else {
                        await loginWithEmail(emailInput, passwordInput);
                      }
                    } catch (err: unknown) {
                      setAuthError(
                        err instanceof Error
                          ? `${err.message} (Tip: Google Sign-In is pre-provisioned by default; Email/Password can be toggled in Firebase Console > Authentication).`
                          : 'Authentication error'
                      );
                    } finally {
                      setAuthBusy(false);
                    }
                  }}
                  className="space-y-3"
                >
                  {authMode === 'register' && (
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Full Name"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                  )}
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                  />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={authBusy}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {authMode === 'register' ? 'Register with Email' : 'Sign In with Email'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400 flex items-center justify-between">
          <span>MEHEDI AI — Your Personal AI Operating System</span>
          <span>Web & Windows Desktop Ready</span>
        </footer>
      </div>
    );
  }

  // Sidebar Icon Resolver
  const getModuleIcon = (id: ModuleId) => {
    const props = { className: 'h-4 w-4 shrink-0' };
    switch (id) {
      case 'dashboard':
        return <LayoutDashboard {...props} />;
      case 'chat':
        return <MessageSquare {...props} />;
      case 'agents':
        return <Bot {...props} />;
      case 'marketplace':
        return <Store {...props} />;
      case 'tasks':
        return <CheckSquare {...props} />;
      case 'workflows':
        return <Workflow {...props} />;
      case 'memory':
        return <Brain {...props} />;
      case 'files':
        return <FolderOpen {...props} />;
      case 'research':
        return <Compass {...props} />;
      case 'developer':
        return <Code2 {...props} />;
      case 'design':
        return <Palette {...props} />;
      case 'integrations':
        return <Plug {...props} />;
      case 'approvals':
        return <ShieldCheck {...props} />;
      case 'logs':
        return <Activity {...props} />;
      case 'settings':
        return <SettingsIcon {...props} />;
      case 'profile':
        return <UserIcon {...props} />;
    }
  };

  const allModuleIds = Object.keys(MODULE_LABELS) as ModuleId[];
  const filteredNavModules = allModuleIds.filter((mId) => {
    if (!globalSearch.trim()) return true;
    const label = MODULE_LABELS[mId];
    return (
      label.en.toLowerCase().includes(globalSearch.toLowerCase()) ||
      label.bn.includes(globalSearch)
    );
  });

  // Main Authenticated Operating System Layout
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0A0E17] dark:text-slate-100">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="flex items-center justify-between gap-8 border-b border-slate-200 bg-white px-6 py-3.5 dark:border-slate-800 dark:bg-[#0D131F]">
        {/* Zone 1: Brand Title (Single text element, one line) */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveModule('dashboard');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          MEHEDI AI
        </a>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('dashboard');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'dashboard' ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4' : ''
            }`}
          >
            Dashboard
          </a>
          <a
            href="#chat"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('chat');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'chat' ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4' : ''
            }`}
          >
            AI Chat
          </a>
          <a
            href="#agents"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('agents');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'agents' ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4' : ''
            }`}
          >
            Agents
          </a>
          <a
            href="#tasks"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('tasks');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'tasks' ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4' : ''
            }`}
          >
            Tasks
          </a>
          <a
            href="#approvals"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('approvals');
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeModule === 'approvals' ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4' : ''
            }`}
          >
            Approvals ({pendingApprovalsCount})
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveModule('chat')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
          >
            Launch AI Brain
          </button>
        </div>
      </header>

      {/* Workspace Body: Collapsible Left Sidebar + Main Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`flex flex-col justify-between border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0D131F] transition-opacity ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } shrink-0`}
        >
          <div className="p-3 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              {!sidebarCollapsed && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  OS Modules (16)
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Filter modules..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-2.5 pl-8 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                />
              </div>
            )}

            <div className="space-y-1">
              {filteredNavModules.map((modId) => {
                const isSelected = activeModule === modId;
                const label = MODULE_LABELS[modId][language];
                return (
                  <button
                    key={modId}
                    type="button"
                    onClick={() => setActiveModule(modId)}
                    title={label}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getModuleIcon(modId)}
                      {!sidebarCollapsed && <span className="truncate">{label}</span>}
                    </div>
                    {!sidebarCollapsed && modId === 'approvals' && pendingApprovalsCount > 0 && (
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          isSelected ? 'text-white' : 'text-amber-500 font-semibold'
                        }`}
                      >
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom Operator Footer */}
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModule('profile')}
                  className="truncate text-left"
                >
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {userProfile?.displayName || currentUser.displayName || 'Operator'}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.email}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => logoutUser()}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModule('profile')}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="User Profile"
              >
                <UserIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Secondary Workspace Utility Bar (keeps <header> strictly 3 zones) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/60 px-6 py-2.5 text-xs dark:border-slate-800/80 dark:bg-[#0D131F]/60">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>MEHEDI AI OS</span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {MODULE_LABELS[activeModule][language]}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.semiAutonomous}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {toastMessage && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {toastMessage}
                </span>
              )}

              <button
                type="button"
                onClick={() => setVoiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Mic className="h-3.5 w-3.5 text-blue-500" />
                <span>{t.speakNow}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextLang: LanguageCode = language === 'en' ? 'bn' : 'en';
                  if (currentUser) {
                    safeUpdateDoc('userSettings', currentUser.uid, { language: nextLang });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
                  if (currentUser) {
                    safeUpdateDoc('userSettings', currentUser.uid, { theme: nextTheme });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Module Content Area */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-6">
            {/* MODULE 1: HOME DASHBOARD */}
            {activeModule === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {t.tagline}
                    </p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                      {language === 'bn'
                        ? `স্বাগতম, ${userProfile?.displayName || 'অপারেটর'}`
                        : `Welcome back, ${userProfile?.displayName || 'Operator'}`}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Brain: {systemHealth.defaultModel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Memories Indexed: {memories.length}</span>
                    <span aria-hidden="true">·</span>
                    <span>Files: {files.length}</span>
                  </div>
                </div>

                {/* Central Multi-Agent Command Orchestrator */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        Central AI Agent Orchestrator
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter a high-level goal. MEHEDI AI decomposes it into subtasks, assigns specialist agents, and routes external actions to the Approval Center.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={(e) => handleOrchestrateCommand(e)} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={orchestratorInput}
                      onChange={(e) => setOrchestratorInput(e.target.value)}
                      placeholder={t.quickCommandPlaceholder}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={orchestrating || !orchestratorInput.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{orchestrating ? t.runningOrchestrator : t.orchestrateBtn}</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Try Command:</span>
                    {[
                      'Research the best AI design tools, compare them, and prepare an executive report.',
                      'Analyze 5 profitable micro-SaaS niches for 2026 and create a technical & marketing launch plan.',
                      'Send an email to stakeholders summarizing our Q4 cybersecurity audit and deployment status.',
                    ].map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={orchestrating}
                        onClick={() => {
                          setOrchestratorInput(sample);
                          handleOrchestrateCommand(undefined, sample);
                        }}
                        className="text-left text-blue-600 hover:underline dark:text-blue-400"
                      >
                        "{sample.slice(0, 62)}..."
                      </button>
                    ))}
                  </div>

                  {lastOrchestrationResult && (
                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                            Orchestrated Plan: {lastOrchestrationResult.planTitle}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lastOrchestrationResult.intentSummary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModule('tasks')}
                          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          View in Task Manager →
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {lastOrchestrationResult.subtasks.map((st) => (
                          <div
                            key={st.stepNumber}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0A0E17]"
                          >
                            <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                              0{st.stepNumber}. {st.agentId}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                              {st.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                              {st.outputSummary}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0A0E17]">
                        <MarkdownRenderer content={lastOrchestrationResult.finalDeliverable} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Real Firestore Analytics Strip (4 Columns, Tabular Numerals) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setActiveModule('tasks')}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-500/50 dark:border-slate-800 dark:bg-[#111827] transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.totalTasks}
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {tasks.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Stored in Firestore /tasks
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('tasks')}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-500/50 dark:border-slate-800 dark:bg-[#111827] transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.completedTasks}
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {completedTasksCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Verified deliverables
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('agents')}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-500/50 dark:border-slate-800 dark:bg-[#111827] transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.activeAgents}
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {SPECIALIST_AGENTS.length + agentConfigs.filter((a) => a.enabled).length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      10 Core + {agentConfigs.length} Custom
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModule('approvals')}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-500/50 dark:border-slate-800 dark:bg-[#111827] transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.pendingApprovals}
                    </p>
                    <p
                      className={`mt-2 font-mono text-3xl font-bold tabular-nums ${
                        pendingApprovalsCount > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {pendingApprovalsCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Human-in-the-loop gate
                    </p>
                  </button>
                </div>

                {/* Recent Conversations & Recent Activity Audit */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                      <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        {t.recentConversations}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveModule('chat')}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Open AI Chat →
                      </button>
                    </div>
                    {conversations.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No conversations started yet. Open AI Chat to speak with any specialist agent.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveModule('chat')}
                          className="mt-3 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                        >
                          Start First Conversation
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {conversations.slice(0, 5).map((c) => (
                          <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveConversationId(c.id);
                                  setActiveModule('chat');
                                }}
                                className="truncate font-display text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                              >
                                {c.title}
                              </button>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {c.agentId} · {c.lastMessagePreview}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                      <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                        {t.recentActivities}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveModule('logs')}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Full Audit Log →
                      </button>
                    </div>
                    {activityLogs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        No audit events recorded yet. Run a command or chat with an agent to populate real-time telemetry.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {activityLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-white">
                                {log.action}
                              </p>
                              <p className="truncate text-slate-500 dark:text-slate-400">
                                {log.category} · {log.agentId} · {log.details}
                              </p>
                            </div>
                            <span className="font-mono capitalize text-slate-500 dark:text-slate-400 shrink-0">
                              {log.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 2: AI CHAT WORKSPACE */}
            {activeModule === 'chat' && (
              <div className="grid h-[calc(100vh-11rem)] min-h-[560px] gap-6 lg:grid-cols-12">
                {/* Conversation History Sidebar */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827] lg:col-span-4">
                  <div className="space-y-3 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                        Conversations ({conversations.length})
                      </h2>
                      <button
                        type="button"
                        onClick={async () => {
                          const newId = makeSafeId('conv');
                          await safeCreateDoc('conversations', newId, {
                            ownerId: currentUser.uid,
                            title: 'New Agent Session',
                            agentId: selectedChatAgent,
                            lastMessagePreview: 'Session initialized',
                          });
                          setActiveConversationId(newId);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t.newConversation}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-2.5 pl-8 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      {conversations
                        .filter(
                          (c) =>
                            !chatSearchQuery.trim() ||
                            c.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
                        )
                        .map((conv) => (
                          <div
                            key={conv.id}
                            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                              activeConversationId === conv.id
                                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveConversationId(conv.id)}
                              className="flex-1 truncate text-left"
                            >
                              <p className="truncate">{conv.title}</p>
                              <p className="truncate text-[11px] text-slate-400">
                                {conv.agentId}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                safeDeleteDoc('conversations', conv.id);
                                if (activeConversationId === conv.id) {
                                  setActiveConversationId(null);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500"
                              title="Delete Conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Specialist Agent & Context Selector */}
                  <div className="space-y-2.5 border-t border-slate-200 pt-3 dark:border-slate-800 text-xs">
                    <div>
                      <label className="mb-1 block font-medium text-slate-600 dark:text-slate-400">
                        Active Specialist Agent
                      </label>
                      <select
                        value={selectedChatAgent}
                        onChange={(e) => setSelectedChatAgent(e.target.value as SpecialistAgentId)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      >
                        {SPECIALIST_AGENTS.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {language === 'bn' ? ag.nameBn : ag.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-slate-600 dark:text-slate-400">
                        Attach Uploaded File Context
                      </label>
                      <select
                        value={attachedFileId}
                        onChange={(e) => setAttachedFileId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      >
                        <option value="">No file attached</option>
                        {files.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.folder})
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSearchGrounding}
                        onChange={(e) => setUseSearchGrounding(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span>Enable Google Search Live Grounding</span>
                    </label>
                  </div>
                </div>

                {/* Chat Message Stream & Command Input */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827] lg:col-span-8 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {activeMessages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-3">
                        <Bot className="h-8 w-8 text-blue-500" />
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {SPECIALIST_AGENTS.find((a) => a.id === selectedChatAgent)?.name} Ready
                        </h3>
                        <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                          {SPECIALIST_AGENTS.find((a) => a.id === selectedChatAgent)?.description}
                        </p>
                      </div>
                    ) : (
                      activeMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-xl border p-4 ${
                            msg.role === 'user'
                              ? 'ml-auto max-w-2xl border-blue-500/30 bg-blue-600/5 dark:bg-blue-500/10'
                              : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-[#0A0E17]'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium capitalize">
                              {msg.role === 'user' ? 'You' : `MEHEDI AI · ${msg.agentId}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  setCopiedMsgId(msg.id);
                                  setTimeout(() => setCopiedMsgId(null), 1500);
                                }}
                                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                              >
                                {copiedMsgId === msg.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                <span>Copy</span>
                              </button>
                              {msg.role === 'user' && (
                                <button
                                  type="button"
                                  onClick={() => handleSendChatMessage(undefined, msg.content)}
                                  className="inline-flex items-center gap-1 hover:text-blue-500"
                                  title="Regenerate response"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>Re-run</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <MarkdownRenderer
                            content={msg.content}
                            sources={chatSourcesMap[msg.id]}
                          />
                        </div>
                      ))
                    )}

                    {chatSending && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-300">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent shrink-0" />
                        <span>MEHEDI AI ({selectedChatAgent}) is generating a response...</span>
                      </div>
                    )}

                    {chatError && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
                        <span>{chatError}</span>
                        <button
                          type="button"
                          onClick={() => setChatError(null)}
                          className="font-medium underline hover:no-underline shrink-0"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => handleSendChatMessage(e)}
                    className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-2"
                  >
                    {attachedFileId && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>
                          Grounded with file: {files.find((f) => f.id === attachedFileId)?.name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          language === 'bn'
                            ? 'আপনার নির্দেশ বা প্রশ্ন লিখুন...'
                            : `Message ${selectedChatAgent} agent (or issue an approval-gated command)...`
                        }
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setVoiceModalOpen(true)}
                        className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Voice Input"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={chatSending || !chatInput.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{chatSending ? 'Thinking...' : t.sendMessage}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODULE 3: AI AGENTS REGISTRY */}
            {activeModule === 'agents' && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? 'স্পেশালিস্ট এআই এজেন্ট সিস্টেম (১০)' : 'Specialist AI Agents Registry (10)'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Each agent has dedicated system instructions, tool permissions, execution telemetry, and semi-autonomous gates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule('marketplace')}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Open Agent Marketplace →
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {SPECIALIST_AGENTS.map((ag) => {
                    const agentTasks = tasks.filter((t) => t.agentId === ag.id);
                    const completedForAgent = agentTasks.filter(
                      (t) => t.status === 'completed'
                    ).length;

                    return (
                      <div
                        key={ag.id}
                        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                                {language === 'bn' ? ag.nameBn : ag.name}
                              </h3>
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {language === 'bn' ? ag.roleBn : ag.role}
                              </p>
                            </div>
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              {completedForAgent}/{agentTasks.length} tasks done
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {language === 'bn' ? ag.descriptionBn : ag.description}
                          </p>

                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                            <p>
                              <strong className="text-slate-800 dark:text-slate-200">
                                Capabilities:
                              </strong>{' '}
                              {ag.capabilities.join(' · ')}
                            </p>
                            <p>
                              <strong className="text-slate-800 dark:text-slate-200">
                                Tool Permissions:
                              </strong>{' '}
                              {ag.toolPermissions.join(' · ')}
                            </p>
                            <p>
                              <strong className="text-slate-800 dark:text-slate-200">
                                External Action Policy:
                              </strong>{' '}
                              {ag.requiresApprovalForExternal
                                ? 'Requires Approval Center Gate'
                                : 'Autonomous Internal Execution'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatAgent(ag.id);
                              setActiveModule('chat');
                            }}
                            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
                          >
                            Chat with Agent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODULE 4: AGENT MARKETPLACE */}
            {activeModule === 'marketplace' && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? 'এজেন্ট মার্কেটপ্লেস ও কাস্টম এজেন্ট বিল্ডার' : 'Agent Marketplace & Custom Blueprints'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Deploy specialized domain agent blueprints or build your own custom agent stored in Firestore (<code className="font-mono">/agents</code>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomAgentForm(!showCustomAgentForm)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Custom Agent</span>
                  </button>
                </div>

                {showCustomAgentForm && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!customAgentName.trim() || !customAgentPrompt.trim()) return;
                      const id = makeSafeId('agent');
                      await safeCreateDoc('agents', id, {
                        ownerId: currentUser.uid,
                        agentKey: customAgentName
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, '-')
                          .slice(0, 50),
                        name: clampText(customAgentName, 100, 'Custom Agent'),
                        role: clampText(customAgentRole, 120, 'Domain Specialist'),
                        description: clampText(customAgentDesc, 600, customAgentPrompt.slice(0, 200)),
                        systemInstruction: clampText(customAgentPrompt, 4000, ''),
                        enabled: true,
                        tasksCompleted: 0,
                      });
                      setCustomAgentName('');
                      setCustomAgentRole('');
                      setCustomAgentDesc('');
                      setCustomAgentPrompt('');
                      setShowCustomAgentForm(false);
                      notify('Custom agent deployed to your Firestore registry.');
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] space-y-4"
                  >
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      Build Custom Specialist Agent
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        value={customAgentName}
                        onChange={(e) => setCustomAgentName(e.target.value)}
                        placeholder="Agent Name (e.g., Cybersecurity Auditor Agent)"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      />
                      <input
                        type="text"
                        required
                        value={customAgentRole}
                        onChange={(e) => setCustomAgentRole(e.target.value)}
                        placeholder="Role Title (e.g., Zero-Trust Cloud Security Lead)"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={customAgentDesc}
                      onChange={(e) => setCustomAgentDesc(e.target.value)}
                      placeholder="Short description of responsibilities..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                    <textarea
                      rows={3}
                      required
                      value={customAgentPrompt}
                      onChange={(e) => setCustomAgentPrompt(e.target.value)}
                      placeholder="System instructions and behavioral rules..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-[#0A0E17] dark:text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomAgentForm(false)}
                        className="rounded-lg px-4 py-2 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500"
                      >
                        Save & Enable Agent
                      </button>
                    </div>
                  </form>
                )}

                {/* Preset Marketplace Templates */}
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      key: 'cybersec-auditor',
                      name: 'Zero-Trust Security Auditor',
                      role: 'OWASP & Firestore Rules Inspector',
                      desc: 'Audits API endpoints, IAM scopes, and Firestore rules for privilege escalation.',
                      prompt: 'You are a Zero-Trust Cybersecurity Auditor. Inspect code and architectures for OWASP Top 10 vulnerabilities.',
                    },
                    {
                      key: 'bengali-translator',
                      name: 'Bengali Executive Translator',
                      role: 'Bilingual Localization Specialist',
                      desc: 'Translates technical, legal, and business documentation between English and standard Bengali.',
                      prompt: 'You are an expert English-Bengali localization specialist.',
                    },
                    {
                      key: 'finops-analyst',
                      name: 'Cloud FinOps & Unit Economics Agent',
                      role: 'SaaS Margin & Infrastructure Optimizer',
                      desc: 'Models cloud compute costs, token budgets, and SaaS LTV/CAC ratios.',
                      prompt: 'You analyze cloud infrastructure and AI token unit economics with precision.',
                    },
                  ].map((tpl) => {
                    const installed = agentConfigs.find((a) => a.agentKey === tpl.key);
                    return (
                      <div
                        key={tpl.key}
                        className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-1.5">
                          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                            {tpl.name}
                          </h3>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {tpl.role}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{tpl.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={Boolean(installed)}
                          onClick={async () => {
                            const id = makeSafeId('agent');
                            await safeCreateDoc('agents', id, {
                              ownerId: currentUser.uid,
                              agentKey: tpl.key,
                              name: tpl.name,
                              role: tpl.role,
                              description: tpl.desc,
                              systemInstruction: tpl.prompt,
                              enabled: true,
                              tasksCompleted: 0,
                            });
                            notify(`Installed ${tpl.name} to your workspace.`);
                          }}
                          className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {installed ? 'Installed in Workspace' : 'Install Agent Blueprint'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {agentConfigs.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      Your Installed Custom Agents ({agentConfigs.length})
                    </h2>
                    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
                      {agentConfigs.map((cfg) => (
                        <div
                          key={cfg.id}
                          className="flex items-center justify-between gap-4 p-4 text-xs"
                        >
                          <div>
                            <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                              {cfg.name}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                              {cfg.role} · {cfg.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                safeUpdateDoc('agents', cfg.id, { enabled: !cfg.enabled })
                              }
                              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium dark:border-slate-700"
                            >
                              {cfg.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => safeDeleteDoc('agents', cfg.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULES 5, 6, 13: TASK MANAGER, WORKFLOW AUTOMATION, APPROVAL CENTER */}
            {(activeModule === 'tasks' ||
              activeModule === 'workflows' ||
              activeModule === 'approvals') && (
              <OperationsView
                activeTab={activeModule}
                language={language}
                tasks={tasks}
                workflows={workflows}
                approvals={approvals}
                onCreateTask={async (tData) => {
                  const id = makeSafeId('task');
                  await safeCreateDoc('tasks', id, {
                    ownerId: currentUser.uid,
                    title: clampText(tData.title, 200, 'Task'),
                    description: clampText(tData.description, 4000, ''),
                    agentId: tData.agentId,
                    priority: tData.priority,
                    status: 'planning',
                    progress: 10,
                    dueDate: clampText(tData.dueDate, 40, 'Flexible'),
                    resultSummary: '',
                    subtasks: tData.subtasks,
                  });
                  await logActivity(
                    'task',
                    `Created task: ${tData.title}`,
                    tData.agentId,
                    'info',
                    `Priority: ${tData.priority}`
                  );
                  notify('Task created in Firestore.');
                }}
                onUpdateTask={async (taskId, updates) => {
                  await safeUpdateDoc('tasks', taskId, updates);
                }}
                onDeleteTask={async (taskId) => {
                  await safeDeleteDoc('tasks', taskId);
                  notify('Task deleted.');
                }}
                onExecuteTaskWithAI={handleExecuteTaskWithAI}
                executingTaskId={executingTaskId}
                onCreateWorkflow={async (wfData) => {
                  const id = makeSafeId('wf');
                  await safeCreateDoc('workflows', id, {
                    ownerId: currentUser.uid,
                    name: clampText(wfData.name, 150, 'Workflow'),
                    description: clampText(wfData.description, 1000, ''),
                    triggerType: wfData.triggerType,
                    targetEndpoint: clampText(wfData.targetEndpoint, 500, ''),
                    status: wfData.targetEndpoint || systemHealth.n8nConfigured ? 'configured' : 'draft',
                    lastRunResult: 'Never triggered',
                    runCount: 0,
                  });
                  await logActivity(
                    'workflow',
                    `Registered workflow: ${wfData.name}`,
                    'automation',
                    'info',
                    `Trigger: ${wfData.triggerType}`
                  );
                  notify('Workflow saved.');
                }}
                onTriggerWorkflow={async (wf) => {
                  setTriggeringWorkflowId(wf.id);
                  try {
                    const res = await fetch('/api/workflows/trigger', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        workflowName: wf.name,
                        targetEndpoint: wf.targetEndpoint,
                        payload: { workflowId: wf.id, description: wf.description },
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      await safeUpdateDoc('workflows', wf.id, {
                        status: 'error',
                        lastRunResult: clampText(data.error || 'Webhook error', 1800, ''),
                      });
                      notify(data.error || 'Workflow trigger failed');
                    } else {
                      await safeUpdateDoc('workflows', wf.id, {
                        status: 'configured',
                        runCount: (wf.runCount || 0) + 1,
                        lastRunResult: clampText(data.resultPreview, 1800, 'Success'),
                      });
                      notify(`Workflow "${wf.name}" executed.`);
                    }
                  } finally {
                    setTriggeringWorkflowId(null);
                  }
                }}
                onDeleteWorkflow={async (wfId) => {
                  await safeDeleteDoc('workflows', wfId);
                }}
                triggeringWorkflowId={triggeringWorkflowId}
                onCreateApprovalRequest={createApprovalRequest}
                onResolveApproval={handleResolveApproval}
              />
            )}

            {/* MODULES 9, 10, 11: RESEARCH, DEVELOPER, AND DESIGN WORKSPACES */}
            {(activeModule === 'research' ||
              activeModule === 'developer' ||
              activeModule === 'design') && (
              <StudiosView
                activeStudio={activeModule}
                language={language}
                onSaveToMemory={async (title, category, content, tags) => {
                  const id = makeSafeId('mem');
                  await safeCreateDoc('memories', id, {
                    ownerId: currentUser.uid,
                    title: clampText(title, 200, 'Studio Memory'),
                    category,
                    content: clampText(content, 7800, ''),
                    tags: tags.slice(0, 10),
                  });
                }}
                onCreateTaskFromStudio={async (title, description, agentId) => {
                  const id = makeSafeId('task');
                  await safeCreateDoc('tasks', id, {
                    ownerId: currentUser.uid,
                    title: clampText(title, 200, 'Studio Follow-up'),
                    description: clampText(description, 3900, ''),
                    agentId,
                    priority: 'high',
                    status: 'planning',
                    progress: 20,
                    dueDate: new Date().toISOString().slice(0, 10),
                    resultSummary: '',
                    subtasks: ['Review studio deliverable', 'Validate next actions'],
                  });
                }}
                onLogActivity={logActivity}
              />
            )}

            {/* MODULES 7, 8, 12, 14, 15, 16: MEMORY, FILES, INTEGRATIONS, LOGS, SETTINGS, PROFILE */}
            {(activeModule === 'memory' ||
              activeModule === 'files' ||
              activeModule === 'integrations' ||
              activeModule === 'logs' ||
              activeModule === 'settings' ||
              activeModule === 'profile') && (
              <KnowledgeAndSystemView
                activeSection={activeModule}
                language={language}
                theme={theme}
                memories={memories}
                files={files}
                integrations={integrations}
                logs={activityLogs}
                userProfile={userProfile}
                userSettings={userSettings}
                systemHealth={systemHealth}
                onSaveMemory={async (title, category, content, tags, existingId) => {
                  if (existingId) {
                    await safeUpdateDoc('memories', existingId, {
                      title: clampText(title, 200, 'Memory'),
                      category,
                      content: clampText(content, 7800, ''),
                      tags: tags.slice(0, 10),
                    });
                    notify('Memory updated.');
                  } else {
                    const id = makeSafeId('mem');
                    await safeCreateDoc('memories', id, {
                      ownerId: currentUser.uid,
                      title: clampText(title, 200, 'Memory'),
                      category,
                      content: clampText(content, 7800, ''),
                      tags: tags.slice(0, 10),
                    });
                    await logActivity(
                      'memory',
                      `Saved memory: ${title}`,
                      'personal-assistant',
                      'info',
                      `Category: ${category}`
                    );
                    notify('Saved to AI Memory Vault.');
                  }
                }}
                onDeleteMemory={async (id) => {
                  await safeDeleteDoc('memories', id);
                  notify('Memory deleted.');
                }}
                onUploadFileRecord={async (fileData) => {
                  const id = makeSafeId('file');
                  await safeCreateDoc('files', id, {
                    ownerId: currentUser.uid,
                    name: clampText(fileData.name, 200, 'Document'),
                    folder: clampText(fileData.folder, 100, 'Workspace Docs'),
                    mimeType: clampText(fileData.mimeType, 100, 'text/plain'),
                    sizeBytes: fileData.sizeBytes,
                    textContent: clampText(fileData.textContent, 24500, ''),
                    aiSummary: '',
                  });
                  await logActivity(
                    'file',
                    `Uploaded file: ${fileData.name}`,
                    'document',
                    'info',
                    `Size: ${fileData.sizeBytes} bytes`
                  );
                  notify(`Uploaded "${fileData.name}" to ${fileData.folder}.`);
                }}
                onUpdateFileRecord={async (fileId, updates) => {
                  await safeUpdateDoc('files', fileId, updates);
                }}
                onDeleteFileRecord={async (fileId) => {
                  await safeDeleteDoc('files', fileId);
                  notify('File removed from workspace.');
                }}
                onTestIntegration={async (providerKey, name, endpointHint) => {
                  const res = await fetch('/api/system/status');
                  const statusData = res.ok ? await res.json() : null;
                  const isConn =
                    providerKey === 'google-gemini' || providerKey === 'google-search'
                      ? Boolean(statusData?.geminiConfigured)
                      : providerKey === 'firebase-cloud'
                      ? await testFirestoreConnection()
                      : providerKey === 'n8n-automation'
                      ? Boolean(statusData?.n8nConfigured)
                      : false;

                  const existing = integrations.find((i) => i.providerKey === providerKey);
                  if (existing) {
                    await safeUpdateDoc('integrations', existing.id, {
                      status: isConn ? 'connected' : 'disconnected',
                      endpointHint: clampText(endpointHint, 300, ''),
                    });
                  } else {
                    const id = makeSafeId('int');
                    await safeCreateDoc('integrations', id, {
                      ownerId: currentUser.uid,
                      providerKey,
                      name: clampText(name, 100, providerKey),
                      status: isConn ? 'connected' : 'disconnected',
                      endpointHint: clampText(endpointHint, 300, ''),
                      scopesSummary: 'Verified via live diagnostic check',
                    });
                  }
                  notify(
                    isConn
                      ? `${name}: Live connection verified.`
                      : `${name}: Credentials or webhook endpoint not yet configured.`
                  );
                }}
                onUpdateSettings={async (updates) => {
                  await safeUpdateDoc('userSettings', currentUser.uid, updates);
                  notify('OS settings updated.');
                }}
                onUpdateProfile={async (updates) => {
                  await safeUpdateDoc('users', currentUser.uid, updates);
                  notify('User profile updated.');
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        language={language}
        onSubmitTranscript={(transcript) => {
          setActiveModule('chat');
          handleSendChatMessage(undefined, transcript);
        }}
      />
    </div>
  );
}
