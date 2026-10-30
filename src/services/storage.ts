import {
  DEFAULT_MALA_TRACKS,
  JaapEntry,
  JaapLogData,
  MalaTrack,
  UserSettings,
} from '../types/jaap';

const STORAGE_KEY = 'jaap_counter_data_v2';
const DEVICE_KEY = 'jaap_device_id_v1';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export const DEFAULT_SETTINGS: UserSettings = {
  dailyTargetMalas: 4,
  selectedMantraId: 'gayatri',
  soundEnabled: true,
  soundType: 'wood',
  hapticEnabled: true,
  themeAccent: 'saffron',
  viewMode: '3d',
  deviceFrame: 'pixel',
  autoDriveSync: true,
  autoFirestoreSync: true,
  customMantraName: 'Personal Chant',
  customMantraText: 'ॐ नमः शिवाय',
  customMantraMeaning: 'Personal divine remembrance and meditation.',
};

function getSampleInitialEntries(): JaapEntry[] {
  const deviceId = getDeviceId();
  const dayMs = 86400000;
  const now = Date.now();

  return [
    {
      id: 'init_1',
      malaId: 'mala_gayatri',
      mantraId: 'gayatri',
      mantraName: 'Gayatri Mahamantra',
      count: 108,
      malas: 1,
      timestamp: now - dayMs * 2,
      type: 'manual',
      note: 'Morning Sandhya meditation',
      deviceId,
      updatedAt: now - dayMs * 2,
    },
    {
      id: 'init_2',
      malaId: 'mala_om_namah_shivaya',
      mantraId: 'om_namah_shivaya',
      mantraName: 'Om Namah Shivaya',
      count: 108,
      malas: 1,
      timestamp: now - dayMs * 1,
      type: 'live',
      note: 'Evening Pradosh chanting',
      deviceId,
      updatedAt: now - dayMs * 1,
    },
  ];
}

export function loadLocalData(): JaapLogData {
  if (typeof window === 'undefined') {
    return {
      version: 2,
      app: 'JaapCounter',
      lastModified: Date.now(),
      deviceId: 'server',
      activeMalaId: DEFAULT_MALA_TRACKS[0].id,
      malas: DEFAULT_MALA_TRACKS,
      entries: [],
      settings: DEFAULT_SETTINGS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('jaap_counter_data_v1');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<JaapLogData>;
      if (parsed) {
        // Ensure malas array is initialized
        let malas: MalaTrack[] = Array.isArray(parsed.malas) && parsed.malas.length > 0
          ? parsed.malas
          : DEFAULT_MALA_TRACKS;

        const activeMalaId = parsed.activeMalaId || (malas[0] ? malas[0].id : DEFAULT_MALA_TRACKS[0].id);

        const entries: JaapEntry[] = Array.isArray(parsed.entries)
          ? parsed.entries.filter((e) => !e.deleted).map((e) => ({
              ...e,
              malaId: e.malaId || activeMalaId,
            }))
          : getSampleInitialEntries();

        return {
          version: 2,
          app: 'JaapCounter',
          lastModified: parsed.lastModified || Date.now(),
          deviceId: parsed.deviceId || getDeviceId(),
          activeMalaId,
          malas,
          entries,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    }
  } catch (err) {
    console.warn('Could not parse local jaap data:', err);
  }

  const initialData: JaapLogData = {
    version: 2,
    app: 'JaapCounter',
    lastModified: Date.now(),
    deviceId: getDeviceId(),
    activeMalaId: DEFAULT_MALA_TRACKS[0].id,
    malas: DEFAULT_MALA_TRACKS,
    entries: getSampleInitialEntries(),
    settings: DEFAULT_SETTINGS,
  };
  saveLocalData(initialData);
  return initialData;
}

export function saveLocalData(data: JaapLogData): void {
  if (typeof window === 'undefined') return;
  try {
    const updated: JaapLogData = {
      ...data,
      version: 2,
      lastModified: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
}

/**
 * Intelligent multi-mala 3-way merger for syncing across multiple devices.
 */
export function mergeJaapLogs(
  local: JaapLogData,
  remote: JaapLogData
): { merged: JaapLogData; changed: boolean } {
  let changed = false;

  // 1. Merge Entries
  const entryMap = new Map<string, JaapEntry>();
  for (const entry of local.entries) {
    entryMap.set(entry.id, entry);
  }

  for (const rEntry of remote.entries || []) {
    const lEntry = entryMap.get(rEntry.id);
    if (!lEntry) {
      if (!rEntry.deleted) {
        entryMap.set(rEntry.id, rEntry);
        changed = true;
      }
    } else {
      if (rEntry.updatedAt > lEntry.updatedAt) {
        if (rEntry.deleted) {
          entryMap.delete(rEntry.id);
          changed = true;
        } else {
          entryMap.set(rEntry.id, rEntry);
          changed = true;
        }
      }
    }
  }

  const mergedEntries = Array.from(entryMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  // 2. Merge Malas
  const malaMap = new Map<string, MalaTrack>();
  for (const m of local.malas || DEFAULT_MALA_TRACKS) {
    malaMap.set(m.id, m);
  }

  for (const rMala of remote.malas || []) {
    const lMala = malaMap.get(rMala.id);
    if (!lMala) {
      malaMap.set(rMala.id, rMala);
      changed = true;
    } else if (rMala.updatedAt > lMala.updatedAt) {
      malaMap.set(rMala.id, rMala);
      changed = true;
    }
  }

  const mergedMalas = Array.from(malaMap.values()).sort(
    (a, b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt
  );

  const activeMalaId =
    remote.lastModified > local.lastModified && remote.activeMalaId && malaMap.has(remote.activeMalaId)
      ? remote.activeMalaId
      : local.activeMalaId && malaMap.has(local.activeMalaId)
      ? local.activeMalaId
      : mergedMalas[0]?.id || DEFAULT_MALA_TRACKS[0].id;

  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...(remote.settings || {}),
    ...(local.settings || {}),
  };

  const merged: JaapLogData = {
    version: 2,
    app: 'JaapCounter',
    lastModified: Math.max(local.lastModified, remote.lastModified, Date.now()),
    deviceId: local.deviceId || getDeviceId(),
    activeMalaId,
    malas: mergedMalas,
    entries: mergedEntries,
    settings: mergedSettings,
  };

  return { merged, changed };
}
