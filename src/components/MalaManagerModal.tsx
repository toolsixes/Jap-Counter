import React, { useState } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Target,
  CircleDot,
} from 'lucide-react';
import { BeadMaterial, MalaTrack } from '../types/jaap';

interface MalaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  malas: MalaTrack[];
  activeMalaId: string;
  onSelectMala: (malaId: string) => void;
  onSaveMala: (mala: MalaTrack, selectImmediately?: boolean) => void;
  onDeleteMala: (malaId: string) => void;
  onResetMala: (malaId: string) => void;
}

const MATERIAL_OPTIONS: { id: BeadMaterial; label: string; desc: string; color: string }[] = [
  { id: 'tulsi', label: 'Sacred Tulsi Wood', desc: 'Dark holy basil wood for Vaishnava & Bhakti sadhana', color: '#3A2B1D' },
  { id: 'rudraksha', label: 'Rudraksha Wood', desc: 'Textured Shiva tears for focus, peace & meditation', color: '#6D381A' },
  { id: 'sandalwood', label: 'Sandalwood (Chandan)', desc: 'Fragrant golden wood for cooling divine stillness', color: '#D4A066' },
  { id: 'sphatik', label: 'Crystal Sphatik (Quartz)', desc: 'Luminous clear stone for purity, cooling energy & Shakti', color: '#E2E8F0' },
  { id: 'gold', label: 'Vedic Gold Spacers', desc: 'Radiant polished golden beads for auspicious mantras', color: '#F59E0B' },
];

const COLOR_PRESETS = [
  '#F59E0B', // Saffron Amber
  '#EA580C', // Rudraksha Copper
  '#10B981', // Sacred Emerald / Tulsi
  '#EC4899', // Lotus Rose
  '#8B5CF6', // Sphatik Violet
  '#06B6D4', // Divine Cyan
];

const QUICK_MANTRAS: {
  title: string;
  text: string;
  deity: string;
  meaning: string;
  material: BeadMaterial;
  color: string;
  target: number;
}[] = [
  {
    title: 'Om Namah Shivaya',
    text: 'ॐ नमः शिवाय',
    deity: 'Lord Shiva',
    meaning: 'Surrendering to the eternal, auspicious peace of the supreme self.',
    material: 'rudraksha',
    color: '#EA580C',
    target: 1,
  },
  {
    title: 'Hare Krishna Mahamantra',
    text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥',
    deity: 'Sri Sri Radha Krishna',
    meaning: 'Awakening pure transcendental love and bliss through divine names.',
    material: 'tulsi',
    color: '#F59E0B',
    target: 16,
  },
  {
    title: 'Gayatri Mahamantra',
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    deity: 'Gayatri Devi / Savitr',
    meaning: 'May divine light illuminate our intellect and dispel ignorance.',
    material: 'sandalwood',
    color: '#EAB308',
    target: 3,
  },
  {
    title: 'Maha Mrityunjaya',
    text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्यprimaryोर्मुक्षीय मामृतात् ॥',
    deity: 'Lord Shiva',
    meaning: 'Liberation from mortal fear and renewal of divine energy.',
    material: 'rudraksha',
    color: '#06B6D4',
    target: 1,
  },
  {
    title: 'Radhe Radhe Devotional',
    text: 'राधे राधे',
    deity: 'Radha Rani',
    meaning: 'Ever-sweet remembrance of the Divine Mother of Bhakti.',
    material: 'sphatik',
    color: '#EC4899',
    target: 4,
  },
  {
    title: 'Om Mani Padme Hum',
    text: 'ॐ मणि पद्मे हूँ',
    deity: 'Avalokiteshvara Buddha',
    meaning: 'The jewel of compassion blossoming within the lotus of wisdom.',
    material: 'sandalwood',
    color: '#8B5CF6',
    target: 1,
  },
];

export const MalaManagerModal: React.FC<MalaManagerModalProps> = ({
  isOpen,
  onClose,
  malas,
  activeMalaId,
  onSelectMala,
  onSaveMala,
  onDeleteMala,
  onResetMala,
}) => {
  const [editingMala, setEditingMala] = useState<MalaTrack | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formMantraText, setFormMantraText] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formDeity, setFormDeity] = useState('');
  const [formMaterial, setFormMaterial] = useState<BeadMaterial>('rudraksha');
  const [formTarget, setFormTarget] = useState(4);
  const [formColor, setFormColor] = useState('#F59E0B');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleStartEdit = (mala: MalaTrack) => {
    setEditingMala(mala);
    setIsCreatingNew(false);
    setFormTitle(mala.title);
    setFormMantraText(mala.mantraText);
    setFormMeaning(mala.meaning || '');
    setFormDeity(mala.deity || '');
    setFormMaterial(mala.beadMaterial || 'rudraksha');
    setFormTarget(mala.targetMalas || 1);
    setFormColor(mala.colorTheme || '#F59E0B');
  };

  const handleStartCreate = () => {
    setEditingMala(null);
    setIsCreatingNew(true);
    setFormTitle('');
    setFormMantraText('');
    setFormMeaning('');
    setFormDeity('');
    setFormMaterial('tulsi');
    setFormTarget(4);
    setFormColor('#F59E0B');
  };

  const handleApplyPreset = (preset: typeof QUICK_MANTRAS[0]) => {
    setFormTitle(preset.title);
    setFormMantraText(preset.text);
    setFormDeity(preset.deity);
    setFormMeaning(preset.meaning);
    setFormMaterial(preset.material);
    setFormColor(preset.color);
    setFormTarget(preset.target);
  };

  const handleCancelForm = () => {
    setEditingMala(null);
    setIsCreatingNew(false);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTitle.trim() || 'Custom Mala Sadhana';
    const text = formMantraText.trim() || 'ॐ';

    if (editingMala) {
      const updated: MalaTrack = {
        ...editingMala,
        title,
        mantraText: text,
        meaning: formMeaning.trim() || undefined,
        deity: formDeity.trim() || undefined,
        beadMaterial: formMaterial,
        targetMalas: Math.max(1, formTarget),
        colorTheme: formColor,
        updatedAt: Date.now(),
      };
      onSaveMala(updated, false);
      showToast(`Updated "${updated.title}" successfully.`);
    } else {
      const newMala: MalaTrack = {
        id: 'mala_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        title,
        mantraText: text,
        meaning: formMeaning.trim() || undefined,
        deity: formDeity.trim() || undefined,
        beadMaterial: formMaterial,
        targetMalas: Math.max(1, formTarget),
        currentBead: 0,
        completedMalasToday: 0,
        totalChantsToday: 0,
        totalChantsLifetime: 0,
        colorTheme: formColor,
        order: malas.length + 1,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastChantedAt: Date.now(),
      };
      // Atomically save and select the new mala track
      onSaveMala(newMala, true);
      showToast(`Created & activated "${newMala.title}"!`);
    }

    setEditingMala(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#11131C] border border-[#262A3C] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#212434] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-sacred font-bold text-sm">
              ॐ
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                Manage Concurrent Malas
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                  {malas.length} Active Tracks
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Track independent daily goals, counts, and bead materials concurrently
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1E2B] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="mx-5 mt-3 px-3.5 py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
            <Check className="w-4 h-4 shrink-0 text-emerald-400 stroke-[3]" />
            <span className="font-semibold">{feedbackToast}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!editingMala && !isCreatingNew ? (
            <>
              {/* Add New Mala Button */}
              <button
                onClick={handleStartCreate}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Mala Sadhana Track</span>
              </button>

              {/* Mala List */}
              <div className="space-y-3 pt-1">
                {malas.map((mala) => {
                  const isSelected = mala.id === activeMalaId;
                  const isDeleting = confirmDeleteId === mala.id;
                  const targetChants = (mala.targetMalas || 1) * 108;
                  const progressPct = Math.min(
                    100,
                    Math.round(((mala.totalChantsToday || 0) / targetChants) * 100)
                  );

                  return (
                    <div
                      key={mala.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-[#181B28] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                          : 'bg-[#141622] border-[#222638] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Title & Badge */}
                        <div
                          onClick={() => {
                            onSelectMala(mala.id);
                            onClose();
                          }}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: mala.colorTheme || '#F59E0B' }}
                            />
                            <h3 className="font-bold text-xs text-gray-100 flex items-center gap-2">
                              {mala.title}
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                                  Currently Active
                                </span>
                              )}
                            </h3>
                          </div>

                          <p className="font-sacred text-amber-200/90 text-xs font-semibold mt-1 line-clamp-1">
                            {mala.mantraText}
                          </p>

                          {mala.meaning && (
                            <p className="text-[10px] text-gray-400 italic line-clamp-1 mt-0.5">
                              {mala.meaning}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(mala)}
                            className="p-1.5 rounded-lg bg-[#1F2232] text-gray-400 hover:text-amber-300 hover:bg-[#282C40] transition-colors"
                            title="Edit Mala configuration"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {malas.length > 1 && (
                            <>
                              {isDeleting ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      onDeleteMala(mala.id);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-500"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-1.5 py-1 bg-[#232738] text-gray-400 rounded-lg text-[10px]"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(mala.id)}
                                  className="p-1.5 rounded-lg bg-[#1F2232] text-gray-400 hover:text-red-400 hover:bg-[#282C40] transition-colors"
                                  title="Delete this Mala track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Independent Counter Stats for this Mala */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#1F2332] text-center">
                        <div className="bg-[#10121C] py-1.5 px-2 rounded-xl">
                          <div className="text-[9px] text-gray-400 font-medium">Current Bead</div>
                          <div className="font-sacred text-xs font-bold text-amber-400">
                            {mala.currentBead || 0} / 108
                          </div>
                        </div>
                        <div className="bg-[#10121C] py-1.5 px-2 rounded-xl">
                          <div className="text-[9px] text-gray-400 font-medium">Today's Malas</div>
                          <div className="font-sacred text-xs font-bold text-gray-100">
                            {mala.completedMalasToday || 0} / {mala.targetMalas || 1}M
                          </div>
                        </div>
                        <div className="bg-[#10121C] py-1.5 px-2 rounded-xl">
                          <div className="text-[9px] text-gray-400 font-medium">Chants Today</div>
                          <div className="font-sacred text-xs font-bold text-emerald-400">
                            {mala.totalChantsToday || 0}
                          </div>
                        </div>
                        <div className="bg-[#10121C] py-1.5 px-2 rounded-xl">
                          <div className="text-[9px] text-gray-400 font-medium">Material</div>
                          <div className="text-[10px] font-semibold text-gray-300 capitalize truncate">
                            {mala.beadMaterial || 'rudraksha'}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar towards this Mala's daily target */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-gray-400">Daily Target Progress</span>
                          <span className="font-bold text-amber-400">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-[#1A1D28] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Select Mala Button */}
                      {!isSelected && (
                        <button
                          onClick={() => {
                            onSelectMala(mala.id);
                            onClose();
                          }}
                          className="w-full mt-3 py-1.5 rounded-xl bg-[#1D2030] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 text-xs font-semibold border border-[#2A2E44] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Switch to this Mala</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Create / Edit Mala Form */
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#212434]">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {editingMala ? `Edit Mala: ${editingMala.title}` : 'Create New Mala Track'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Preset Selector for New Track */}
              {!editingMala && (
                <div className="bg-[#151724] p-3 rounded-2xl border border-[#232738]">
                  <div className="text-[11px] font-bold text-amber-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quick Presets (1-Tap Auto-fill)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_MANTRAS.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-[#1B1E2E] hover:bg-amber-500/20 border border-[#2B3044] hover:border-amber-500/50 transition-all text-[11px] text-gray-200 cursor-pointer flex items-center gap-1.5 truncate"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="truncate font-medium">{preset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Mala Title / Sadhana Name
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mahamantra Morning Sadhana or Om Namah Shivaya"
                  className="w-full px-3 py-2 bg-[#171926] border border-[#2B3044] rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 placeholder-gray-500"
                />
              </div>

              {/* Mantra Words / Verse */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Chant Words / Verse (displayed on live counter)
                </label>
                <textarea
                  rows={2}
                  value={formMantraText}
                  onChange={(e) => setFormMantraText(e.target.value)}
                  placeholder="e.g. ॐ नमः शिवाय or Hare Krishna (or leave blank for ॐ)"
                  className="w-full px-3 py-2 bg-[#171926] border border-[#2B3044] rounded-xl text-xs text-white font-sacred focus:outline-hidden focus:border-amber-500 placeholder-gray-500 resize-none"
                />
              </div>

              {/* Deity & Intention */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Deity / Tradition (Optional)
                  </label>
                  <input
                    type="text"
                    value={formDeity}
                    onChange={(e) => setFormDeity(e.target.value)}
                    placeholder="e.g. Lord Shiva, Krishna"
                    className="w-full px-3 py-1.5 bg-[#171926] border border-[#2B3044] rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Daily Goal (Malas / Day)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={108}
                      value={formTarget}
                      onChange={(e) => setFormTarget(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-1.5 bg-[#171926] border border-[#2B3044] rounded-xl text-xs text-amber-400 font-bold focus:outline-hidden focus:border-amber-500 text-center"
                    />
                    <span className="text-[11px] text-gray-400 shrink-0">
                      ({(formTarget || 1) * 108} chants)
                    </span>
                  </div>
                </div>
              </div>

              {/* Meaning */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Intention / Meaning (Optional)
                </label>
                <input
                  type="text"
                  value={formMeaning}
                  onChange={(e) => setFormMeaning(e.target.value)}
                  placeholder="e.g. Prayer for divine peace, devotion and inner strength"
                  className="w-full px-3 py-1.5 bg-[#171926] border border-[#2B3044] rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500 placeholder-gray-500"
                />
              </div>

              {/* Bead Material Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  3D Bead Material & Sacred Finish
                </label>
                <div className="space-y-1.5">
                  {MATERIAL_OPTIONS.map((mat) => {
                    const isPicked = formMaterial === mat.id;
                    return (
                      <div
                        key={mat.id}
                        onClick={() => setFormMaterial(mat.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isPicked
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                            : 'bg-[#151724] border-[#25293A] text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow-sm"
                            style={{ backgroundColor: mat.color }}
                          />
                          <div>
                            <div className="text-xs font-bold">{mat.label}</div>
                            <div className="text-[10px] text-gray-400">{mat.desc}</div>
                          </div>
                        </div>
                        {isPicked && <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Accent Preset */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Color Theme Accent
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                        formColor === color ? 'scale-115 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 py-2.5 rounded-xl bg-[#1C1F2D] hover:bg-[#25293D] text-gray-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingMala ? 'Save Changes' : 'Create Mala Track'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
