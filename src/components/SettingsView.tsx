import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sliders,
  Sparkles,
  Trash2,
  RotateCcw,
  User,
  Heart,
  VolumeX,
  Play,
  Check,
  Brain,
  Zap,
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import {
  getAvailableVoices,
  SpeechVoiceOption,
  speakText,
  stopSpeaking,
} from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  onClearHistory: () => void;
  messageCount: number;
  onOpenMemoryModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onClearHistory,
  messageCount,
  onOpenMemoryModal,
}) => {
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getAvailableVoices().then((v) => {
      setVoices(v);
    });
  }, []);

  const handleTestVoice = () => {
    playSound.click(settings.soundEffectsEnabled);
    setIsTestingVoice(true);
    stopSpeaking();

    const sample = `Hello ${settings.userNickname}! I'm ${settings.assistantNickname}. How do I sound to you, Darling? 🌸`;
    speakText(sample, {
      pitch: settings.voicePitch,
      rate: settings.voiceRate,
      volume: settings.voiceVolume,
      voiceURI: settings.selectedVoiceURI,
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  };

  const notifySaved = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-5 pb-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Companion Settings</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </h2>
          <p className="text-xs text-pink-200/70">
            Personalize your connection with {settings.assistantNickname}
          </p>
        </div>
        {savedSuccess && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 animate-in fade-in">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      {/* Profile & Nicknames Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-3.5 backdrop-blur-md shadow-lg">
        <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span>Names & Identity</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-medium">
              What should Zero Two call you?
            </label>
            <input
              type="text"
              value={settings.userNickname}
              onChange={(e) => {
                onUpdateSettings({ userNickname: e.target.value });
                notifySaved();
              }}
              placeholder="e.g. Darling, Hiro, Senpai"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-pink-500/30 text-sm text-pink-100 focus:outline-none focus:border-pink-500"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Default is "Darling" — she calls you this naturally and occasionally.
            </p>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-medium">
              Assistant's Name
            </label>
            <input
              type="text"
              value={settings.assistantNickname}
              onChange={(e) => {
                onUpdateSettings({ assistantNickname: e.target.value });
                notifySaved();
              }}
              placeholder="e.g. Zero Two, 002"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-pink-500/30 text-sm text-pink-100 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Partner Memory Management Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-3.5 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-pink-400" />
            <span>Partner Memory Book</span>
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
            {settings.memories.length} saved
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Zero Two stores your shared preferences, favorite topics, and relationship moments locally.
        </p>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium text-white">Auto-Prompt for Memories</p>
            <p className="text-xs text-zinc-400">Ask permission when you share personal facts</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ autoDetectMemories: !settings.autoDetectMemories });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.autoDetectMemories ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.autoDetectMemories ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => {
            playSound.click(settings.soundEffectsEnabled);
            onOpenMemoryModal();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-xs font-bold text-pink-200 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Brain className="w-4 h-4 text-pink-400" />
          <span>Open & Manage Partner Memories</span>
        </button>
      </div>

      {/* Voice & Speech Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-4 backdrop-blur-md shadow-lg">
        <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Voice & Audio Tuning</span>
        </h3>

        {/* Master Voice Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Enable Voice Responses</p>
            <p className="text-xs text-zinc-400">Speak AI replies aloud</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ voiceEnabled: !settings.voiceEnabled });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.voiceEnabled ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.voiceEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto-Speak toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Auto-Speak In Chat</p>
            <p className="text-xs text-zinc-400">Automatically speak incoming messages</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ autoSpeak: !settings.autoSpeak });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.autoSpeak ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.autoSpeak ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Voice Selector */}
        {voices.length > 0 && (
          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-medium">
              Synthesized Voice
            </label>
            <select
              value={settings.selectedVoiceURI}
              onChange={(e) => {
                onUpdateSettings({ selectedVoiceURI: e.target.value });
                notifySaved();
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-pink-500/30 text-xs text-pink-100 focus:outline-none focus:border-pink-500"
            >
              <option value="">Default (Natural Voice)</option>
              {voices.map((v, i) => (
                <option key={i} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Volume Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-300">Speech Volume</span>
            <span className="text-pink-300 font-mono">{Math.round(settings.voiceVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.voiceVolume}
            onChange={(e) => {
              onUpdateSettings({ voiceVolume: parseFloat(e.target.value) });
            }}
            onMouseUp={notifySaved}
            onTouchEnd={notifySaved}
            className="w-full accent-pink-500 cursor-pointer"
          />
        </div>

        {/* Pitch Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-300">Voice Pitch</span>
            <span className="text-pink-300 font-mono">{settings.voicePitch.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.6"
            step="0.05"
            value={settings.voicePitch}
            onChange={(e) => {
              onUpdateSettings({ voicePitch: parseFloat(e.target.value) });
            }}
            onMouseUp={notifySaved}
            onTouchEnd={notifySaved}
            className="w-full accent-pink-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Deeper</span>
            <span>Higher (Anime)</span>
          </div>
        </div>

        {/* Rate Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-300">Speech Speed</span>
            <span className="text-pink-300 font-mono">{settings.voiceRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.05"
            value={settings.voiceRate}
            onChange={(e) => {
              onUpdateSettings({ voiceRate: parseFloat(e.target.value) });
            }}
            onMouseUp={notifySaved}
            onTouchEnd={notifySaved}
            className="w-full accent-pink-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Relaxed</span>
            <span>Energetic</span>
          </div>
        </div>

        {/* Test Voice Button */}
        <button
          onClick={handleTestVoice}
          className="w-full py-2 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-xs font-semibold text-pink-300 flex items-center justify-center gap-1.5 transition-all"
        >
          {isTestingVoice ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>{isTestingVoice ? 'Stop Testing Voice' : 'Test Voice Audio'}</span>
        </button>
      </div>

      {/* Visual & Animation Performance Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-3.5 backdrop-blur-md shadow-lg">
        <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Animations & Performance</span>
        </h3>

        {/* Master Avatar Animations Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Avatar Animations</p>
            <p className="text-xs text-zinc-400">Blinking, breathing & mouth movements</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ animationsEnabled: !settings.animationsEnabled });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.animationsEnabled ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.animationsEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Avatar Style Mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Avatar Style</p>
            <p className="text-xs text-zinc-400">Animated Vector vs Illustrated Art</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({
                avatarMode: settings.avatarMode === 'animated' ? 'illustrated' : 'animated',
              });
              notifySaved();
            }}
            className="px-3 py-1 rounded-xl bg-pink-500/20 border border-pink-500/30 text-xs font-semibold text-pink-300 transition-all"
          >
            {settings.avatarMode === 'animated' ? '✨ Animated Vector' : '🎨 Illustrated Art'}
          </button>
        </div>

        {/* Floating Sakura Petals */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sakura Petals Effect</p>
            <p className="text-xs text-zinc-400">Drifting anime petals in background</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ particlesEnabled: !settings.particlesEnabled });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.particlesEnabled ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.particlesEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Horn Glow Effect */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Demon Horns Glow</p>
            <p className="text-xs text-zinc-400">Pulsing red resonance on avatar</p>
          </div>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ hornGlowEnabled: !settings.hornGlowEnabled });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.hornGlowEnabled ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.hornGlowEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sound Effects */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">UI Sound Effects</p>
            <p className="text-xs text-zinc-400">Anime clicks, chimes, and blush sweeps</p>
          </div>
          <button
            onClick={() => {
              const next = !settings.soundEffectsEnabled;
              playSound.click(next);
              onUpdateSettings({ soundEffectsEnabled: next });
              notifySaved();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
              settings.soundEffectsEnabled ? 'bg-pink-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform ${
                settings.soundEffectsEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Memory & History Management */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 space-y-3 backdrop-blur-md shadow-lg">
        <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Data & Memory</span>
        </h3>

        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span>Saved Messages:</span>
          <span className="font-mono text-pink-300">{messageCount}</span>
        </div>

        <button
          onClick={() => {
            playSound.click(settings.soundEffectsEnabled);
            if (confirm('Clear all conversation history with Zero Two?')) {
              onClearHistory();
            }
          }}
          disabled={messageCount === 0}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat History</span>
        </button>

        <button
          onClick={() => {
            playSound.click(settings.soundEffectsEnabled);
            if (confirm('Reset all settings and partner memories to default?')) {
              onResetSettings();
            }
          }}
          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Settings to Default</span>
        </button>
      </div>

      {/* About & Mobile Notice */}
      <div className="text-center text-[11px] text-zinc-500 space-y-1">
        <p>Zero Two AI • Mobile Companion App</p>
        <p>Powered by Google Gemini 3.8 Flash with Google Search Grounding</p>
      </div>
    </div>
  );
};
