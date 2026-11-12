export type LanguageCode = 'en' | 'bn';
export type ThemeMode = 'dark' | 'light';

export type ModuleId =
  | 'dashboard'
  | 'chat'
  | 'agents'
  | 'marketplace'
  | 'tasks'
  | 'workflows'
  | 'memory'
  | 'files'
  | 'research'
  | 'developer'
  | 'design'
  | 'integrations'
  | 'approvals'
  | 'logs'
  | 'settings'
  | 'profile';

export type SpecialistAgentId =
  | 'personal-assistant'
  | 'research'
  | 'developer'
  | 'designer'
  | 'marketing'
  | 'business'
  | 'communication'
  | 'document'
  | 'data-analyst'
  | 'automation';

export interface SpecialistAgentDefinition {
  id: SpecialistAgentId;
  name: string;
  nameBn: string;
  role: string;
  roleBn: string;
  description: string;
  descriptionBn: string;
  capabilities: string[];
  toolPermissions: string[];
  systemInstruction: string;
  requiresApprovalForExternal: boolean;
}

export interface UserProfileRecord {
  id: string;
  ownerId: string;
  displayName: string;
  email: string;
  title: string;
  bio: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserSettingsRecord {
  id: string;
  ownerId: string;
  language: LanguageCode;
  theme: ThemeMode;
  defaultModel: string;
  semiAutonomousLevel: 'strict' | 'balanced' | 'proactive';
  voiceEnabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ConversationRecord {
  id: string;
  ownerId: string;
  title: string;
  agentId: SpecialistAgentId;
  lastMessagePreview: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MessageRecord {
  id: string;
  ownerId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  agentId: SpecialistAgentId;
  content: string;
  createdAt?: unknown;
}

export interface AgentConfigRecord {
  id: string;
  ownerId: string;
  agentKey: string;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  enabled: boolean;
  tasksCompleted: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type TaskStatus =
  | 'planning'
  | 'waiting'
  | 'running'
  | 'completed'
  | 'failed'
  | 'approval_required';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  agentId: SpecialistAgentId;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  dueDate: string;
  resultSummary: string;
  subtasks: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ApprovalActionType =
  | 'send_email'
  | 'publish_post'
  | 'delete_file'
  | 'trigger_webhook'
  | 'external_api'
  | 'account_change';

export interface ApprovalRecord {
  id: string;
  ownerId: string;
  actionTitle: string;
  actionType: ApprovalActionType;
  agentId: SpecialistAgentId;
  reason: string;
  targetService: string;
  payloadData: string;
  consequences: string;
  status: 'pending' | 'approved' | 'rejected';
  resolutionNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MemoryRecord {
  id: string;
  ownerId: string;
  title: string;
  category: 'preference' | 'project' | 'conversation' | 'note' | 'knowledge';
  content: string;
  tags: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkflowRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  triggerType: 'manual' | 'schedule' | 'event' | 'webhook';
  targetEndpoint: string;
  status: 'configured' | 'draft' | 'error';
  lastRunResult: string;
  runCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface IntegrationRecord {
  id: string;
  ownerId: string;
  providerKey: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  endpointHint: string;
  scopesSummary: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FileRecord {
  id: string;
  ownerId: string;
  name: string;
  folder: string;
  mimeType: string;
  sizeBytes: number;
  textContent: string;
  aiSummary: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLogRecord {
  id: string;
  ownerId: string;
  category: 'agent' | 'task' | 'approval' | 'workflow' | 'security' | 'memory' | 'file';
  action: string;
  agentId: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
  createdAt?: unknown;
}
