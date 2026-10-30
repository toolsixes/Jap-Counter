import React from 'react';
import { X, Volume2, Vibrate, Target, Smartphone, Sparkles, Layers } from 'lucide-react';
import { UserSettings } from '../types/jaap';
import { playChantSound, triggerHaptic } from '../services/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const testAudio = (type: 'bowl' | 'bell' | 'wood' | 'chime' | 'silent') => {
    onUpdateSettings({ soundType: type, soundEnabled: type !== 'silent' });
    playChantSound(type);
  };

  const testVibration = () => {
    triggerHaptic(40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#13151D] border border-[#2B2F40] rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222534]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-100">Preferences & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1E2A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Daily Sadhana Target */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-[#262A3B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Daily Sadhana Goal
              </span>
              <span className="font-sacred text-amber-400 font-bold text-sm">
                {settings.dailyTargetMalas} Malas ({settings.dailyTargetMalas * 108} chants)
              </span>
            </div>

            {/* Stepper & Direct Input */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#12141D] rounded-xl border border-[#242738]">
              <span className="text-xs text-gray-400">Target Malas per Day:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dailyTargetMalas: Math.max(1, settings.dailyTargetMalas - 1) })}
                  className="w-8 h-8 rounded-lg bg-[#222534] hover:bg-[#2C3042] text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  title="Decrease 1 Mala"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.dailyTargetMalas}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      onUpdateSettings({ dailyTargetMalas: val });
                    }
                  }}
                  className="w-14 text-center py-1 bg-[#1A1C28] border border-[#2F3448] rounded-lg text-amber-400 font-bold font-sacred text-sm focus:outline-hidden focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dailyTargetMalas: settings.dailyTargetMalas + 1 })}
                  className="w-8 h-8 rounded-lg bg-[#222534] hover:bg-[#2C3042] text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                  title="Increase 1 Mala"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">
                Quick Presets
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 4, 11, 16, 21].map((target) => (
                  <button
                    key={target}
                    onClick={() => onUpdateSettings({ dailyTargetMalas: target })}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      settings.dailyTargetMalas === target
                        ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md'
                        : 'bg-[#1C1F2D] border-[#292D3E] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {target}M
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 italic">
              Your daily progress bar in the Counter tracks completion towards this target.
            </p>
          </div>

          {/* Sound Synthesizer Settings */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-[#262A3B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-500" />
                Procedural Sound Audio
              </span>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-[#282C3D]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.soundEnabled ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { id: 'wood', label: 'Rudraksha Click', desc: 'Tactile wooden bead' },
                  { id: 'bowl', label: 'Tibetan Bowl', desc: 'Resonant harmonic wash' },
                  { id: 'bell', label: 'Temple Ghanta', desc: 'Sacred silver bell' },
                  { id: 'chime', label: '528Hz Solfeggio', desc: 'Pure meditative tone' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => testAudio(s.id as 'bowl' | 'bell' | 'wood' | 'chime')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.soundType === s.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#1C1F2D] border-[#292D3E] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tactile Haptic Vibration */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-[#262A3B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-gray-200">Haptic Vibration</div>
                <div className="text-[10px] text-gray-400">Tactile pulse on every bead tap</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={testVibration}
                className="px-2 py-1 rounded-md bg-[#222636] text-[10px] text-gray-300 hover:text-white"
              >
                Test
              </button>
              <button
                onClick={() => onUpdateSettings({ hapticEnabled: !settings.hapticEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  settings.hapticEnabled ? 'bg-amber-500' : 'bg-[#282C3D]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.hapticEnabled ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cross-Platform Device Frame Preview */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-[#262A3B] space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-200">Device Simulator & Layout</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Optimize view for Android (Pixel) or iOS (iPhone) or Fullscreen
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'pixel', label: 'Pixel (Android)', sub: 'Material 3' },
                { id: 'iphone', label: 'iPhone (iOS)', sub: 'Dynamic Island' },
                { id: 'fullscreen', label: 'Full Bleed', sub: 'Responsive' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateSettings({ deviceFrame: f.id as 'pixel' | 'iphone' | 'fullscreen' })}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    settings.deviceFrame === f.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#1C1F2D] border-[#292D3E] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs">{f.label}</div>
                  <div className="text-[9px] text-gray-400">{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary View Mode */}
          <div className="p-4 rounded-2xl bg-[#171924] border border-[#262A3B] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-bold text-gray-200">Default Counter View</div>
                <div className="text-[10px] text-gray-400">Three.js 3D Mala vs Minimalist Disc</div>
              </div>
            </div>
            <div className="flex p-0.5 bg-[#1B1E2B] rounded-lg border border-[#262A3B]">
              <button
                onClick={() => onUpdateSettings({ viewMode: '3d' })}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                  settings.viewMode === '3d' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'
                }`}
              >
                3D
              </button>
              <button
                onClick={() => onUpdateSettings({ viewMode: 'classic' })}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                  settings.viewMode === 'classic' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400'
                }`}
              >
                Classic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
