import { JaapLogData } from '../types/jaap';
import { getAccessToken } from './auth';
import { loadLocalData, saveLocalData, mergeJaapLogs } from './storage';

export interface DriveSyncResult {
  success: boolean;
  message: string;
  fileId?: string;
  remoteModifiedTime?: string;
  syncedAt: number;
  entriesCount: number;
  mergedCount?: number;
}

const DRIVE_FILE_NAME = 'jaap_log.json';

/**
 * Searches for jaap_log.json in the user's hidden Google Drive appDataFolder.
 */
async function findDriveFile(token: string): Promise<{ id: string; modifiedTime: string; size?: string } | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Google Drive session expired. Please sign in with Google again.');
    }
    if (res.status === 403) {
      throw new Error('Google Drive permission not granted. Real-time Cloud sync is active.');
    }
    throw new Error(`Drive service notice (${res.status}). Real-time Cloud database remains active.`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Reads jaap_log.json content from Google Drive
 */
async function downloadDriveFile(token: string, fileId: string): Promise<JaapLogData> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download file from Google Drive (${res.status})`);
  }

  const json = await res.json();
  return json as JaapLogData;
}

/**
 * Creates new jaap_log.json in the hidden appDataFolder using multipart upload
 */
async function createDriveFile(token: string, logData: JaapLogData): Promise<string> {
  const metadata = {
    name: DRIVE_FILE_NAME,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(logData, null, 2) +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create jaap_log.json in appDataFolder: ${errorText}`);
  }

  const created = await res.json();
  return created.id;
}

/**
 * Updates existing jaap_log.json content in Google Drive
 */
async function updateDriveFile(token: string, fileId: string, logData: JaapLogData): Promise<void> {
  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logData, null, 2),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update jaap_log.json: ${errorText}`);
  }
}

/**
 * Primary synchronization workflow:
 * 1. Checks if jaap_log.json exists in Google Drive appDataFolder
 * 2. If not found, uploads the local jaap database to create it
 * 3. If found, compares timestamps and merges entries from other devices
 * 4. Saves merged database locally and pushes the merged file back to Google Drive
 */
export async function syncWithGoogleDrive(customToken?: string): Promise<DriveSyncResult> {
  const token = customToken || (await getAccessToken());
  if (!token) {
    throw new Error('Google Sign-In required to sync with Google Drive.');
  }

  const localData = loadLocalData();

  // 1. Check file in Drive appDataFolder
  const existingFile = await findDriveFile(token);

  if (!existingFile) {
    // Fresh cloud setup: upload initial local file
    const fileId = await createDriveFile(token, localData);
    const now = Date.now();
    return {
      success: true,
      message: 'Created jaap_log.json in secure Google Drive app folder & uploaded initial counts.',
      fileId,
      syncedAt: now,
      entriesCount: localData.entries.length,
      mergedCount: 0,
    };
  }

  // 2. File exists in Drive: download and inspect remote data
  const remoteData = await downloadDriveFile(token, existingFile.id);
  
  // 3. Merge local + remote
  const { merged, changed } = mergeJaapLogs(localData, remoteData);

  // 4. Update local storage with the merged records
  saveLocalData(merged);

  // 5. If local had newer chants or remote had different chants, update cloud copy
  await updateDriveFile(token, existingFile.id, merged);

  return {
    success: true,
    message: changed
      ? `Merged ${merged.entries.length} chants across devices and updated Google Drive.`
      : `Synchronized with Google Drive. All ${merged.entries.length} chants are up-to-date.`,
    fileId: existingFile.id,
    remoteModifiedTime: existingFile.modifiedTime,
    syncedAt: Date.now(),
    entriesCount: merged.entries.length,
    mergedCount: Math.abs(merged.entries.length - localData.entries.length),
  };
}
