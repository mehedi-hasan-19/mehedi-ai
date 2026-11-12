import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Permission denied on /test/connection still proves online reachability to Firestore
    return true;
  }
}

testFirestoreConnection();

// Defensive Payload Helpers (Synchronized with firebase-blueprint.json & firestore.rules)
export function makeSafeId(prefix = 'id'): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

export function clampText(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const clean = (val ?? fallback).trim();
  if (!clean && fallback) return fallback.slice(0, maxLen);
  return clean.slice(0, maxLen);
}

// Auth wrappers
export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(name: string, email: string, pass: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user && name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
  }
  return cred;
}

export async function logoutUser() {
  return firebaseSignOut(auth);
}

// Safe Firestore Document Mutations with Mandatory Error Handling
export async function safeCreateDoc(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>,
  includeUpdatedAt = true
) {
  const path = `${collectionName}/${docId}`;
  try {
    const timestamps = includeUpdatedAt
      ? { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      : { createdAt: serverTimestamp() };
    await setDoc(doc(db, collectionName, docId), {
      ...payload,
      ...timestamps,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function safeUpdateDoc(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>
) {
  const path = `${collectionName}/${docId}`;
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function safeDeleteDoc(collectionName: string, docId: string) {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
