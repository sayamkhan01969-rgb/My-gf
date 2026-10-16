import React, { useState } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Compass,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Flame,
  Smile,
  Zap,
} from 'lucide-react';
import {
  CameraAngle,
  EmotionType,
  RoomEnvironmentType,
  AppSettings,
  ChatMessage,
} from '../types';
import { VirtualRoomCanvas } from './three/VirtualRoomCanvas';
import { playSound } from '../utils/soundEffects';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  VoiceRecognitionManager,
} from '../utils/speech';

interface VirtualRoomViewProps {
  emotion: EmotionType;
  onEmotionChange: (emotion: EmotionType) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSendMessage: (text: string, useSearch: boolean) => Promise<string | null | void>;
  isLoading: boolean;
  messages: ChatMessage[];
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const VirtualRoomView: React.FC<VirtualRoomViewProps> = ({
  emotion,
  onEmotionChange,
  settings,
  onUpdateSettings,
  onSendMessage,
  isLoading,
  messages,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [roomSpokenLine, setRoomSpokenLine] = useState<string>(
    `"Welcome to my room, ${settings.userNickname}! Isn't it cozy in here? Come closer! 🌸"`
  );

  const handleSpeak = (text: string, newEmotion?: EmotionType) => {
    if (newEmotion) {
      onEmotionChange(newEmotion);
    }
    setRoomSpokenLine(text);

    if (settings.voiceEnabled) {
      setIsSpeaking(true);
      speakText(text, {
        pitch: settings.voicePitch,
        rate: settings.voiceRate,
        volume: settings.voiceVolume,
        voiceURI: settings.selectedVoiceURI,
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleCharacterTap = () => {
    const quotes = [
      `Hey! Did you just poke me, ${settings.userNickname}? 😈 You're bold today!`,
      `Hehe, you know you can look as much as you want, Darling~ 🌸`,
      `Ah! My horns are sensitive, remember? Careful! ✨`,
      `I'm right here with you. What do you want to do next? 💕`,
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    handleSpeak(quote, 'teasing');
  };

  const handleSendQuickMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    playSound.click(settings.soundEffectsEnabled);

    const reply = await onSendMessage(text, false);
    if (reply) {
      setRoomSpokenLine(reply);
      if (settings.voiceEnabled) {
        setIsSpeaking(true);
        speakText(reply, {
          pitch: settings.voicePitch,
          rate: settings.voiceRate,
          volume: settings.voiceVolume,
          voiceURI: settings.selectedVoiceURI,
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    }
  };

  const lastAiMessage = messages.filter((m) => m.role === 'model').slice(-1)[0];

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0a0512]">
      {/* 3D WebGL Virtual Room Canvas */}
      <VirtualRoomCanvas
        emotion={emotion}
        isSpeaking={isSpeaking}
        environmentType={settings.roomEnvironment}
        cameraAngle={settings.cameraAngle}
        lowPerformanceMode={settings.lowPerformanceMode}
        onCharacterTap={handleCharacterTap}
        soundEnabled={settings.soundEffectsEnabled}
      />

      {/* Top Floating HUD: Environment & Camera Selector (Collapsible & Touch Friendly) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
        {/* Environment Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-pink-500/30 pointer-events-auto shadow-lg">
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ roomEnvironment: 'bedroom' });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              settings.roomEnvironment === 'bedroom'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🌸 Bedroom
          </button>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ roomEnvironment: 'cyber' });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              settings.roomEnvironment === 'cyber'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚡ Cyber
          </button>
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onUpdateSettings({ roomEnvironment: 'garden' });
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              settings.roomEnvironment === 'garden'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🍃 Garden
          </button>
        </div>

        {/* Camera Angle Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-pink-500/30 pointer-events-auto shadow-lg">
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              const angles: CameraAngle[] = ['portrait', 'upper', 'full'];
              const next = angles[(angles.indexOf(settings.cameraAngle) + 1) % angles.length];
              onUpdateSettings({ cameraAngle: next });
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/10 text-pink-200 hover:bg-white/20 transition-all"
            title="Switch Camera View Angle"
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span className="capitalize">{settings.cameraAngle}</span>
          </button>
        </div>
      </div>

      {/* Floating Speech Bubble with Audio Controls */}
      <div className="absolute top-14 left-3 right-3 max-w-md mx-auto pointer-events-auto z-10">
        <div className="p-3 bg-slate-950/85 backdrop-blur-md border border-pink-500/35 rounded-2xl shadow-xl flex items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-bold text-pink-400">
                {settings.assistantNickname}
              </span>
              {isSpeaking && (
                <span className="text-[10px] px-1.5 py-0.2 bg-pink-500/30 text-pink-200 rounded-md animate-pulse">
                  Speaking
                </span>
              )}
            </div>
            <p className="text-xs text-pink-100 font-medium italic truncate">
              {roomSpokenLine}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleSpeak(roomSpokenLine)}
              title="Repeat speech"
              className="p-1.5 rounded-full hover:bg-white/10 text-pink-300 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            {isSpeaking && (
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsSpeaking(false);
                }}
                title="Stop speech"
                className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-400 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Touch Interaction Prompt Hint (Centering Help) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <span className="text-[11px] bg-black/60 backdrop-blur-sm text-zinc-400 px-3 py-1 rounded-full border border-white/10">
          Drag to rotate • Tap Zero Two to interact
        </span>
      </div>

      {/* Bottom Unified Control Dock: Quick Actions & Mini Chat Drawer */}
      <div className="absolute bottom-2 left-2 right-2 max-w-lg mx-auto pointer-events-auto z-20 space-y-1.5">
        {/* Quick Gesture Reaction Buttons */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-pink-500/30 shadow-lg overflow-x-auto">
          <button
            onClick={() => handleSpeak(`"Yahoo~! Looking good, Darling!"`, 'happy')}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-all shrink-0"
          >
            Wave 👋
          </button>
          <button
            onClick={() => handleSpeak(`"Hehe, what are you looking at so intensely? 😉"`, 'teasing')}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all shrink-0"
          >
            Tease 😈
          </button>
          <button
            onClick={() => handleSpeak(`"Don't stare at me like that... it makes my cheeks warm! 😳"`, 'shy')}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all shrink-0"
          >
            Shy 💕
          </button>
          <button
            onClick={() => handleSpeak(`"Hmm... let me analyze that thought, Darling..."`, 'thinking')}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all shrink-0"
          >
            Think 🤔
          </button>

          {/* Toggle Mini Chat Sheet */}
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              setIsChatSheetOpen(!isChatSheetOpen);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              isChatSheetOpen
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white/10 text-pink-200 hover:bg-white/20'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {isChatSheetOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Mini Chat Sheet Overlay */}
        {isChatSheetOpen && (
          <div className="p-3 bg-slate-950/95 backdrop-blur-xl border border-pink-500/40 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-pink-300">Live 3D Room Chat</span>
              <button
                onClick={() => setIsChatSheetOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Input Bar */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-pink-500/30 rounded-2xl p-1.5 focus-within:border-pink-500">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendQuickMessage();
                }}
                placeholder={`Ask ${settings.assistantNickname} anything...`}
                className="flex-1 bg-transparent text-xs text-white px-2 focus:outline-none placeholder-zinc-500"
              />
              <button
                onClick={handleSendQuickMessage}
                disabled={!inputText.trim() || isLoading}
                className="p-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
