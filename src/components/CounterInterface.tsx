import React, { useState } from 'react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Sparkles,
  PlusCircle,
  Layers,
  CheckCircle2,
  Target,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { MalaTrack, UserSettings } from '../types/jaap';
import { ThreeMalaScene } from './ThreeMalaScene';

interface CounterInterfaceProps {
  activeMala: MalaTrack;
  allMalas: MalaTrack[];
  onSelectMala: (malaId: string) => void;
  onOpenMalaManager: () => void;
  currentChantInMala: number; // 0 to 108
  totalChantsSession: number;
  completedMalasSession: number;
  todayChantsForMala: number;
  todayMalasForMala: number;
  todayTotalChantsAll: number;
  onIncrementChant: () => void;
  onUndoChant: () => void;
  onResetSession: () => void;
  onOpenManualModal: () => void;
  onOpenSettings?: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  isCelebrating: boolean;
}

export const CounterInterface: React.FC<CounterInterfaceProps> = ({
  activeMala,
  allMalas,
  onSelectMala,
  onOpenMalaManager,
  currentChantInMala,
  totalChantsSession,
  completedMalasSession,
  todayChantsForMala,
  todayMalasForMala,
  todayTotalChantsAll,
  onIncrementChant,
  onUndoChant,
  onResetSession,
  onOpenManualModal,
  onOpenSettings,
  settings,
  onUpdateSettings,
  isCelebrating,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMalaDropdown, setShowMalaDropdown] = useState(false);
  const [animTrigger, setAnimTrigger] = useState(0);

  // Micro-interaction trigger whenever counter increments on bead tap
  React.useEffect(() => {
    setAnimTrigger((prev) => prev + 1);
  }, [currentChantInMala]);

  const percentage = Math.round((currentChantInMala / 108) * 100);

  // Daily Mala Target Progress calculation for the active Mala
  const targetMalas = activeMala.targetMalas || 1;
  const targetChants = targetMalas * 108;
  const dailyGoalPercent = Math.min(100, Math.round((todayChantsForMala / targetChants) * 100));
  const dailyGoalRawPercent = Math.round((todayChantsForMala / targetChants) * 100);
  const remainingChants = Math.max(0, targetChants - todayChantsForMala);
  const remainingMalas = Math.max(0, Math.round(((targetChants - todayChantsForMala) / 108) * 10) / 10);
  const isGoalReached = todayChantsForMala >= targetChants;

  return (
    <div className="relative flex flex-col h-full w-full justify-between select-none">
      {/* 1. Multi-Mala Concurrent Switcher Rail */}
      <div className="px-4 pt-2.5 pb-1 relative z-30">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Concurrent Malas
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              ({allMalas.length} active)
            </span>
          </div>

          <button
            onClick={onOpenMalaManager}
            className="text-[10px] text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161824] border border-[#262B3E] hover:border-amber-500/40 transition-colors cursor-pointer"
            title="Manage all concurrent malas"
          >
            <Settings2 className="w-3 h-3" />
            <span>Manage Tracks</span>
          </button>
        </div>

        {/* Horizontal Scrollable Mala Selection Cards */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {allMalas.map((m) => {
            const isSelected = m.id === activeMala.id;
            const progress = Math.min(100, Math.round(((m.totalChantsToday || 0) / (m.targetMalas * 108)) * 100));

            return (
              <button
                key={m.id}
                onClick={() => onSelectMala(m.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#181B28] border-amber-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.22)]'
                    : 'bg-[#12141F] border-[#222536] text-gray-300 hover:border-gray-600 hover:bg-[#161826]'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: m.colorTheme || '#F59E0B' }}
                />

                <div className="text-left">
                  <div className="text-xs font-bold truncate max-w-[110px] leading-tight">
                    {m.title}
                  </div>
                  <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className="font-sacred text-amber-400/90 font-semibold">
                      Bead {m.currentBead || 0}
                    </span>
                    <span>•</span>
                    <span>{m.completedMalasToday || 0}/{m.targetMalas}M</span>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}

          {/* Quick Add Button */}
          <button
            onClick={onOpenMalaManager}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#141624] border border-dashed border-[#2F344A] hover:border-amber-500/60 text-gray-400 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Create new concurrent mala"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[10px]">Add Mala</span>
          </button>
        </div>
      </div>

      {/* 2. Top Header Controls: Active Mala Info, Sound, View Mode */}
      <div className="px-5 pt-1.5 pb-1 relative z-20 flex items-center justify-between">
        {/* Active Mala Selector Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMalaDropdown(!showMalaDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161822] border border-[#282C3D] hover:border-amber-500/50 hover:bg-[#1E212E] transition-all text-left cursor-pointer active:scale-95 shadow-sm"
            title="Switch or view Mala details"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeMala.colorTheme || '#F59E0B' }}
            />
            <span className="text-xs font-bold text-gray-100 tracking-wide max-w-[140px] truncate">
              {activeMala.title}
            </span>
            <ChevronDown className={`w-3 h-3 text-amber-400/80 transition-transform ${showMalaDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Invisible backdrop to dismiss dropdown */}
          {showMalaDropdown && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMalaDropdown(false)}
            />
          )}

          {/* Dropdown Menu */}
          {showMalaDropdown && (
            <div className="absolute top-10 left-0 w-80 max-w-[calc(100vw-36px)] bg-[#12141F] border border-[#2D3244] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.95)] z-50 p-2.5 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-[#202332]">
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Select Active Mala
                </div>
                <button
                  onClick={() => setShowMalaDropdown(false)}
                  className="text-gray-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                {allMalas.map((m) => {
                  const isSelected = m.id === activeMala.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMala(m.id);
                        setShowMalaDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-300 font-medium border border-amber-500/40'
                          : 'text-gray-300 hover:bg-[#1C1F2E] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: m.colorTheme || '#F59E0B' }}
                          />
                          <span className="font-semibold">{m.title}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                        <span className="capitalize">{m.beadMaterial || 'rudraksha'} beads</span>
                        <span className="font-sacred text-amber-300/80">
                          Bead {m.currentBead || 0} / 108 • Goal: {m.targetMalas}M
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-[#222536]">
                <button
                  onClick={() => {
                    setShowMalaDropdown(false);
                    onOpenMalaManager();
                  }}
                  className="w-full py-2 rounded-xl bg-[#181B28] hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#282C40] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create / Manage More Malas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick controls: Sound & View Mode */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="w-8 h-8 rounded-full bg-[#161822] border border-[#282C3D] flex items-center justify-center text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
            title={settings.soundEnabled ? 'Mute Chant Audio' : 'Enable Chant Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          <button
            onClick={() => onUpdateSettings({ viewMode: settings.viewMode === '3d' ? 'classic' : '3d' })}
            className={`px-2.5 h-8 rounded-full border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              settings.viewMode === '3d'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#161822] border-[#282C3D] text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle between 3D Sacred Mala and Minimalist Tap Disc"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{settings.viewMode === '3d' ? '3D Mala' : 'Minimal'}</span>
          </button>
        </div>
      </div>

      {/* 3. Sacred Mantra Original Text Banner */}
      <div className="px-6 text-center my-1 relative z-0">
        <p className="font-sacred text-amber-200/90 text-sm md:text-base font-semibold tracking-wider drop-shadow-sm">
          {activeMala.mantraText}
        </p>
        {activeMala.meaning && (
          <p className="text-[11px] text-gray-400 italic mt-0.5 line-clamp-1">
            {activeMala.meaning}
          </p>
        )}
      </div>

      {/* 4. Main Interactive Tap Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[310px]">
        {settings.viewMode === '3d' ? (
          /* Three.js 3D Interactive Sacred Japamala Scene */
          <div className="relative w-full h-[330px] max-w-[360px] mx-auto flex items-center justify-center">
            <ThreeMalaScene
              key={activeMala.id}
              currentBead={currentChantInMala}
              totalChants={totalChantsSession}
              onTapBead={onIncrementChant}
              isCompleted={isCelebrating}
              beadMaterial={activeMala.beadMaterial}
              colorTheme={activeMala.colorTheme}
            />

            {/* Overlaid Center Counter Badge */}
            <div
              onClick={onIncrementChant}
              className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-center p-4 rounded-full bg-[#0D0E14]/90 border border-amber-500/35 backdrop-blur-xs shadow-2xl active:scale-95 transition-transform"
              style={{ width: '136px', height: '136px' }}
            >
              {/* Subtle mini progress arc around the center disc */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 136 136">
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  className="stroke-[#222534]/50"
                  strokeWidth="2.5"
                  fill="none"
                />
                <circle
                  cx="68"
                  cy="68"
                  r="62"
                  className="stroke-amber-500/80 transition-all duration-150"
                  strokeWidth="2.5"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * currentChantInMala) / 108}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400/90 z-10">
                MALA BEAD
              </div>
              <div className="font-sacred text-4xl font-bold text-white tracking-tight flex items-baseline z-10">
                <span
                  key={`3d-${animTrigger}`}
                  className="counter-num-smooth animate-counter-scale"
                >
                  {currentChantInMala}
                </span>
                <span className="text-xs text-amber-400/70 font-normal ml-0.5">/ 108</span>
              </div>
              <div className="text-[10px] text-gray-300 mt-0.5 font-medium z-10">
                {completedMalasSession > 0
                  ? `${completedMalasSession} Mala${completedMalasSession > 1 ? 's' : ''}`
                  : 'Tap to chant'}
              </div>
            </div>
          </div>
        ) : (
          /* Minimalist Classic Focus Tap Area */
          <div
            onClick={onIncrementChant}
            className="relative flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform"
          >
            {/* Circular Progress Ring */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full bg-gradient-to-b from-[#181B24] to-[#0E1017] border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.12)]">
              {/* Outer Circular SVG progress indicator */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-[#1D212C]"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-amber-500 transition-all duration-150"
                  strokeWidth="4"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * currentChantInMala) / 108}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Center Chant Count Display */}
              <div className="flex flex-col items-center z-10 text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400/80">
                  CURRENT MALA
                </span>
                <span
                  key={`classic-${animTrigger}`}
                  className="font-sacred text-6xl md:text-7xl font-bold text-white tracking-tight mt-1 counter-num-smooth animate-counter-scale"
                >
                  {currentChantInMala}
                </span>
                <span className="text-xs text-gray-400 mt-1 font-medium">
                  Bead {currentChantInMala} of 108
                </span>

                <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{percentage}% Complete</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 tracking-wide font-medium">
              Tap anywhere inside circle to chant
            </p>
          </div>
        )}
      </div>

      {/* 5. Daily Mala Target Progress Bar for Active Mala */}
      <div
        onClick={onOpenMalaManager}
        className="px-4 py-2.5 mx-4 mb-2 z-10 bg-[#13151F]/90 border border-[#242838] hover:border-amber-500/40 rounded-2xl transition-all cursor-pointer group shadow-lg"
        title="Tap to adjust Mala Target"
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-gray-200">
              {activeMala.title} Goal: {targetMalas} Mala{targetMalas > 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({targetChants} chants)
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isGoalReached ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Goal Reached ({dailyGoalRawPercent}%)
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-400 font-sacred">
                {todayMalasForMala} / {targetMalas}M ({dailyGoalPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-[#1A1D28] h-2 rounded-full overflow-hidden relative border border-[#232738]/50">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
            }`}
            style={{ width: `${dailyGoalPercent}%` }}
          />
        </div>

        {/* Status caption */}
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
          <span>{todayChantsForMala} chants chanted for this Mala today</span>
          <span className={isGoalReached ? 'text-amber-300 font-semibold' : 'text-gray-400'}>
            {isGoalReached
              ? '✨ Mala target fulfilled!'
              : `${remainingChants} chants (${remainingMalas}M) left`}
          </span>
        </div>
      </div>

      {/* 6. Mala Independent Summary Stat Bar */}
      <div className="px-6 py-2.5 z-10 grid grid-cols-3 gap-2 text-center bg-[#11131A]/90 rounded-2xl mx-4 border border-[#222634]">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Session Malas</span>
          <span className="text-base font-bold text-amber-400 font-sacred">{completedMalasSession}</span>
        </div>
        <div className="flex flex-col border-x border-[#222634]">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Session Chants</span>
          <span className="text-base font-bold text-gray-100">{totalChantsSession}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Mala Today</span>
          <span className="text-base font-bold text-emerald-400">{todayChantsForMala} ({todayMalasForMala}M)</span>
        </div>
      </div>

      {/* 7. Action Buttons: Undo, Manual Entry, Reset */}
      <div className="px-6 py-3.5 z-10 flex items-center justify-between gap-3">
        {/* Undo Button */}
        <button
          onClick={onUndoChant}
          disabled={totalChantsSession <= 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            totalChantsSession > 0
              ? 'bg-[#181A24] border-[#2E3344] text-gray-200 hover:text-amber-400 hover:border-amber-500/40 active:scale-95'
              : 'bg-[#13141C] border-[#1C1E28] text-gray-600 cursor-not-allowed'
          }`}
          title="Undo last chant on active mala"
        >
          <Undo2 className="w-4 h-4" />
          <span>Undo</span>
        </button>

        {/* Manual Add Quick Button */}
        <button
          onClick={onOpenManualModal}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 active:scale-98 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>

        {/* Reset Button */}
        <div className="relative">
          {showResetConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onResetSession();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-2 rounded-xl bg-red-600/90 text-white text-xs font-semibold hover:bg-red-500 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-2 rounded-xl bg-[#1D212C] text-gray-400 text-xs hover:text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={totalChantsSession <= 0}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                totalChantsSession > 0
                  ? 'bg-[#181A24] border-[#2E3344] text-gray-400 hover:text-red-400 hover:border-red-500/30 active:scale-95'
                  : 'bg-[#13141C] border-[#1C1E28] text-gray-600 cursor-not-allowed'
              }`}
              title="Reset current live session for this mala"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
