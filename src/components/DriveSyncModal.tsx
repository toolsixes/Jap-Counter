import React, { useState } from 'react';
import { X, Cloud, CloudOff, RefreshCw, CheckCircle2, ShieldCheck, Download, AlertCircle, FileText, User as UserIcon, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncMetadata, JaapLogData } from '../types/jaap';
import { googleSignIn, logout } from '../services/auth';
import { syncWithGoogleDrive } from '../services/driveSync';
import { loadLocalData } from '../services/storage';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  syncMeta: SyncMetadata;
  onSyncComplete: (meta: SyncMetadata) => void;
  autoSync: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  syncMeta,
  onSyncComplete,
  autoSync,
  onToggleAutoSync,
}) => {
  if (!isOpen) return null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonData, setRawJsonData] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        // Trigger initial sync right after sign-in
        handleSync(result.accessToken);
      }
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/user-cancelled'
      ) {
        // User closed or dismissed the popup; no error banner needed
        return;
      }
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onSyncComplete({
        state: 'idle',
        lastSyncedAt: null,
        remoteModifiedAt: null,
        cloudFileId: null,
        statusMessage: 'Signed out of Google Account.',
      });
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleSync = async (overrideToken?: string) => {
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      const result = await syncWithGoogleDrive(overrideToken);
      onSyncComplete({
        state: 'synced',
        lastSyncedAt: result.syncedAt,
        remoteModifiedAt: result.remoteModifiedTime ? new Date(result.remoteModifiedTime).getTime() : Date.now(),
        cloudFileId: result.fileId || null,
        statusMessage: result.message,
      });
    } catch (err: unknown) {
      console.error('Sync failed:', err);
      const msg = err instanceof Error ? err.message : 'Sync failed. Please check network connection.';
      setErrorMsg(msg);
      onSyncComplete({
        state: 'error',
        lastSyncedAt: syncMeta.lastSyncedAt,
        remoteModifiedAt: syncMeta.remoteModifiedAt,
        cloudFileId: syncMeta.cloudFileId,
        statusMessage: 'Sync error occurred.',
        errorMessage: msg,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleViewJson = () => {
    const data = loadLocalData();
    setRawJsonData(JSON.stringify(data, null, 2));
    setShowRawJson(true);
  };

  const handleDownloadBackup = () => {
    const data = loadLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jaap_log_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#13151E] border border-[#2B2F40] rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222637]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Google Drive Cloud Sync</h2>
              <p className="text-[11px] text-gray-400">Cross-Platform Chanting Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1E2A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Authentication Card */}
        <div className="mt-5 space-y-4">
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-[#181A26] border border-[#282C3D] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-amber-500/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-100">
                    {currentUser.displayName || 'Authenticated User'}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-[#222534] text-gray-400 hover:text-red-400 hover:bg-[#2A2E40] transition-colors"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Sign in with Google (Styled as standard Material GSI button per skill requirement) */
            <div className="p-4 rounded-2xl bg-[#181A26] border border-[#282C3D] text-center space-y-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                Sign in with your Google account to automatically synchronize your chant logs and malas between your phone and computer.
              </p>

              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold text-xs transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

          {/* Error notification if any */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sync Status Details */}
          <div className="p-4 rounded-2xl bg-[#181A26] border border-[#282C3D] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Sync Status:</span>
              <div className="flex items-center gap-1.5 font-semibold">
                {isSyncing ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                  </span>
                ) : syncMeta.state === 'synced' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1">
                    <CloudOff className="w-3.5 h-3.5" /> Offline Storage
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-[#232737] pt-2">
              <span className="text-gray-400 font-medium">Remote File:</span>
              <span className="font-mono text-[11px] text-amber-300">
                appDataFolder/jaap_log.json
              </span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-[#232737] pt-2">
              <span className="text-gray-400 font-medium">Last Synchronized:</span>
              <span className="text-gray-300 text-[11px]">
                {syncMeta.lastSyncedAt
                  ? new Date(syncMeta.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Not synced yet'}
              </span>
            </div>

            {syncMeta.statusMessage && (
              <div className="p-2.5 bg-[#12141C] rounded-lg text-[11px] text-gray-300 border border-[#222534] leading-relaxed">
                {syncMeta.statusMessage}
              </div>
            )}
          </div>

          {/* Auto-Sync on App Open Switch */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#181A26] rounded-2xl border border-[#282C3D]">
            <div>
              <div className="text-xs font-semibold text-gray-200">Automatic Sync</div>
              <div className="text-[10px] text-gray-400">Sync changes on startup and every count</div>
            </div>
            <button
              onClick={() => onToggleAutoSync(!autoSync)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoSync ? 'bg-amber-500' : 'bg-[#292D3E]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  autoSync ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sync Now Action Button */}
          <button
            onClick={() => handleSync()}
            disabled={isSyncing || !currentUser}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              currentUser
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer'
                : 'bg-[#202330] text-gray-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing with Google Drive...' : 'Sync Now'}</span>
          </button>

          {/* Inspect & Export tools */}
          <div className="flex gap-2 pt-2 border-t border-[#232737]">
            <button
              onClick={handleViewJson}
              className="flex-1 py-2 px-3 rounded-xl bg-[#191B26] border border-[#282C3C] text-[11px] text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Inspect jaap_log.json</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="py-2 px-3 rounded-xl bg-[#191B26] border border-[#282C3C] text-[11px] text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              title="Download local JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>Export</span>
            </button>
          </div>

          {/* Security & Privacy Note */}
          <div className="flex items-center gap-2 text-[10px] text-gray-500 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Stored privately in your personal Google Drive app folder.</span>
          </div>
        </div>

        {/* Raw JSON viewer modal overlay */}
        {showRawJson && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="w-full max-w-lg bg-[#11131A] border border-[#292D3E] rounded-2xl p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#222534]">
                <span className="text-xs font-bold text-gray-200">Raw jaap_log.json Content</span>
                <button
                  onClick={() => setShowRawJson(false)}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-md bg-[#1C1F2B]"
                >
                  Close
                </button>
              </div>
              <pre className="flex-1 overflow-auto mt-3 p-3 bg-[#0B0C10] rounded-xl text-[10px] font-mono text-amber-300/90 leading-tight">
                {rawJsonData}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
