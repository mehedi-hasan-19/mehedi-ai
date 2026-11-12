/**
 * MEHEDI AI — Firestore Security Rules Adversarial Test Suite
 * Verifies that all 12 Dirty Dozen payloads defined in security_spec.md
 * are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const dirtyDozenTestSuite: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Task Create',
    collection: 'tasks',
    docId: 'task_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: { ownerId: 'user_B', title: 'Spoofed Task' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    collection: 'users',
    docId: 'user_A',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: false,
    payload: { ownerId: 'user_A', displayName: 'Spoofer', email: 'mehediromi3@gmail.com' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Memory Update',
    collection: 'memories',
    docId: 'mem_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: { title: 'Updated', isAdmin: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Cross-Tenant Read',
    collection: 'users',
    docId: 'user_A',
    operation: 'get',
    authUid: 'user_B',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unscoped List Query on Tasks',
    collection: 'tasks',
    docId: '*',
    operation: 'list',
    authUid: 'user_B',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Terminal State Reversal on Approval',
    collection: 'approvals',
    docId: 'app_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: { status: 'pending', resolutionNote: 'Reopened after approval' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned Message Write',
    collection: 'messages',
    docId: 'msg_1',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: { ownerId: 'user_A', conversationId: 'non_existent_conv', role: 'user', agentId: 'research', content: 'Hello' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet Oversized String',
    collection: 'tasks',
    docId: 'task_2',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: { ownerId: 'user_A', title: 'A'.repeat(50000) },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'ID Poisoning with Special Characters',
    collection: 'memories',
    docId: 'invalid$id!@#',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: { ownerId: 'user_A', title: 'Valid Title' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable Timestamp Tampering',
    collection: 'tasks',
    docId: 'task_1',
    operation: 'update',
    authUid: 'user_A',
    emailVerified: true,
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Audit Log Tampering (Delete)',
    collection: 'activityLogs',
    docId: 'log_1',
    operation: 'delete',
    authUid: 'user_A',
    emailVerified: true,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Array Size & Element Type Poisoning',
    collection: 'memories',
    docId: 'mem_2',
    operation: 'create',
    authUid: 'user_A',
    emailVerified: true,
    payload: { ownerId: 'user_A', tags: [12345] },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
