import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Cloud,
  Settings,
  History,
  LayoutDashboard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';

import {
  JaapEntry,
  JaapLogData,
  Mantra,
  DEFAULT_MANTRAS,
  MalaTrack,
  DEFAULT_MALA_TRACKS,
  UserSettings,
  SyncMetadata,
} from './types/jaap';
import {
  loadLocalData,
  saveLocalData,
  getDeviceId,
  DEFAULT_SETTINGS,
} from './services/storage';
import { initAuth } from './services/auth';
import { syncWithGoogleDrive } from './services/driveSync';
import {
  testFirestoreConnection,
  subscribeToUserMalas,
  subscribeToUserEntries,
  saveMalaTrackToFirestore,
  saveEntryToFirestore,
  deleteMalaTrackFromFirestore,
  deleteEntryFromFirestore,
  syncAllLocalToFirestore,
} from './services/firestoreSync';
import {
  playChantSound,
  playMalaCompletionSound,
  triggerHaptic,
} from './services/audio';

import { CounterInterface } from './components/CounterInterface';
import { ManualEntryModal } from './components/ManualEntryModal';
import { MalaManagerModal } from './components/MalaManagerModal';
import { Dashboard } from './components/Dashboard';
import { HistoryModal } from './components/HistoryModal';
import { DriveSyncModal } from './components/DriveSyncModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Persistence state
  const [logData, setLogData] = useState<JaapLogData>(() => loadLocalData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active Mala and Malas list
  const malas = logData.malas && logData.malas.length > 0 ? logData.malas : DEFAULT_MALA_TRACKS;
  const activeMala = malas.find((m) => m.id === logData.activeMalaId) || malas[0];

  // Dedicated Live Counter state for the active Mala
  const [currentChantInMala, setCurrentChantInMala] = useState<number>(() => activeMala.currentBead || 0);
  const [totalChantsSession, setTotalChantsSession] = useState<number>(0);
  const [completedMalasSession, setCompletedMalasSession] = useState<number>(0);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'counter' | 'dashboard' | 'history' | 'drive' | 'settings'>('counter');

  // Modal controls
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isMalaManagerOpen, setIsMalaManagerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync state
  const [syncMeta, setSyncMeta] = useState<SyncMetadata>({
    state: 'idle',
    lastSyncedAt: null,
    remoteModifiedAt: null,
    cloudFileId: null,
    statusMessage: 'Ready for cross-platform sync',
  });

  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Celebration state
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Settings
  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...(logData.settings || {}),
  };

  // Undo history stack
  const undoStackRef = useRef<number[]>([]);

  // 1. Initialize Firebase Auth & Real-Time Sync between Android & iOS
  useEffect(() => {
    let unsubMalas: (() => void) | null = null;
    let unsubEntries: (() => void) | null = null;

    testFirestoreConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });

    const unsubscribeAuth = initAuth(
      async (user, token) => {
        setCurrentUser(user);

        // A. Real-Time Cross-Platform Firestore Sync
        try {
          // Push initial local state so cloud has user's malas
          await syncAllLocalToFirestore(user.uid, malas, logData.entries);

          // Subscribe to real-time remote changes on Malas
          unsubMalas = subscribeToUserMalas(
            user.uid,
            (remoteMalas) => {
              if (remoteMalas && remoteMalas.length > 0) {
                setLogData((prev) => {
                  const currentMalas = prev.malas && prev.malas.length > 0 ? prev.malas : DEFAULT_MALA_TRACKS;
                  const malaMap = new Map<string, MalaTrack>();
                  for (const m of currentMalas) {
                    malaMap.set(m.id, m);
                  }
                  for (const rm of remoteMalas) {
                    const existing = malaMap.get(rm.id);
                    if (!existing || (rm.updatedAt || 0) >= (existing.updatedAt || 0)) {
                      malaMap.set(rm.id, rm);
                    }
                  }
                  const mergedMalas = Array.from(malaMap.values()).sort(
                    (a, b) => (a.order || 0) - (b.order || 0) || a.createdAt - b.createdAt
                  );

                  const updated: JaapLogData = {
                    ...prev,
                    malas: mergedMalas,
                    lastModified: Date.now(),
                  };
                  saveLocalData(updated);
                  return updated;
                });
              }
            },
            (err) => console.warn('Firestore malas listener error:', err)
          );

          // Subscribe to real-time remote changes on Entries
          unsubEntries = subscribeToUserEntries(
            user.uid,
            (remoteEntries) => {
              if (remoteEntries) {
                setLogData((prev) => {
                  const updated: JaapLogData = {
                    ...prev,
                    entries: remoteEntries,
                    lastModified: Date.now(),
                  };
                  saveLocalData(updated);
                  return updated;
                });
              }
            },
            (err) => console.warn('Firestore entries listener error:', err)
          );

          setSyncMeta((prev) => ({
            ...prev,
            state: 'synced',
            lastSyncedAt: Date.now(),
            statusMessage: 'Real-time sync active across iOS and Android.',
          }));
        } catch (fsErr) {
          console.warn('Real-time sync setup warning:', fsErr);
        }

        // B. Optional Google Drive backup sync
        if (settings.autoDriveSync && token) {
          syncWithGoogleDrive(token)
            .then((res) => {
              const updated = loadLocalData();
              setLogData(updated);
              setSyncMeta({
                state: 'synced',
                lastSyncedAt: res.syncedAt,
                remoteModifiedAt: res.remoteModifiedTime ? new Date(res.remoteModifiedTime).getTime() : Date.now(),
                cloudFileId: res.fileId || null,
                statusMessage: res.message,
              });
            })
            .catch((err) => console.warn('Drive sync error:', err));
        }
      },
      () => {
        setCurrentUser(null);
        if (unsubMalas) unsubMalas();
        if (unsubEntries) unsubEntries();
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubMalas) unsubMalas();
      if (unsubEntries) unsubEntries();
    };
  }, [settings.autoDriveSync]);

  // Keep live counter synced when activeMala changes
  useEffect(() => {
    setCurrentChantInMala(activeMala.currentBead || 0);
    setTotalChantsSession(0);
    setCompletedMalasSession(0);
    undoStackRef.current = [];
  }, [activeMala.id]);

  // Update Settings helper
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated: UserSettings = {
      ...settings,
      ...newSettings,
    };
    const newLogData: JaapLogData = {
      ...logData,
      settings: updated,
    };
    setLogData(newLogData);
    saveLocalData(newLogData);
  };

  // 2. Select & Switch Mala (Isolated state per Mala)
  const handleSelectMala = (malaId: string) => {
    setLogData((prev) => {
      if (malaId === prev.activeMalaId) return prev;

      const currentMalas = prev.malas && prev.malas.length > 0 ? prev.malas : DEFAULT_MALA_TRACKS;
      // Persist current bead of currently active mala before switching
      const updatedMalas = currentMalas.map((m) =>
        m.id === prev.activeMalaId ? { ...m, currentBead: currentChantInMala, updatedAt: Date.now() } : m
      );

      const target = updatedMalas.find((m) => m.id === malaId) || updatedMalas[0];

      const updatedLogData: JaapLogData = {
        ...prev,
        activeMalaId: target.id,
        malas: updatedMalas,
        lastModified: Date.now(),
      };

      saveLocalData(updatedLogData);

      // Sync to Firestore in real time
      if (currentUser) {
        const prevMala = updatedMalas.find((m) => m.id === prev.activeMalaId);
        if (prevMala) {
          saveMalaTrackToFirestore(currentUser.uid, prevMala).catch(() => {});
        }
      }

      return updatedLogData;
    });
  };

  // 3. Save or Update Mala Track (Supports atomic save and immediate selection)
  const handleSaveMala = (mala: MalaTrack, selectImmediately: boolean = false) => {
    setLogData((prev) => {
      const currentMalas = prev.malas && prev.malas.length > 0 ? prev.malas : DEFAULT_MALA_TRACKS;
      const exists = currentMalas.some((m) => m.id === mala.id);

      let updatedMalas: MalaTrack[];
      if (exists) {
        updatedMalas = currentMalas.map((m) => (m.id === mala.id ? { ...m, ...mala, updatedAt: Date.now() } : m));
      } else {
        // If selecting immediately, also update the previous active mala's current bead
        const baseMalas = selectImmediately
          ? currentMalas.map((m) =>
              m.id === prev.activeMalaId
                ? { ...m, currentBead: currentChantInMala, updatedAt: Date.now() }
                : m
            )
          : currentMalas;
        updatedMalas = [...baseMalas, mala];
      }

      const nextActiveId = selectImmediately ? mala.id : prev.activeMalaId;

      if (selectImmediately) {
        setCurrentChantInMala(mala.currentBead || 0);
        setTotalChantsSession(0);
        setCompletedMalasSession(0);
        undoStackRef.current = [];
      }

      const updatedLogData: JaapLogData = {
        ...prev,
        activeMalaId: nextActiveId,
        malas: updatedMalas,
        lastModified: Date.now(),
      };

      saveLocalData(updatedLogData);
      return updatedLogData;
    });

    // Real-time Firestore sync
    if (currentUser) {
      saveMalaTrackToFirestore(currentUser.uid, mala).catch((err) => {
        console.warn('Real-time saveMalaTrackToFirestore error:', err);
      });
    }
  };

  // 4. Delete Mala Track
  const handleDeleteMala = (malaId: string) => {
    setLogData((prev) => {
      const currentMalas = prev.malas && prev.malas.length > 0 ? prev.malas : DEFAULT_MALA_TRACKS;
      if (currentMalas.length <= 1) return prev;
      const remaining = currentMalas.filter((m) => m.id !== malaId);
      const nextActiveId = malaId === prev.activeMalaId ? remaining[0].id : prev.activeMalaId;

      const updatedLogData: JaapLogData = {
        ...prev,
        activeMalaId: nextActiveId,
        malas: remaining,
        lastModified: Date.now(),
      };

      saveLocalData(updatedLogData);

      if (currentUser) {
        deleteMalaTrackFromFirestore(currentUser.uid, malaId).catch(() => {});
      }

      return updatedLogData;
    });
  };

  // 5. Reset Mala Track Counts
  const handleResetMala = (malaId: string) => {
    setLogData((prev) => {
      const currentMalas = prev.malas && prev.malas.length > 0 ? prev.malas : DEFAULT_MALA_TRACKS;
      const updatedMalas = currentMalas.map((m) =>
        m.id === malaId
          ? {
              ...m,
              currentBead: 0,
              completedMalasToday: 0,
              totalChantsToday: 0,
              updatedAt: Date.now(),
            }
          : m
      );

      const updatedLogData: JaapLogData = {
        ...prev,
        malas: updatedMalas,
        lastModified: Date.now(),
      };

      saveLocalData(updatedLogData);

      if (currentUser) {
        const target = updatedMalas.find((m) => m.id === malaId);
        if (target) {
          saveMalaTrackToFirestore(currentUser.uid, target).catch(() => {});
        }
      }

      return updatedLogData;
    });

    if (malaId === activeMala.id) {
      setCurrentChantInMala(0);
      setTotalChantsSession(0);
      setCompletedMalasSession(0);
    }
  };


  // 6. Increment Chant (CRITICAL: ALL taps only increment the currently selected Mala!)
  const handleIncrementChant = () => {
    // Sound & Haptic
    if (settings.soundEnabled) {
      playChantSound(settings.soundType);
    }
    if (settings.hapticEnabled) {
      triggerHaptic(28);
    }

    // Push to undo stack
    undoStackRef.current.push(currentChantInMala);

    const nextCount = currentChantInMala + 1;
    const nextTotalSession = totalChantsSession + 1;
    setTotalChantsSession(nextTotalSession);

    // Check if 1 full Mala (108 beads) has been completed on the currently selected Mala
    if (nextCount === 108) {
      setCurrentChantInMala(108);
      setCompletedMalasSession((prev) => prev + 1);
      setIsCelebrating(true);

      playMalaCompletionSound();
      confetti({
        particleCount: 85,
        spread: 60,
        origin: { y: 0.65 },
        colors: [activeMala.colorTheme || '#F59E0B', '#FBBF24', '#FFFFFF'],
      });

      // Commit 108 chants specifically credited to the currently selected Mala
      const newEntry: JaapEntry = {
        id: 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        userId: currentUser?.uid,
        malaId: activeMala.id,
        mantraId: activeMala.id,
        mantraName: activeMala.title,
        count: 108,
        malas: 1,
        timestamp: Date.now(),
        type: 'live',
        note: `Completed 1 Mala (${activeMala.title})`,
        deviceId: getDeviceId(),
        updatedAt: Date.now(),
      };

      const updatedEntries = [newEntry, ...logData.entries];

      // Update dedicated counters on the active Mala track
      const updatedMalas = malas.map((m) =>
        m.id === activeMala.id
          ? {
              ...m,
              currentBead: 0,
              completedMalasToday: (m.completedMalasToday || 0) + 1,
              totalChantsToday: (m.totalChantsToday || 0) + 108,
              totalChantsLifetime: (m.totalChantsLifetime || 0) + 108,
              lastChantedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : m
      );

      const updatedLogData: JaapLogData = {
        ...logData,
        malas: updatedMalas,
        entries: updatedEntries,
      };

      setLogData(updatedLogData);
      saveLocalData(updatedLogData);

      // Real-time backend sync to Firestore (instantly reaches other devices!)
      if (currentUser) {
        saveEntryToFirestore(currentUser.uid, newEntry).catch(() => {});
        const updatedMalaTrack = updatedMalas.find((m) => m.id === activeMala.id);
        if (updatedMalaTrack) {
          saveMalaTrackToFirestore(currentUser.uid, updatedMalaTrack).catch(() => {});
        }
      }

      // Reset bead back to 0 for next mala after celebratory moment
      setTimeout(() => {
        setCurrentChantInMala(0);
        setIsCelebrating(false);
      }, 1500);
    } else {
      setCurrentChantInMala(nextCount);

      // Persist active bead to this Mala track
      const updatedMalas = malas.map((m) =>
        m.id === activeMala.id
          ? {
              ...m,
              currentBead: nextCount,
              totalChantsToday: (m.totalChantsToday || 0) + 1,
              totalChantsLifetime: (m.totalChantsLifetime || 0) + 1,
              lastChantedAt: Date.now(),
              updatedAt: Date.now(),
            }
          : m
      );

      const updatedLogData: JaapLogData = {
        ...logData,
        malas: updatedMalas,
      };

      setLogData(updatedLogData);
      saveLocalData(updatedLogData);

      // Real-time Firestore sync
      if (currentUser && nextCount % 5 === 0) {
        const updatedMalaTrack = updatedMalas.find((m) => m.id === activeMala.id);
        if (updatedMalaTrack) {
          saveMalaTrackToFirestore(currentUser.uid, updatedMalaTrack).catch(() => {});
        }
      }
    }
  };

  // 7. Undo Chant (Applies only to active Mala)
  const handleUndoChant = () => {
    if (undoStackRef.current.length === 0 && totalChantsSession <= 0) return;

    if (settings.hapticEnabled) {
      triggerHaptic(15);
    }

    const previousBead = undoStackRef.current.pop();
    const newBead = previousBead !== undefined ? previousBead : Math.max(0, currentChantInMala - 1);
    setCurrentChantInMala(newBead);
    setTotalChantsSession(Math.max(0, totalChantsSession - 1));

    const updatedMalas = malas.map((m) =>
      m.id === activeMala.id
        ? {
            ...m,
            currentBead: newBead,
            totalChantsToday: Math.max(0, (m.totalChantsToday || 0) - 1),
            totalChantsLifetime: Math.max(0, (m.totalChantsLifetime || 0) - 1),
            updatedAt: Date.now(),
          }
        : m
    );

    const updatedLogData: JaapLogData = {
      ...logData,
      malas: updatedMalas,
    };

    setLogData(updatedLogData);
    saveLocalData(updatedLogData);
  };

  // 8. Reset Live Session Counter for Active Mala
  const handleResetSession = () => {
    if (currentChantInMala > 0) {
      const savePartial = window.confirm(
        `You have ${currentChantInMala} chants in your current session on ${activeMala.title}. Would you like to log these ${currentChantInMala} chants before resetting?`
      );
      if (savePartial) {
        const newEntry: JaapEntry = {
          id: 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
          userId: currentUser?.uid,
          malaId: activeMala.id,
          mantraId: activeMala.id,
          mantraName: activeMala.title,
          count: currentChantInMala,
          malas: Math.round((currentChantInMala / 108) * 10) / 10,
          timestamp: Date.now(),
          type: 'live',
          note: `Partial session (${activeMala.title})`,
          deviceId: getDeviceId(),
          updatedAt: Date.now(),
        };

        const updatedEntries = [newEntry, ...logData.entries];
        const updatedLogData: JaapLogData = {
          ...logData,
          entries: updatedEntries,
        };
        setLogData(updatedLogData);
        saveLocalData(updatedLogData);

        if (currentUser) {
          saveEntryToFirestore(currentUser.uid, newEntry).catch(() => {});
        }
      }
    }

    setCurrentChantInMala(0);
    setTotalChantsSession(0);
    setCompletedMalasSession(0);
    undoStackRef.current = [];

    const updatedMalas = malas.map((m) =>
      m.id === activeMala.id ? { ...m, currentBead: 0, updatedAt: Date.now() } : m
    );
    const updatedLogData: JaapLogData = {
      ...logData,
      malas: updatedMalas,
    };
    setLogData(updatedLogData);
    saveLocalData(updatedLogData);

    if (currentUser) {
      saveMalaTrackToFirestore(currentUser.uid, { ...activeMala, currentBead: 0, updatedAt: Date.now() }).catch(() => {});
    }
  };

  // 9. Add Manual Chants (Credited directly to the selected Mala Track!)
  const handleAddManualChants = (data: {
    count: number;
    malaId: string;
    mantraId: string;
    mantraName: string;
    note?: string;
    timestamp: number;
  }) => {
    const targetMala = malas.find((m) => m.id === data.malaId) || activeMala;
    const addedMalas = Math.round((data.count / 108) * 10) / 10;

    const newEntry: JaapEntry = {
      id: 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser?.uid,
      malaId: targetMala.id,
      mantraId: targetMala.id,
      mantraName: targetMala.title,
      count: data.count,
      malas: addedMalas,
      timestamp: data.timestamp,
      type: 'manual',
      note: data.note,
      deviceId: getDeviceId(),
      updatedAt: Date.now(),
    };

    const updatedEntries = [newEntry, ...logData.entries];

    // Update the targeted Mala track
    const updatedMalas = malas.map((m) =>
      m.id === targetMala.id
        ? {
            ...m,
            completedMalasToday: (m.completedMalasToday || 0) + Math.floor(data.count / 108),
            totalChantsToday: (m.totalChantsToday || 0) + data.count,
            totalChantsLifetime: (m.totalChantsLifetime || 0) + data.count,
            lastChantedAt: Date.now(),
            updatedAt: Date.now(),
          }
        : m
    );

    const updatedLogData: JaapLogData = {
      ...logData,
      malas: updatedMalas,
      entries: updatedEntries,
    };

    setLogData(updatedLogData);
    saveLocalData(updatedLogData);

    // Audio & Confetti if multiple malas
    if (data.count >= 108) {
      playMalaCompletionSound();
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: [targetMala.colorTheme || '#F59E0B', '#FBBF24'],
      });
    }

    // Real-time backend sync to Firestore
    if (currentUser) {
      saveEntryToFirestore(currentUser.uid, newEntry).catch(() => {});
      const updatedTargetMala = updatedMalas.find((m) => m.id === targetMala.id);
      if (updatedTargetMala) {
        saveMalaTrackToFirestore(currentUser.uid, updatedTargetMala).catch(() => {});
      }
    }
  };

  // 10. Delete Entry
  const handleDeleteEntry = (id: string) => {
    const updatedEntries = logData.entries.map((e) =>
      e.id === id ? { ...e, deleted: true, updatedAt: Date.now() } : e
    );
    const updatedLogData: JaapLogData = {
      ...logData,
      entries: updatedEntries,
    };
    setLogData(updatedLogData);
    saveLocalData(updatedLogData);

    if (currentUser) {
      deleteEntryFromFirestore(currentUser.uid, id).catch(() => {});
    }
  };

  // Compute stats for today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayTs = startOfToday.getTime();

  // Active Mala today stats
  const todayEntriesForActiveMala = logData.entries.filter(
    (e) => !e.deleted && e.malaId === activeMala.id && e.timestamp >= startOfTodayTs
  );
  const todayChantsForActiveMala =
    todayEntriesForActiveMala.reduce((sum, e) => sum + e.count, 0) + totalChantsSession;
  const todayMalasForActiveMala = Math.round((todayChantsForActiveMala / 108) * 10) / 10;

  // All Malas combined today stats
  const todayEntriesAll = logData.entries.filter((e) => !e.deleted && e.timestamp >= startOfTodayTs);
  const todayTotalChantsAll = todayEntriesAll.reduce((sum, e) => sum + e.count, 0) + totalChantsSession;

  // Render Inner Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'counter':
        return (
          <CounterInterface
            activeMala={activeMala}
            allMalas={malas}
            onSelectMala={handleSelectMala}
            onOpenMalaManager={() => setIsMalaManagerOpen(true)}
            currentChantInMala={currentChantInMala}
            totalChantsSession={totalChantsSession}
            completedMalasSession={completedMalasSession}
            todayChantsForMala={todayChantsForActiveMala}
            todayMalasForMala={todayMalasForActiveMala}
            todayTotalChantsAll={todayTotalChantsAll}
            onIncrementChant={handleIncrementChant}
            onUndoChant={handleUndoChant}
            onResetSession={handleResetSession}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isCelebrating={isCelebrating}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            entries={logData.entries}
            mantras={DEFAULT_MANTRAS}
            allMalas={malas}
            settings={settings}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-100 flex flex-col items-center justify-center p-0 md:p-4">
      {/* Top Bar for Desktop Preview / Multi-Device & Cloud Sync Status */}
      <header className="w-full max-w-4xl px-4 py-2.5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-sacred font-bold text-xs">
            ॐ
          </div>
          <span className="font-sacred font-bold text-gray-200 tracking-wider">
            JAAP SADHANA
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Multi-Mala Concurrent</span>
          </span>
        </div>

        {/* Real-time Cloud Sync & Device Simulator Controls */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync indicator pill */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
              currentUser
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-[#181A24] border-[#292D3E] text-gray-400 hover:text-white'
            }`}
            title="Real-Time Sync (iOS & Android) & Google Drive Backup"
          >
            <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>
              {currentUser ? 'Real-Time Synced' : 'Connect Cloud'}
            </span>
          </button>

          {/* Device Frame selector */}
          <div className="hidden sm:flex items-center p-0.5 bg-[#141620] rounded-lg border border-[#222534]">
            <button
              onClick={() => handleUpdateSettings({ deviceFrame: 'pixel' })}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                settings.deviceFrame === 'pixel' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
              title="Android Pixel View"
            >
              Pixel
            </button>
            <button
              onClick={() => handleUpdateSettings({ deviceFrame: 'iphone' })}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                settings.deviceFrame === 'iphone' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
              title="iOS iPhone View"
            >
              iPhone
            </button>
            <button
              onClick={() => handleUpdateSettings({ deviceFrame: 'fullscreen' })}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                settings.deviceFrame === 'fullscreen' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
              title="Responsive Full Screen"
            >
              Full
            </button>
          </div>
        </div>
      </header>

      {/* Main Mobile Frame Container */}
      <div
        className={`relative flex flex-col bg-[#0B0C10] shadow-2xl transition-all duration-300 overflow-hidden ${
          settings.deviceFrame === 'fullscreen'
            ? 'w-full max-w-xl h-[92vh] rounded-3xl border border-[#232737]'
            : settings.deviceFrame === 'iphone'
            ? 'w-[380px] h-[800px] rounded-[52px] border-[10px] border-[#20222D] shadow-[0_0_60px_rgba(0,0,0,0.8)]'
            : 'w-[370px] h-[790px] rounded-[42px] border-[8px] border-[#1C1F2B] shadow-[0_0_60px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Notch / Punch hole Simulator */}
        {settings.deviceFrame === 'iphone' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-40 flex items-center justify-between px-3 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#0a1b2a] border border-[#142d45]" />
          </div>
        )}
        {settings.deviceFrame === 'pixel' && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 border border-[#222] pointer-events-none" />
        )}

        {/* Top Mobile Status Header Bar */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between z-30 select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-sacred text-xs font-bold text-gray-200 tracking-wider">
              JAAP SADHANA
            </span>
            <span className="text-amber-400 font-sacred text-xs">ॐ</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time Cloud Sync button */}
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="text-gray-400 hover:text-amber-400 transition-colors p-1"
              title="Real-Time Sync (iOS & Android) & Google Drive Backup"
            >
              <Cloud className={`w-4 h-4 ${currentUser ? 'text-emerald-400' : 'text-gray-500'}`} />
            </button>

            {/* Mala Manager button */}
            <button
              onClick={() => setIsMalaManagerOpen(true)}
              className="text-gray-400 hover:text-amber-400 transition-colors p-1"
              title="Manage Malas"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-gray-400 hover:text-amber-400 transition-colors p-1"
              title="Preferences & Audio"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Viewport View (Counter or Dashboard) */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {renderTabContent()}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="h-16 bg-[#10121A]/95 border-t border-[#1F2332] flex items-center justify-around px-2 z-30 select-none">
          {/* Counter Tab */}
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'counter' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div
              className={`w-9 h-6 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'counter' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400'
              }`}
            >
              <span className="font-sacred font-bold text-sm">ॐ</span>
            </div>
            <span className="text-[10px] mt-0.5">Counter</span>
          </button>

          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div
              className={`w-9 h-6 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'dashboard' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Progress</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <div className="w-9 h-6 rounded-full flex items-center justify-center text-gray-400">
              <History className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Logs</span>
          </button>

          {/* Cloud Sync Tab */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <div className="w-9 h-6 rounded-full flex items-center justify-center text-gray-400">
              <Cloud className={`w-4 h-4 ${currentUser ? 'text-emerald-400' : ''}`} />
            </div>
            <span className="text-[10px] mt-0.5">{currentUser ? 'Synced' : 'Cloud'}</span>
          </button>
        </nav>

        {/* iOS Home Indicator Bar */}
        {settings.deviceFrame === 'iphone' && (
          <div className="w-32 h-1 bg-gray-500/40 rounded-full mx-auto my-1.5" />
        )}
      </div>

      {/* Floating Modals */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddManualChants={handleAddManualChants}
        activeMala={activeMala}
        allMalas={malas}
        allMantras={DEFAULT_MANTRAS}
      />

      <MalaManagerModal
        isOpen={isMalaManagerOpen}
        onClose={() => setIsMalaManagerOpen(false)}
        malas={malas}
        activeMalaId={activeMala.id}
        onSelectMala={handleSelectMala}
        onSaveMala={handleSaveMala}
        onDeleteMala={handleDeleteMala}
        onResetMala={handleResetMala}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        entries={logData.entries}
        mantras={DEFAULT_MANTRAS}
        allMalas={malas}
        onDeleteEntry={handleDeleteEntry}
        onOpenManualModal={() => setIsManualModalOpen(true)}
      />

      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
        syncMeta={syncMeta}
        onSyncComplete={(meta) => {
          setSyncMeta(meta);
          const fresh = loadLocalData();
          setLogData(fresh);
        }}
        autoSync={settings.autoDriveSync}
        onToggleAutoSync={(enabled) => handleUpdateSettings({ autoDriveSync: enabled })}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
