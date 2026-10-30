import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from './auth';
import { JaapEntry, MalaTrack } from '../types/jaap';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on initial boot as required by system skill
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline, using local mode.');
    }
    // Return false without throwing so app remains resilient offline
    return false;
  }
}

/**
 * Real-time listener for user's concurrent Malas
 */
export function subscribeToUserMalas(
  userId: string,
  onUpdate: (malas: MalaTrack[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/malas`;
  const malasColl = collection(db, 'users', userId, 'malas');

  return onSnapshot(
    malasColl,
    (snapshot) => {
      const malas: MalaTrack[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MalaTrack;
        malas.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort by order or creation
      malas.sort((a, b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt);
      onUpdate(malas);
    },
    (error) => {
      console.warn('Real-time malas listener error:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Handled
      }
    }
  );
}

/**
 * Real-time listener for user's chant entries
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JaapEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/entries`;
  const entriesColl = collection(db, 'users', userId, 'entries');

  return onSnapshot(
    entriesColl,
    (snapshot) => {
      const entries: JaapEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JaapEntry;
        if (!data.deleted) {
          entries.push({
            ...data,
            id: docSnap.id,
          });
        }
      });
      entries.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(entries);
    },
    (error) => {
      console.warn('Real-time entries listener error:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Handled
      }
    }
  );
}

/**
 * Helper to strip undefined values from objects before writing to Firestore.
 * Firestore throws a runtime error if any field is undefined.
 */
function cleanDocData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Push or update a Mala track to Firestore
 */
export async function saveMalaTrackToFirestore(userId: string, mala: MalaTrack): Promise<void> {
  const path = `users/${userId}/malas/${mala.id}`;
  try {
    const ref = doc(db, 'users', userId, 'malas', mala.id);
    const dataToSave = cleanDocData({
      ...mala,
      userId,
      updatedAt: Date.now(),
    });
    await setDoc(ref, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a Mala track from Firestore
 */
export async function deleteMalaTrackFromFirestore(userId: string, malaId: string): Promise<void> {
  const path = `users/${userId}/malas/${malaId}`;
  try {
    const ref = doc(db, 'users', userId, 'malas', malaId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Push or update a chant entry to Firestore
 */
export async function saveEntryToFirestore(userId: string, entry: JaapEntry): Promise<void> {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    const ref = doc(db, 'users', userId, 'entries', entry.id);
    const dataToSave = cleanDocData({
      ...entry,
      userId,
      updatedAt: Date.now(),
    });
    await setDoc(ref, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a chant entry from Firestore
 */
export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    const ref = doc(db, 'users', userId, 'entries', entryId);
    await setDoc(ref, { deleted: true, updatedAt: Date.now() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Bulk sync all local malas & entries to Firestore
 */
export async function syncAllLocalToFirestore(
  userId: string,
  malas: MalaTrack[],
  entries: JaapEntry[]
): Promise<void> {
  const now = Date.now();
  for (const mala of malas) {
    try {
      await setDoc(
        doc(db, 'users', userId, 'malas', mala.id),
        cleanDocData({
          ...mala,
          userId,
          updatedAt: mala.updatedAt || now,
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn(`Failed to sync mala ${mala.id} to Firestore:`, err);
    }
  }

  for (const entry of entries) {
    try {
      await setDoc(
        doc(db, 'users', userId, 'entries', entry.id),
        cleanDocData({
          ...entry,
          userId,
          updatedAt: entry.updatedAt || now,
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn(`Failed to sync entry ${entry.id} to Firestore:`, err);
    }
  }
}

