import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { CompanionMemory, MemoryCategory } from '../types';
import { playSound } from '../utils/soundEffects';

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: CompanionMemory[];
  onAddMemory: (category: MemoryCategory, content: string) => void;
  onUpdateMemory: (id: string, newContent: string, newCategory: MemoryCategory) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  soundEnabled?: boolean;
}

const CATEGORY_META: Record<
  MemoryCategory,
  { label: string; color: string; badgeClass: string }
> = {
  preference: {
    label: 'Preference',
    color: '#ec4899',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  experience: {
    label: 'Shared Moment',
    color: '#a855f7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  topic: {
    label: 'Favorite Topic',
    color: '#38bdf8',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  nickname: {
    label: 'Nickname',
    color: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  custom: {
    label: 'Custom Memory',
    color: '#fbbf24',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
};

export const MemoryManagerModal: React.FC<MemoryManagerModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAllMemories,
  soundEnabled = true,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('preference');

  if (!isOpen) return null;

  const handleStartEdit = (mem: CompanionMemory) => {
    playSound.click(soundEnabled);
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditCategory(mem.category);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    playSound.success(soundEnabled);
    onUpdateMemory(id, editContent.trim(), editCategory);
    setEditingId(null);
  };

  const handleCreateNew = () => {
    if (!newContent.trim()) return;
    playSound.success(soundEnabled);
    onAddMemory(newCategory, newContent.trim());
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#140c1e] border border-pink-500/30 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-pink-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-500/30">
              <Brain className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Partner Memory Log</span>
                <Sparkles className="w-4 h-4 text-pink-400" />
              </h3>
              <p className="text-xs text-pink-200/70">
                Details Zero Two remembers about you & your bond
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSound.click(soundEnabled);
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2.5 bg-pink-950/30 border-b border-pink-500/15 text-[11px] text-pink-200/80 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-pink-400 shrink-0" />
          <span>
            Zero Two uses these memories to personalize conversations. You can view, edit, or delete any item anytime.
          </span>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {memories.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Brain className="w-10 h-10 text-pink-500/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No saved memories yet</p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                When you share hobbies, food preferences, or inside jokes in chat, Zero Two will ask to remember them!
              </p>
            </div>
          ) : (
            memories.map((mem) => {
              const meta = CATEGORY_META[mem.category] || CATEGORY_META.custom;
              const isEditingThis = editingId === mem.id;

              if (isEditingThis) {
                return (
                  <div
                    key={mem.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-pink-500/40 space-y-2.5 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                        className="text-xs bg-slate-950 border border-pink-500/30 rounded-lg px-2 py-1 text-pink-200 focus:outline-none"
                      >
                        {Object.entries(CATEGORY_META).map(([catKey, catMeta]) => (
                          <option key={catKey} value={catKey}>
                            {catMeta.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(mem.id)}
                          className="p-1 rounded-lg bg-pink-600 text-white text-xs hover:bg-pink-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-lg bg-white/10 text-zinc-400 text-xs hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2 bg-slate-950 border border-pink-500/30 rounded-xl text-white resize-none focus:outline-none"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={mem.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-pink-500/20 hover:border-pink-500/40 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(mem.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                      {mem.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(mem)}
                      title="Edit memory"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        playSound.click(soundEnabled);
                        onDeleteMemory(mem.id);
                      }}
                      title="Delete memory"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* New Memory Form */}
          {isAdding && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-pink-500/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Partner Detail</span>
                </span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="text-xs bg-slate-950 border border-pink-500/30 rounded-lg px-2 py-1 text-pink-200 focus:outline-none"
                >
                  {Object.entries(CATEGORY_META).map(([catKey, catMeta]) => (
                    <option key={catKey} value={catKey}>
                      {catMeta.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Loves playing retro co-op games on weekends..."
                rows={2}
                className="w-full text-xs p-2 bg-slate-950 border border-pink-500/30 rounded-xl text-white resize-none focus:outline-none placeholder-zinc-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 text-xs hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={!newContent.trim()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 transition-all"
                >
                  Save Memory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-pink-500/20 flex items-center justify-between">
          {!isAdding ? (
            <button
              onClick={() => {
                playSound.click(soundEnabled);
                setIsAdding(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-semibold transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
          ) : (
            <div />
          )}

          {memories.length > 0 && (
            <button
              onClick={() => {
                playSound.click(soundEnabled);
                if (confirm('Clear all partner memories with Zero Two?')) {
                  onClearAllMemories();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
