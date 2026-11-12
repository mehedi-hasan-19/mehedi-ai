# MEHEDI AI — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict Tenant & PII Isolation**: Every document across all 12 collections (`users`, `userSettings`, `conversations`, `messages`, `agents`, `tasks`, `approvals`, `memories`, `workflows`, `integrations`, `files`, `activityLogs`) MUST contain an immutable `ownerId` matching `request.auth.uid`. No user may read, list, create, update, or delete another user's documents.
2. **Verified Identity Requirement**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Every document ID path variable (`{userId}`, `{conversationId}`, `{messageId}`, `{agentId}`, `{taskId}`, `{approvalId}`, `{memoryId}`, `{workflowId}`, `{integrationId}`, `{fileId}`, `{logId}`) on single-document operations (`get`, `create`, `update`, `delete`) must satisfy `isValidId(id)` (`id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Relational Integrity**: Creating a `messages/{messageId}` record requires that the referenced parent `/conversations/$(incoming().conversationId)` exists and is owned by `request.auth.uid`.
5. **Terminal State Locking**: An `approvals/{approvalId}` document with `status == 'approved'` or `status == 'rejected'` is in a terminal state and CANNOT be updated further.
6. **Audit Log Immutability**: `activityLogs/{logId}` documents are append-only (`allow update, delete: if false;`).
7. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time` on creation, `createdAt` is immutable on update, and `updatedAt` must equal `request.time` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing on Task Create)**: Authenticated `user_A` attempts to create `/tasks/task_1` with `ownerId: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: User with `email_verified: false` attempts to create `/users/user_A`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Memory Update)**: `user_A` updates `/memories/mem_1` with `{ title: "Updated", isAdmin: true }`. -> `PERMISSION_DENIED`
4. **Payload 4 (PII Cross-Tenant Read)**: `user_B` attempts `get(/users/user_A)` to harvest email/profile data. -> `PERMISSION_DENIED`
5. **Payload 5 (Unscoped List Query)**: `user_A` executes an unfiltered `list` query on `/tasks` without `where('ownerId', '==', 'user_A')`. -> `PERMISSION_DENIED`
6. **Payload 6 (Terminal State Reversal on Approval)**: `user_A` attempts to update `/approvals/app_1` from `status: "approved"` back to `status: "pending"`. -> `PERMISSION_DENIED`
7. **Payload 7 (Orphaned Message Write)**: `user_A` attempts to create `/messages/msg_1` referencing a non-existent `conversationId: "non_existent_conv"`. -> `PERMISSION_DENIED`
8. **Payload 8 (Denial-of-Wallet Oversized String)**: `user_A` attempts to create `/tasks/task_2` with a 50,000-character `title`. -> `PERMISSION_DENIED`
9. **Payload 9 (ID Poisoning)**: `user_A` attempts to create `/memories/invalid$id!@#` containing illegal characters. -> `PERMISSION_DENIED`
10. **Payload 10 (Immutable Timestamp Tampering)**: `user_A` updates `/tasks/task_1` while modifying `createdAt` to a past timestamp. -> `PERMISSION_DENIED`
11. **Payload 11 (Audit Log Tampering)**: `user_A` attempts to update or delete `/activityLogs/log_1` to erase an approval execution trace. -> `PERMISSION_DENIED`
12. **Payload 12 (Array Type/Size Poisoning)**: `user_A` attempts to create `/memories/mem_2` with 25 tags (exceeding `maxLength: 10`) or non-string first element `[12345]`. -> `PERMISSION_DENIED`
