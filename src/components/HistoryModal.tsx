import React, { useState, useMemo } from 'react';
import { X, Search, Trash2, Calendar, Tag, Smartphone, Filter, PlusCircle } from 'lucide-react';
import { JaapEntry, Mantra, MalaTrack, DEFAULT_MANTRAS } from '../types/jaap';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JaapEntry[];
  mantras?: Mantra[];
  allMalas?: MalaTrack[];
  onDeleteEntry: (id: string) => void;
  onOpenManualModal?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  entries,
  mantras = DEFAULT_MANTRAS,
  allMalas = [],
  onDeleteEntry,
  onOpenManualModal,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMantra, setFilterMantra] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Only show malas that are available in the concurrent mala section
  const dynamicOptions = useMemo(() => {
    const activeMalas = (allMalas && allMalas.length > 0 ? allMalas : []).filter(
      (m) => m.isActive !== false
    );
    return activeMalas.map((m) => ({
      id: m.id,
      name: m.title,
    }));
  }, [allMalas]);

  const filteredEntries = entries.filter((e) => {
    if (e.deleted) return false;

    // Filter by selected mantra (supporting default and custom user mantras)
    if (filterMantra !== 'all') {
      const selectedOption = dynamicOptions.find((opt) => opt.id === filterMantra);
      const selectedName = selectedOption ? selectedOption.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const entryName = (e.mantraName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const idMatch = e.mantraId === filterMantra || e.malaId === filterMantra;
      const nameMatch = selectedName && (entryName.includes(selectedName) || selectedName.includes(entryName));

      if (!idMatch && !nameMatch) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = e.note?.toLowerCase().includes(q);
      const matchMantra = (e.mantraName || '').toLowerCase().includes(q);
      const matchDate = new Date(e.timestamp).toLocaleDateString().includes(q);
      return matchNote || matchMantra || matchDate;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#13151D] border border-[#2B2F40] rounded-3xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222535]">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Chanting Logs History
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {filteredEntries.length} records found
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenManualModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenManualModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Add manual chant entry"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Entry</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1C1E2A] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by notes or date..."
              className="w-full pl-9 pr-3 py-2 bg-[#171924] border border-[#272B3B] rounded-xl text-xs text-gray-200 focus:outline-hidden focus:border-amber-500 placeholder-gray-500"
            />
          </div>

          {/* Mantra Filter Dropdown - Clean & Uncluttered */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={filterMantra}
              onChange={(e) => setFilterMantra(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#171924] border border-[#272B3B] rounded-xl text-xs text-gray-200 focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Malas</option>
              {dynamicOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No chanting logs match your filters.
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const dateObj = new Date(entry.timestamp);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-[#171924] border border-[#262A3B] flex items-center justify-between gap-3 hover:border-[#383E54] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sacred text-amber-400 font-bold text-sm">
                        {entry.count} Chants
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                        {(entry.count / 108).toFixed(1)} Malas
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-[#222636] text-gray-400 font-medium">
                        {entry.type}
                      </span>
                    </div>

                    <div className="text-xs text-gray-200 font-medium truncate mt-0.5">
                      {entry.mantraName || 'Mantra Chanting'}
                    </div>

                    {entry.note && (
                      <div className="text-[11px] text-gray-400 italic line-clamp-1 mt-0.5 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                        <span>{entry.note}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                      <span>{formattedDate} at {formattedTime}</span>
                      {entry.deviceId && (
                        <span className="flex items-center gap-0.5 truncate max-w-[90px]" title={entry.deviceId}>
                          <Smartphone className="w-2.5 h-2.5" />
                          {entry.deviceId.slice(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete with explicit confirmation */}
                  {deleteConfirmId === entry.id ? (
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={() => {
                          onDeleteEntry(entry.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-500 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-[10px] text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(entry.id)}
                      className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete log entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
