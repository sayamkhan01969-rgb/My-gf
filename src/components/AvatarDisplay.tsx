import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AVATAR_EMOTIONS,
  QUICK_TOUCH_REACTIONS,
} from '../assets/avatarRegistry';
import { EmotionType } from '../types';
import { playSound } from '../utils/soundEffects';
import { AnimatedAnimeAvatar } from './AnimatedAnimeAvatar';

interface AvatarDisplayProps {
  emotion: EmotionType;
  onEmotionChange?: (emotion: EmotionType) => void;
  isSpeaking?: boolean;
  onSpokenReaction?: (text: string) => void;
  interactive?: boolean;
  soundEnabled?: boolean;
  hornGlowEnabled?: boolean;
  animationsEnabled?: boolean;
  avatarMode?: 'animated' | 'illustrated';
  onModeToggle?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showControls?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  emotion,
  onEmotionChange,
  isSpeaking = false,
  onSpokenReaction,
  interactive = true,
  soundEnabled = true,
  hornGlowEnabled = true,
  animationsEnabled = true,
  avatarMode = 'animated',
  onModeToggle,
  size = 'md',
  showControls = false,
}) => {
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);
  const [isBlushing, setIsBlushing] = useState(false);
  const [hornActive, setHornActive] = useState(false);

  const currentEmotion = AVATAR_EMOTIONS[emotion] || AVATAR_EMOTIONS.neutral;

  const triggerReaction = (text: string) => {
    setTouchFeedback(text);
    if (onSpokenReaction) {
      onSpokenReaction(text);
    }
    setTimeout(() => {
      setTouchFeedback(null);
    }, 4500);
  };

  const handleGeneralTap = () => {
    if (!interactive) return;
    playSound.click(soundEnabled);
    const pool = QUICK_TOUCH_REACTIONS.randomPlayful;
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];

    const emotions: EmotionType[] = ['happy', 'teasing', 'shy', 'surprised'];
    const nextEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    if (onEmotionChange) onEmotionChange(nextEmotion);

    triggerReaction(randomQuote);
  };

  const handleHornTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    playSound.hornResonance(soundEnabled);
    setHornActive(true);
    setTimeout(() => setHornActive(false), 900);

    const quotes = QUICK_TOUCH_REACTIONS.horns;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    if (onEmotionChange) onEmotionChange('teasing');
    triggerReaction(randomQuote);
  };

  const handleCheekTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    playSound.blush(soundEnabled);
    setIsBlushing(true);
    setTimeout(() => setIsBlushing(false), 2000);

    const quotes = QUICK_TOUCH_REACTIONS.cheeks;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    if (onEmotionChange) onEmotionChange('shy');
    triggerReaction(randomQuote);
  };

  const handleHeadTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    playSound.success(soundEnabled);

    // Heart particles
    try {
      confetti({
        particleCount: 22,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#ff3b81', '#ff70a6', '#ff0055', '#ffffff'],
        shapes: ['circle'],
        scalar: 0.8,
      });
    } catch {}

    const quotes = QUICK_TOUCH_REACTIONS.head;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    if (onEmotionChange) onEmotionChange('happy');
    triggerReaction(randomQuote);
  };

  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-48 h-48',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    full: 'w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 max-w-full',
  };

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Avatar Container with glowing border and idle breathing */}
      <div
        onClick={handleGeneralTap}
        className={`relative ${containerSizes[size]} rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
          animationsEnabled ? 'animate-breathe' : ''
        } border-2 ${currentEmotion.borderColor} ${
          isSpeaking ? 'ring-4 ring-pink-500/50 shadow-[0_0_35px_rgba(255,59,129,0.7)]' : ''
        }`}
        style={{
          boxShadow: `0 0 35px ${currentEmotion.glowColor}, inset 0 0 20px rgba(0,0,0,0.6)`,
        }}
      >
        {avatarMode === 'animated' ? (
          /* High-Fidelity Vector Animated Anime Girl */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1c1228] to-[#0f0916] p-2">
            <AnimatedAnimeAvatar
              emotion={emotion}
              isSpeaking={isSpeaking}
              animationsEnabled={animationsEnabled}
              hornGlowEnabled={hornGlowEnabled || hornActive}
              size={size}
            />
          </div>
        ) : (
          /* Illustrated High-Res Art */
          <img
            src={currentEmotion.image}
            alt={`Zero Two (${currentEmotion.label})`}
            className="w-full h-full object-cover transition-opacity duration-300"
            draggable={false}
          />
        )}

        {/* Horn Glow Effect Overlay */}
        {hornGlowEnabled && (
          <div
            className={`absolute top-0 left-0 right-0 h-1/3 pointer-events-none transition-opacity duration-300 ${
              hornActive
                ? 'opacity-90 bg-gradient-to-b from-rose-500/40 to-transparent'
                : 'opacity-20 hover:opacity-40'
            }`}
          />
        )}

        {/* Blush Overlay on Cheeks */}
        {isBlushing && (
          <div className="absolute inset-0 pointer-events-none bg-rose-500/20 backdrop-blur-[0.5px] transition-opacity duration-300 animate-pulse" />
        )}

        {/* Speaking Audio Waveform Overlay */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-pink-500/50 shadow-md">
            <span className="w-1.5 h-3 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-5 bg-pink-300 rounded-full animate-bounce" />
            <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-3 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="text-xs font-semibold text-pink-300 ml-1">Speaking</span>
          </div>
        )}

        {/* Interactive Touch Overlay Zones */}
        {interactive && (
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {/* Horns Zone (Top 25%) */}
            <button
              onClick={handleHornTap}
              title="Tap horns"
              className="absolute top-0 left-0 right-0 h-1/4 cursor-pointer focus:outline-none group"
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-red-950/80 text-rose-300 px-2 py-0.5 rounded-full border border-red-500/40">
                  Tap Horns 😈
                </span>
              </div>
            </button>

            {/* Head Pet Zone (Upper Middle 30%) */}
            <button
              onClick={handleHeadTap}
              title="Pat head"
              className="absolute top-1/4 left-1/4 right-1/4 h-1/3 cursor-pointer focus:outline-none group"
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-pink-950/80 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/40">
                  Pat Head 🌸
                </span>
              </div>
            </button>

            {/* Cheeks Zone (Middle sides) */}
            <button
              onClick={handleCheekTap}
              title="Pinch cheek"
              className="absolute top-1/2 left-0 w-1/3 h-1/3 cursor-pointer focus:outline-none group"
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-pink-950/80 text-rose-300 px-1 py-0.5 rounded-full border border-pink-500/40">
                  Cheek 💕
                </span>
              </div>
            </button>
            <button
              onClick={handleCheekTap}
              title="Pinch cheek"
              className="absolute top-1/2 right-0 w-1/3 h-1/3 cursor-pointer focus:outline-none group"
            >
              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-pink-950/80 text-rose-300 px-1 py-0.5 rounded-full border border-pink-500/40">
                  Cheek 💕
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Reactive Speech Bubble when touched */}
      {touchFeedback && (
        <div className="mt-3 max-w-xs px-4 py-2 bg-pink-950/90 text-pink-100 rounded-2xl border border-pink-500/40 text-xs sm:text-sm text-center shadow-lg shadow-pink-950/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {touchFeedback}
        </div>
      )}

      {/* Mood status pill & Mode Toggle */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-pink-500/30 text-xs font-medium text-pink-200 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>
            {currentEmotion.emoji} {currentEmotion.label}
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 italic font-mono text-[11px]">
            {isSpeaking ? 'Talking...' : 'Listening'}
          </span>
        </div>

        {onModeToggle && (
          <button
            onClick={onModeToggle}
            className="px-2.5 py-1 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-[11px] font-semibold text-pink-300 transition-all"
            title="Toggle Animated SVG vs Illustrated Art"
          >
            {avatarMode === 'animated' ? '✨ Animated' : '🎨 Art Mode'}
          </button>
        )}
      </div>

      {/* Manual Expression Controls */}
      {showControls && onEmotionChange && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
          {(Object.keys(AVATAR_EMOTIONS) as EmotionType[]).map((key) => {
            const item = AVATAR_EMOTIONS[key];
            const isActive = emotion === key;
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  playSound.click(soundEnabled);
                  onEmotionChange(key);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 scale-105'
                    : 'text-zinc-400 hover:text-pink-300 hover:bg-white/5'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
