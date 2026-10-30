import React, { useState } from 'react';
import { X, Check, Calendar, Hash, Sparkles, Layers } from 'lucide-react';
import { MalaTrack, Mantra } from '../types/jaap';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManualChants: (data: {
    count: number;
    malaId: string;
    mantraId: string;
    mantraName: string;
    note?: string;
    timestamp: number;
  }) => void;
  activeMala: MalaTrack;
  allMalas: MalaTrack[];
  allMantras?: Mantra[];
}

const COMMON_MALA_MULTIPLES = [
  { malas: 1, label: '1 Mala', chants: 108 },
  { malas: 2, label: '2 Malas', chants: 216 },
  { malas: 4, label: '4 Malas', chants: 432 },
  { malas: 11, label: '11 Malas', chants: 1188 },
  { malas: 16, label: '16 Malas', chants: 1728 },
  { malas: 21, label: '21 Malas', chants: 2268 },
  { malas: 54, label: '54 Malas', chants: 5832 },
  { malas: 108, label: '108 Malas', chants: 11664 },
];

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  onAddManualChants,
  activeMala,
  allMalas,
}) => {
  if (!isOpen) return null;

  const [inputMode, setInputMode] = useState<'malas' | 'exact'>('malas');
  const [selectedMalaCount, setSelectedMalaCount] = useState<number>(1);
  const [exactChants, setExactChants] = useState<string>('1008');
  const [targetMalaId, setTargetMalaId] = useState<string>(activeMala.id);
  const [note, setNote] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const finalChantsCount =
    inputMode === 'malas'
      ? selectedMalaCount * 108
      : parseInt(exactChants, 10) || 0;

  const chosenMala = allMalas.find((m) => m.id === targetMalaId) || activeMala;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalChantsCount <= 0) return;

    const ts = dateStr ? new Date(dateStr).getTime() : Date.now();

    onAddManualChants({
      count: finalChantsCount,
      malaId: chosenMala.id,
      mantraId: chosenMala.id,
      mantraName: chosenMala.title,
      note: note.trim() || undefined,
      timestamp: isNaN(ts) ? Date.now() : ts,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#13151D] border border-[#2B2F3E] rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222533]">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Manual Chants Entry
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add completed Malas or custom counts to any concurrent Mala track
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1E2A] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Target Mala Track Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Target Mala Track
            </label>
            <div className="space-y-1.5">
              {allMalas.map((m) => {
                const isSelected = m.id === targetMalaId;
                return (
                  <div
                    key={m.id}
                    onClick={() => setTargetMalaId(m.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                        : 'bg-[#171926] border-[#262A3C] text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: m.colorTheme || '#F59E0B' }}
                      />
                      <div>
                        <div className="text-xs font-bold">{m.title}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          <span className="capitalize">{m.beadMaterial || 'rudraksha'}</span>
                          <span>•</span>
                          <span>Goal: {m.targetMalas} Malas</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Input Mode Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#1A1C27] rounded-xl border border-[#272B3C]">
            <button
              type="button"
              onClick={() => setInputMode('malas')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputMode === 'malas'
                  ? 'bg-amber-500 text-black shadow-md font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Completed Malas (×108)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('exact')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                inputMode === 'exact'
                  ? 'bg-amber-500 text-black shadow-md font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Custom Chants (e.g. 1008)
            </button>
          </div>

          {/* 3. Malas Quick Grid or Exact Number Input */}
          {inputMode === 'malas' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Select Completed Malas
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COMMON_MALA_MULTIPLES.map((item) => (
                  <button
                    key={item.malas}
                    type="button"
                    onClick={() => setSelectedMalaCount(item.malas)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedMalaCount === item.malas
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-[#181A25] border-[#262A3B] text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.malas}M</div>
                    <div className="text-[10px] text-gray-400 font-normal">{item.chants}</div>
                  </button>
                ))}
              </div>

              {/* Stepper */}
              <div className="mt-2.5 flex items-center justify-between px-3 py-2 bg-[#171923] rounded-xl border border-[#242738]">
                <span className="text-xs text-gray-400">Custom Malas:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMalaCount(Math.max(1, selectedMalaCount - 1))}
                    className="w-7 h-7 rounded-lg bg-[#222534] hover:bg-[#2C3042] text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-amber-400 min-w-[28px] text-center font-sacred">
                    {selectedMalaCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMalaCount(selectedMalaCount + 1)}
                    className="w-7 h-7 rounded-lg bg-[#222534] hover:bg-[#2C3042] text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Exact Number of Chants
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={exactChants}
                  onChange={(e) => setExactChants(e.target.value)}
                  placeholder="e.g. 1008, 108, 54..."
                  className="w-full pl-10 pr-4 py-2 bg-[#171924] border border-[#2B2F40] rounded-xl text-white font-sacred text-base focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[108, 540, 1008, 2160, 5000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setExactChants(quick.toString())}
                    className="px-2.5 py-1 rounded-lg bg-[#1D202D] text-[11px] text-gray-300 hover:text-amber-300 border border-[#262A3B] cursor-pointer"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#171924] border border-[#2B2F40] rounded-xl text-xs text-gray-200 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Note / Dedication (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ekadashi vow, evening prayer..."
              maxLength={120}
              className="w-full px-3 py-1.5 bg-[#171924] border border-[#2B2F40] rounded-xl text-xs text-gray-200 focus:outline-hidden focus:border-amber-500 placeholder-gray-500"
            />
          </div>

          {/* Total Preview Summary */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-amber-200/90 font-medium">Credited to:</span>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-400 font-sacred">
                +{finalChantsCount} Chants
              </span>
              <span className="text-xs text-gray-400 ml-2">
                ({(finalChantsCount / 108).toFixed(1)}M to {chosenMala.title})
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={finalChantsCount <= 0}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Add Chants to {chosenMala.title}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
