import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { EmotionType, AppSettings, ChatMessage } from '../types';
import { AVATAR_EMOTIONS } from '../assets/avatarRegistry';
import { playSound } from '../utils/soundEffects';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  VoiceRecognitionManager,
} from '../utils/speech';
import { AnimatedAnimeAvatar } from './AnimatedAnimeAvatar';

interface LiveVoiceViewProps {
  onSendMessage: (text: string, useSearch: boolean) => Promise<string | null>;
  emotion: EmotionType;
  onEmotionChange: (emotion: EmotionType) => void;
  settings: AppSettings;
}

export const LiveVoiceView: React.FC<LiveVoiceViewProps> = ({
  onSendMessage,
  emotion,
  onEmotionChange,
  settings,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [lastZeroTwoReply, setLastZeroTwoReply] = useState<string>(
    `"I'm listening, ${settings.userNickname}. Tap the button to speak with me directly!"`
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoListenAfterSpeaking, setAutoListenAfterSpeaking] = useState(false);

  const recognitionRef = useRef<VoiceRecognitionManager | null>(null);
  const speechSynthSupported = isSpeechSynthesisSupported();
  const speechRecogSupported = isSpeechRecognitionSupported();

  // Initialize Speech Recognition
  useEffect(() => {
    if (speechRecogSupported) {
      recognitionRef.current = new VoiceRecognitionManager(
        (transcript, isFinal) => {
          setTranscription(transcript);
          if (isFinal) {
            handleUserSpokeFinal(transcript);
          }
        },
        (error) => {
          setIsListening(false);
          setErrorMessage(error);
          playSound.click(settings.soundEffectsEnabled);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  }, [speechRecogSupported, settings.soundEffectsEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const handleUserSpokeFinal = async (text: string) => {
    if (!text.trim()) {
      setIsListening(false);
      return;
    }

    setIsListening(false);
    setIsThinking(true);
    playSound.chime(settings.soundEffectsEnabled);

    try {
      const reply = await onSendMessage(text, false);
      setIsThinking(false);

      if (reply) {
        setLastZeroTwoReply(reply);
        if (settings.voiceEnabled) {
          setIsSpeaking(true);
          speakText(reply, {
            pitch: settings.voicePitch,
            rate: settings.voiceRate,
            volume: settings.voiceVolume,
            voiceURI: settings.selectedVoiceURI,
            onEnd: () => {
              setIsSpeaking(false);
              // In hands-free mode, start listening again
              if (autoListenAfterSpeaking && isCallActive) {
                setTimeout(() => {
                  startListening();
                }, 800);
              }
            },
            onError: () => {
              setIsSpeaking(false);
            },
          });
        }
      }
    } catch (err: any) {
      setIsThinking(false);
      setErrorMessage(err?.message || 'Failed to communicate with Zero Two.');
    }
  };

  const startListening = () => {
    if (!speechRecogSupported) {
      setErrorMessage(
        'Speech recognition is not supported on this browser. On Android phones, Google Chrome is recommended.'
      );
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    setErrorMessage(null);
    setTranscription('');

    playSound.click(settings.soundEffectsEnabled);
    const started = recognitionRef.current?.start();
    if (started) {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleToggleCall = () => {
    playSound.click(settings.soundEffectsEnabled);
    if (isCallActive) {
      setIsCallActive(false);
      stopListening();
      stopSpeaking();
      setIsSpeaking(false);
      setIsThinking(false);
    } else {
      setIsCallActive(true);
      setErrorMessage(null);
      // Greet partner
      const greeting = `Comm Link open, ${settings.userNickname}! What do you want to talk about right now? 🌸`;
      setLastZeroTwoReply(greeting);
      onEmotionChange('happy');
      playSound.success(settings.soundEffectsEnabled);

      if (settings.voiceEnabled) {
        setIsSpeaking(true);
        speakText(greeting, {
          pitch: settings.voicePitch,
          rate: settings.voiceRate,
          volume: settings.voiceVolume,
          voiceURI: settings.selectedVoiceURI,
          onEnd: () => {
            setIsSpeaking(false);
          },
        });
      }
    }
  };

  const emotionData = AVATAR_EMOTIONS[emotion] || AVATAR_EMOTIONS.neutral;

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-md mx-auto w-full px-4 py-3 select-none overflow-y-auto">
      {/* Top Status Banner */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pink-500/30 shadow-lg">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${
              isCallActive ? 'text-pink-400 animate-pulse' : 'text-zinc-500'
            }`}
          />
          <span className="text-xs font-semibold text-pink-200">
            {isCallActive ? 'Comm Link Active' : 'Comm Link Standby'}
          </span>
        </div>

        {/* Hands-free mode switch */}
        {isCallActive && (
          <button
            onClick={() => {
              playSound.click(settings.soundEffectsEnabled);
              setAutoListenAfterSpeaking(!autoListenAfterSpeaking);
            }}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
              autoListenAfterSpeaking
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                : 'bg-white/5 text-zinc-400 border border-white/10'
            }`}
          >
            {autoListenAfterSpeaking ? 'Auto-Listen: ON' : 'Push-to-Talk'}
          </button>
        )}
      </div>

      {/* Diagnostics / Error Bar */}
      {(!speechRecogSupported || errorMessage) && (
        <div className="w-full mt-2 p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            {!speechRecogSupported ? (
              <p>
                Speech Recognition is not available on this browser. On Android phones, please open this app in <strong>Google Chrome</strong> for microphone speech recognition.
              </p>
            ) : (
              <p>{errorMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Central Holographic Avatar with Concentric Audio Waves */}
      <div className="my-auto py-4 flex flex-col items-center relative">
        {/* Pulsing Concentric Aura */}
        {(isSpeaking || isListening) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-72 h-72 rounded-full border border-pink-500/20 animate-ping ${
                isListening ? 'border-rose-500/40' : 'border-pink-500/30'
              }`}
            />
            <div
              className={`w-64 h-64 rounded-full border border-pink-400/30 animate-pulse`}
            />
          </div>
        )}

        <div
          className={`relative w-52 h-52 sm:w-60 sm:h-60 rounded-full p-2 transition-all duration-300 bg-slate-950 flex items-center justify-center ${
            isListening
              ? 'ring-4 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)]'
              : isSpeaking
              ? 'ring-4 ring-pink-500 shadow-[0_0_35px_rgba(255,59,129,0.6)]'
              : 'ring-2 ring-pink-500/30'
          }`}
        >
          {settings.avatarMode === 'animated' ? (
            <AnimatedAnimeAvatar
              emotion={emotion}
              isSpeaking={isSpeaking}
              animationsEnabled={settings.animationsEnabled}
              hornGlowEnabled={settings.hornGlowEnabled}
              size="lg"
            />
          ) : (
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-pink-400/50">
              <img
                src={emotionData.image}
                alt="Zero Two"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Glowing Status Dot */}
          <span
            className={`absolute bottom-3 right-3 w-5 h-5 rounded-full border-2 border-slate-950 ${
              isListening
                ? 'bg-rose-500 animate-ping'
                : isSpeaking
                ? 'bg-pink-400 animate-bounce'
                : isCallActive
                ? 'bg-emerald-400'
                : 'bg-zinc-600'
            }`}
          />
        </div>

        {/* Live Conversation State Indicator */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-pink-500/30 text-xs font-semibold text-pink-200">
          {isThinking ? (
            <span className="flex items-center gap-1.5 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Zero Two is thinking...
            </span>
          ) : isListening ? (
            <span className="flex items-center gap-1.5 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening to {settings.userNickname}...
            </span>
          ) : isSpeaking ? (
            <span className="flex items-center gap-1.5 text-pink-300">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
              Zero Two is speaking...
            </span>
          ) : isCallActive ? (
            <span className="text-zinc-300">Tap microphone to speak</span>
          ) : (
            <span className="text-zinc-400">Call not connected</span>
          )}
        </div>

        {/* Live Subtitle Transcript Bubble */}
        <div className="mt-3 w-full max-w-sm px-4 py-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-pink-500/30 shadow-lg text-center min-h-[70px] flex items-center justify-center">
          {transcription ? (
            <p className="text-xs text-rose-200 font-mono italic">
              "{transcription}"
            </p>
          ) : (
            <p className="text-xs text-pink-100 font-medium italic leading-relaxed">
              {lastZeroTwoReply}
            </p>
          )}
        </div>
      </div>

      {/* Voice Controls Deck */}
      <div className="w-full mt-2 space-y-3">
        {isCallActive ? (
          <div className="flex items-center justify-center gap-4">
            {/* Microphone Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isThinking}
              className={`p-4 rounded-full shadow-xl transition-all duration-200 active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/50 scale-105'
                  : 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-pink-600/40 hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleToggleCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-all active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={handleToggleCall}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-600/40 transition-all active:scale-95 flex items-center justify-center gap-2.5"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Connect Voice Call with Zero Two</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-2 text-center">
              <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Browser speech recognition & Gemini conversational TTS loop</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
