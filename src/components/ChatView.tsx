import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Trash2,
  ExternalLink,
  Brain,
  AlertCircle,
  RefreshCw,
  BookmarkCheck,
  Check,
  X,
} from 'lucide-react';
import {
  ChatMessage,
  GroundingSource,
  EmotionType,
  AppSettings,
  MemoryCategory,
  CompanionMemory,
} from '../types';
import { AVATAR_EMOTIONS } from '../assets/avatarRegistry';
import { playSound } from '../utils/soundEffects';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  VoiceRecognitionManager,
} from '../utils/speech';
import { AnimatedAnimeAvatar } from './AnimatedAnimeAvatar';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, useSearch: boolean) => Promise<string | null | void>;
  isLoading: boolean;
  onClearHistory: () => void;
  settings: AppSettings;
  activeEmotion: EmotionType;
  onEmotionChange: (emotion: EmotionType) => void;
  onOpenMemoryModal: () => void;
  onSaveSuggestedMemory: (category: MemoryCategory, content: string) => void;
  isSpeaking: boolean;
}

const STARTER_PROMPTS = [
  'How was your day, Zero Two? 🌸',
  'I had a super long day... cheer me up a little? 💕',
  'Can we talk about our favorite anime? 🎮',
  'What is your favorite memory of us so far? ✨',
  'Tease me a bit, Darling~ 😉',
  'Help me understand how neural networks work 💻',
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearHistory,
  settings,
  activeEmotion,
  onEmotionChange,
  onOpenMemoryModal,
  onSaveSuggestedMemory,
  isSpeaking,
}) => {
  const [inputText, setInputText] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Pending memory suggestion to request user permission
  const [pendingMemoryNotice, setPendingMemoryNotice] = useState<{
    category: MemoryCategory;
    content: string;
    msgId: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<VoiceRecognitionManager | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check last message for memory suggestions
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'model' && last.suggestedMemory && settings.autoDetectMemories) {
        setPendingMemoryNotice({
          category: last.suggestedMemory.category,
          content: last.suggestedMemory.content,
          msgId: last.id,
        });
      }
    }
  }, [messages, settings.autoDetectMemories]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      recognitionRef.current = new VoiceRecognitionManager(
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            playSound.chime(settings.soundEffectsEnabled);
          }
        },
        (errMsg) => {
          setIsListening(false);
          setVoiceError(errMsg);
          setTimeout(() => setVoiceError(null), 5000);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  }, [settings.soundEffectsEnabled]);

  const handleToggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError(
        'Voice recognition is not supported in this browser. Please try Chrome on Android.'
      );
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      playSound.click(settings.soundEffectsEnabled);
      stopSpeaking();
      setCurrentlySpeakingId(null);
      const started = recognitionRef.current?.start();
      if (started) {
        setIsListening(true);
      }
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    playSound.click(settings.soundEffectsEnabled);
    await onSendMessage(text, useSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (currentlySpeakingId === msg.id) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
      return;
    }

    stopSpeaking();
    setCurrentlySpeakingId(msg.id);
    if (msg.emotion) {
      onEmotionChange(msg.emotion);
    }

    speakText(msg.content, {
      pitch: settings.voicePitch,
      rate: settings.voiceRate,
      volume: settings.voiceVolume,
      voiceURI: settings.selectedVoiceURI,
      onEnd: () => {
        setCurrentlySpeakingId(null);
      },
      onError: () => {
        setCurrentlySpeakingId(null);
      },
    });
  };

  const handleAcceptMemory = () => {
    if (!pendingMemoryNotice) return;
    playSound.success(settings.soundEffectsEnabled);
    onSaveSuggestedMemory(pendingMemoryNotice.category, pendingMemoryNotice.content);
    setPendingMemoryNotice(null);
  };

  const handleDismissMemory = () => {
    playSound.click(settings.soundEffectsEnabled);
    setPendingMemoryNotice(null);
  };

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const emotionData = AVATAR_EMOTIONS[activeEmotion] || AVATAR_EMOTIONS.neutral;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full relative">
      {/* Header bar with companion live mini-avatar & memory button */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70 backdrop-blur-md border-b border-pink-500/20 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-pink-500/60 shadow-md shadow-pink-600/30 bg-slate-950 flex items-center justify-center">
            {settings.avatarMode === 'animated' ? (
              <AnimatedAnimeAvatar
                emotion={activeEmotion}
                isSpeaking={isSpeaking || Boolean(currentlySpeakingId)}
                animationsEnabled={settings.animationsEnabled}
                hornGlowEnabled={settings.hornGlowEnabled}
                size="sm"
              />
            ) : (
              <img
                src={emotionData.image}
                alt="Zero Two Avatar"
                className="w-full h-full object-cover"
              />
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold tracking-wide text-white">
                {settings.assistantNickname}
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-pink-500/20 text-pink-300 font-mono border border-pink-500/30">
                002
              </span>
            </div>
            <p className="text-[11px] text-pink-300/80 font-medium">
              Partner of {settings.userNickname} • {emotionData.label} {emotionData.emoji}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Memory Book Button */}
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              onOpenMemoryModal();
            }}
            title="View Partner Memories"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-950/40 hover:bg-pink-900/50 text-pink-300 border border-pink-500/30 transition-all shadow-sm active:scale-95"
          >
            <Brain className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Memories</span>
            <span className="text-[10px] bg-pink-500/30 px-1 rounded-full font-mono">
              {settings.memories.length}
            </span>
          </button>

          {/* Grounding Search Quick Toggle */}
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              setUseSearch(!useSearch);
            }}
            title={useSearch ? 'Google Search Grounding Active' : 'Enable Google Search'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              useSearch
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-zinc-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Clear history button */}
          {messages.length > 0 && (
            <button
              onClick={() => {
                playSound.click(settings.soundEffectsEnabled);
                onClearHistory();
              }}
              title="Clear conversation"
              className="p-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Recognition Error Alert */}
      {voiceError && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Permission Request Banner: Ask to save personal detail to memory */}
      {pendingMemoryNotice && (
        <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-pink-950/90 to-purple-950/90 border border-pink-500/40 flex items-center justify-between gap-3 text-xs text-pink-100 shadow-lg animate-in slide-in-from-top-2 duration-200 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookmarkCheck className="w-4 h-4 text-pink-400 shrink-0" />
            <p className="truncate text-[11px] sm:text-xs">
              <span className="font-semibold text-pink-300">Remember this?</span> "
              {pendingMemoryNotice.content}"
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAcceptMemory}
              className="flex items-center gap-1 px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              onClick={handleDismissMemory}
              className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[340px] text-center px-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-pink-500/40 shadow-xl shadow-pink-500/20 mb-3 bg-slate-950 flex items-center justify-center">
              {settings.avatarMode === 'animated' ? (
                <AnimatedAnimeAvatar
                  emotion="happy"
                  isSpeaking={false}
                  animationsEnabled={settings.animationsEnabled}
                  hornGlowEnabled={settings.hornGlowEnabled}
                  size="md"
                />
              ) : (
                <img
                  src={emotionData.image}
                  alt="Zero Two"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Hey there, {settings.userNickname}! 🌸
            </h3>
            <p className="text-xs text-pink-200/70 max-w-sm mb-5 leading-relaxed">
              I'm {settings.assistantNickname}. I'm here by your side as your companion—whether you want to chat about your day, talk anime & gaming, need study help, or just want to laugh. How are you doing today?
            </p>

            <div className="w-full max-w-md space-y-2">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-left">
                Start our conversation:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playSound.click(settings.soundEffectsEnabled);
                      onSendMessage(prompt, useSearch);
                    }}
                    className="text-left text-xs bg-pink-950/40 hover:bg-pink-900/50 text-pink-200 border border-pink-500/30 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const msgEmotion = msg.emotion ? AVATAR_EMOTIONS[msg.emotion] : null;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="shrink-0 mb-1 w-8 h-8 rounded-full overflow-hidden border border-pink-500/50 shadow-sm bg-slate-950 flex items-center justify-center">
                    {settings.avatarMode === 'animated' ? (
                      <AnimatedAnimeAvatar
                        emotion={msg.emotion || 'neutral'}
                        isSpeaking={currentlySpeakingId === msg.id}
                        animationsEnabled={settings.animationsEnabled}
                        size="sm"
                      />
                    ) : (
                      <img
                        src={msgEmotion ? msgEmotion.image : emotionData.image}
                        alt="Zero Two"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-br from-pink-600 to-rose-600 text-white rounded-br-xs'
                      : 'bg-slate-900/90 text-zinc-100 border border-pink-500/30 rounded-bl-xs backdrop-blur-md'
                  }`}
                >
                  {/* Emotion badge for AI message */}
                  {!isUser && msgEmotion && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-pink-300">
                      <span>{msgEmotion.emoji}</span>
                      <span>{msgEmotion.label}</span>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>

                  {/* Search Notice if live search was at capacity */}
                  {msg.searchNotice && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Search className="w-3 h-3 shrink-0" />
                      <span>{msg.searchNotice}</span>
                    </div>
                  )}

                  {/* Web Search Grounding Sources */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-pink-500/20 text-xs">
                      <div className="flex items-center gap-1 text-cyan-300 font-semibold mb-1">
                        <Search className="w-3 h-3" />
                        <span>Sources from Google Search:</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {msg.groundingSources.slice(0, 3).map((source, i) => (
                          <a
                            key={i}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-cyan-200/90 hover:text-cyan-100 hover:underline truncate"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{source.title || source.uri}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with timestamp and TTS play button */}
                  <div
                    className={`mt-1.5 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-pink-200/80' : 'text-zinc-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => handleSpeakMessage(msg)}
                        title={
                          currentlySpeakingId === msg.id
                            ? 'Stop reading'
                            : 'Read aloud'
                        }
                        className="ml-3 p-1 rounded-full hover:bg-pink-500/20 text-pink-300 transition-colors"
                      >
                        {currentlySpeakingId === msg.id ? (
                          <span className="flex items-center gap-1 text-rose-400 font-medium">
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-pink-300">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="shrink-0 mb-1 w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-sm font-bold text-xs">
                    {settings.userNickname.charAt(0).toUpperCase() || 'D'}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-end justify-start">
            <div className="shrink-0 mb-1 w-8 h-8 rounded-full overflow-hidden border border-purple-500/50 bg-slate-950 flex items-center justify-center">
              <AnimatedAnimeAvatar
                emotion="thinking"
                isSpeaking={false}
                animationsEnabled={settings.animationsEnabled}
                size="sm"
              />
            </div>
            <div className="bg-slate-900/90 text-zinc-100 border border-purple-500/30 rounded-2xl rounded-bl-xs p-3.5 backdrop-blur-md shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              <span className="text-xs text-pink-200">
                {settings.assistantNickname} is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - mobile ergonomic */}
      <div className="p-3 bg-slate-950/80 backdrop-blur-lg border-t border-pink-500/20">
        {/* Search mode badge if active */}
        {useSearch && (
          <div className="flex items-center justify-between mb-2 px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Search className="w-3 h-3 text-cyan-400" />
              Google Search grounding enabled
            </span>
            <button
              onClick={() => setUseSearch(false)}
              className="text-cyan-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Listening alert overlay */}
        {isListening && (
          <div className="mb-2 p-2 bg-pink-900/40 border border-pink-500/50 rounded-xl flex items-center justify-between text-xs text-pink-200 animate-pulse">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Listening to {settings.userNickname}... Speak now!
            </span>
            <button
              onClick={handleToggleListening}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[11px] font-bold"
            >
              Done
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-slate-900/90 border border-pink-500/30 rounded-2xl p-1.5 focus-within:border-pink-500/70 transition-all shadow-inner">
          {/* Microphone speech recognition button */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={isListening ? 'Stop listening' : 'Speak message'}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/50'
                : 'text-zinc-400 hover:text-pink-300 hover:bg-white/5 active:scale-95'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleAutoResize}
            onKeyDown={handleKeyDown}
            placeholder={`Talk with ${settings.assistantNickname}...`}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none max-h-32 py-2 leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              inputText.trim() && !isLoading
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/40 active:scale-95'
                : 'text-zinc-600 bg-white/5 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-pink-300" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
