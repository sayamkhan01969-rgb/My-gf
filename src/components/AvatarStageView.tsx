import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Candy, Flame, Smile, Volume2, VolumeX, Moon, MessageCircle } from 'lucide-react';
import { EmotionType, AppSettings } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { AVATAR_EMOTIONS } from '../assets/avatarRegistry';
import { playSound } from '../utils/soundEffects';
import { speakText, stopSpeaking } from '../utils/speech';

interface AvatarStageViewProps {
  emotion: EmotionType;
  onEmotionChange: (emotion: EmotionType) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const AvatarStageView: React.FC<AvatarStageViewProps> = ({
  emotion,
  onEmotionChange,
  settings,
  onUpdateSettings,
}) => {
  const [currentLine, setCurrentLine] = useState<string>(
    `"Ready to take on the world together, ${settings.userNickname}? You're my one and only partner, you know! 🌸"`
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [candyCount, setCandyCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('zero_two_candy_count') || '3', 10);
  });
  const [syncRate, setSyncRate] = useState<number>(97.8);

  const speakLine = (text: string, newEmotion?: EmotionType) => {
    if (newEmotion) {
      onEmotionChange(newEmotion);
    }
    setCurrentLine(text);

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

  const handleGiveCandy = () => {
    const nextCount = candyCount + 1;
    setCandyCount(nextCount);
    localStorage.setItem('zero_two_candy_count', nextCount.toString());
    setSyncRate((prev) => Math.min(100, +(prev + 0.5).toFixed(1)));

    playSound.success(settings.soundEffectsEnabled);
    try {
      confetti({
        particleCount: 28,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#ff70a6', '#f43f5e', '#fbbf24', '#ffffff'],
      });
    } catch {}

    const lines = [
      `Mmm! Delicious sweet honey candy! You really know the quickest way to make me happy, ${settings.userNickname}! 🍭✨`,
      `Ah! So sweet! If you keep spoiling me with sweets like this, I might just never let you leave my side~ 🌸`,
      `Sugar and honey! Just like you when you're being your adorable self. Thank you! ❤️`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'happy');
  };

  const handleCompliment = () => {
    playSound.blush(settings.soundEffectsEnabled);
    setSyncRate((prev) => Math.min(100, +(prev + 0.3).toFixed(1)));
    const lines = [
      `W-what's with you suddenly saying something that sweet?! You're making me blush, ${settings.userNickname}! 😳💕`,
      `Hehe, hearing that directly from you makes my heart beat so fast... you really are my favorite person. 🌸`,
      `Stop looking at me with those warm eyes! It's not fair how easily you make me bashful! 💕`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'shy');
  };

  const handleTease = () => {
    playSound.click(settings.soundEffectsEnabled);
    const lines = [
      `What's that face, ${settings.userNickname}? You look like you're plotting something mischievous. You can't out-tease me! 😈`,
      `If you keep staring at my lips like that, I might just challenge you to a staring contest you definitely can't win! 😉`,
      `You get flustered so adorably fast! It's impossible not to tease you a little bit! ❤️`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'teasing');
  };

  const handlePepTalk = () => {
    playSound.chime(settings.soundEffectsEnabled);
    const lines = [
      `Hey, look at me. You're doing amazing, and I believe in you with everything I have. We'll conquer today together! 🔥`,
      `Whenever things feel heavy, remember you have me by your side. We're partners, and we don't back down from anything! ✨`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'neutral');
  };

  const handleGoodnight = () => {
    playSound.blush(settings.soundEffectsEnabled);
    const lines = [
      `Rest well tonight, ${settings.userNickname}. Sleep warm and dream of us flying through the stars together. Goodnight~ 🌙✨`,
      `You worked hard today. Turn off your screen soon and get some peaceful rest, okay? I'll be right here waiting for you tomorrow morning. 💤💕`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'happy');
  };

  const handleDeepQuestion = () => {
    playSound.click(settings.soundEffectsEnabled);
    const lines = [
      `Hey... tell me something real. What's a dream or passion you have that you don't talk about often? I really want to know more about you. 🤔`,
      `If we could jump into any anime world or adventure right now, where would you want to take me first? 🌸`,
    ];
    speakLine(lines[Math.floor(Math.random() * lines.length)], 'thinking');
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const emotionData = AVATAR_EMOTIONS[emotion] || AVATAR_EMOTIONS.neutral;

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-lg mx-auto w-full px-4 py-3 overflow-y-auto">
      {/* Header Sync Status */}
      <div className="w-full flex items-center justify-between bg-slate-900/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pink-500/25 mb-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
          <span className="text-xs font-semibold text-pink-200">
            Neural Sync: <span className="text-pink-400 font-mono">{syncRate}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Candy className="w-3.5 h-3.5 text-amber-400" />
          <span>Sweets: <strong className="text-white">{candyCount}</strong></span>
        </div>
      </div>

      {/* Main Avatar Stage Display */}
      <div className="my-auto py-2 flex flex-col items-center">
        <AvatarDisplay
          emotion={emotion}
          onEmotionChange={onEmotionChange}
          isSpeaking={isSpeaking}
          onSpokenReaction={(quote) => speakLine(quote)}
          interactive={true}
          soundEnabled={settings.soundEffectsEnabled}
          hornGlowEnabled={settings.hornGlowEnabled}
          animationsEnabled={settings.animationsEnabled}
          avatarMode={settings.avatarMode}
          onModeToggle={() => {
            playSound.click(settings.soundEffectsEnabled);
            onUpdateSettings({
              avatarMode: settings.avatarMode === 'animated' ? 'illustrated' : 'animated',
            });
          }}
          size="lg"
          showControls={true}
        />

        {/* Spoken Quote Bubble */}
        <div className="mt-4 w-full max-w-md p-3.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-pink-500/30 text-center shadow-xl relative">
          <p className="text-sm font-medium text-pink-100 italic leading-relaxed">
            {currentLine}
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2">
            <button
              onClick={() => speakLine(currentLine)}
              className="text-xs px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30 flex items-center gap-1 transition-all"
            >
              <Volume2 className="w-3 h-3" />
              <span>Voice</span>
            </button>
            {isSpeaking && (
              <button
                onClick={handleStopSpeech}
                className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1 transition-all"
              >
                <VolumeX className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Interaction Deck */}
      <div className="w-full mt-3 space-y-2">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
          Tap Zero Two or choose a partner action:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleGiveCandy}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-600/30 to-pink-600/30 hover:from-amber-600/40 hover:to-pink-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <Candy className="w-4 h-4 text-amber-400" />
            <span>Give Honey Candy</span>
          </button>

          <button
            onClick={handleCompliment}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-pink-600/30 to-rose-600/30 hover:from-pink-600/40 hover:to-rose-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Compliment Her</span>
          </button>

          <button
            onClick={handleTease}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-purple-600/30 to-rose-600/30 hover:from-purple-600/40 hover:to-rose-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <Smile className="w-4 h-4 text-pink-300" />
            <span>Ask for Teasing</span>
          </button>

          <button
            onClick={handlePepTalk}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-rose-600/30 to-cyan-600/30 hover:from-rose-600/40 hover:to-cyan-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Partner Pep Talk</span>
          </button>

          <button
            onClick={handleGoodnight}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <Moon className="w-4 h-4 text-indigo-300" />
            <span>Goodnight Message</span>
          </button>

          <button
            onClick={handleDeepQuestion}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-sky-600/30 to-pink-600/30 hover:from-sky-600/40 hover:to-pink-600/40 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-100 transition-all active:scale-95 shadow-md"
          >
            <MessageCircle className="w-4 h-4 text-sky-400" />
            <span>Ask Me a Question</span>
          </button>
        </div>
      </div>
    </div>
  );
};
