import React, { useState, useEffect, useRef } from 'react';
import { EmotionType } from '../types';

interface AnimatedAnimeAvatarProps {
  emotion: EmotionType;
  isSpeaking: boolean;
  animationsEnabled?: boolean;
  hornGlowEnabled?: boolean;
  onTap?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const AnimatedAnimeAvatar: React.FC<AnimatedAnimeAvatarProps> = ({
  emotion = 'neutral',
  isSpeaking = false,
  animationsEnabled = true,
  hornGlowEnabled = true,
  onTap,
  className = '',
  size = 'md',
}) => {
  // Blinking cycle for natural idle animation
  const [isBlinking, setIsBlinking] = useState(false);
  // Talking mouth frame (0: closed, 1: semi-open, 2: wide-open, 3: round-O)
  const [mouthFrame, setMouthFrame] = useState<number>(0);

  // Natural irregular blinking
  useEffect(() => {
    if (!animationsEnabled) return;
    let blinkTimer: any;

    const scheduleNextBlink = () => {
      // Blink every 3.5 to 5.5 seconds
      const delay = 3500 + Math.random() * 2000;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 180); // 180ms blink duration
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimer);
  }, [animationsEnabled]);

  // Talking mouth animation loop
  useEffect(() => {
    if (!isSpeaking || !animationsEnabled) {
      setMouthFrame(0);
      return;
    }

    const mouthSequence = [1, 2, 0, 3, 2, 1, 3, 0];
    let step = 0;
    const interval = setInterval(() => {
      setMouthFrame(mouthSequence[step % mouthSequence.length]);
      step++;
    }, 125);

    return () => {
      clearInterval(interval);
      setMouthFrame(0);
    };
  }, [isSpeaking, animationsEnabled]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-48 h-48',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    full: 'w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 max-w-full',
  };

  // Determine eye geometry based on emotion & blinking
  const renderLeftEye = () => {
    // Teasing: Left eye playfully winks!
    if (emotion === 'teasing') {
      return (
        <g id="left-eye-wink">
          {/* Closed playful wink arc with eyelashes */}
          <path
            d="M 66 114 Q 80 126 94 116"
            fill="none"
            stroke="#1a1120"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 90 118 L 96 114"
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 82 124 L 84 128"
            fill="none"
            stroke="#1a1120"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Happy: joyful curved eyes
    if (emotion === 'happy') {
      return (
        <g id="left-eye-happy">
          <path
            d="M 64 115 Q 80 98 96 115"
            fill="none"
            stroke="#1a1120"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Zero Two signature red eyeliner flick */}
          <path
            d="M 94 112 Q 98 108 101 106"
            fill="none"
            stroke="#e11d48"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Natural blinking state
    if (isBlinking) {
      return (
        <g id="left-eye-blinking">
          <path
            d="M 66 113 Q 80 119 94 113"
            fill="none"
            stroke="#1a1120"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Thinking: glance upward
    const irisOffsetY = emotion === 'thinking' ? -5 : emotion === 'shy' ? 3 : 0;
    const irisOffsetX = emotion === 'thinking' ? -2 : 0;
    const irisScale = emotion === 'surprised' ? 1.15 : emotion === 'sad' ? 0.95 : 1;

    return (
      <g id="left-eye-open">
        {/* Eye sclera / white */}
        <path
          d="M 64 113 Q 80 97 96 113 Q 80 127 64 113 Z"
          fill="#ffffff"
          stroke="#1a1120"
          strokeWidth="1.5"
        />
        {/* Upper eyelid contour with thick anime liner */}
        <path
          d="M 62 113 Q 80 95 98 111"
          fill="none"
          stroke="#1a1120"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        {/* Signature Red eyeliner wing */}
        <path
          d="M 94 110 Q 99 106 102 105"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Clip path for iris */}
        <clipPath id="left-eye-clip">
          <path d="M 64 113 Q 80 97 96 113 Q 80 127 64 113 Z" />
        </clipPath>
        <g clipPath="url(#left-eye-clip)">
          {/* Emerald Green Iris */}
          <g
            transform={`translate(${irisOffsetX}, ${irisOffsetY})`}
            className="transition-transform duration-200"
          >
            <ellipse
              cx="80"
              cy="113"
              rx={9 * irisScale}
              ry={11 * irisScale}
              fill="url(#emerald-iris)"
            />
            {/* Dark pupil */}
            <ellipse
              cx="80"
              cy="113"
              rx={4.5 * irisScale}
              ry={6 * irisScale}
              fill="#062e15"
            />
            {/* Sparkle highlights */}
            <circle cx="77" cy="109" r="3" fill="#ffffff" />
            <circle cx="83" cy="116" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        </g>
        {/* Lower eyelid line */}
        <path
          d="M 70 122 Q 80 125 90 122"
          fill="none"
          stroke="#704353"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    );
  };

  const renderRightEye = () => {
    // Happy: joyful curved eyes
    if (emotion === 'happy') {
      return (
        <g id="right-eye-happy">
          <path
            d="M 104 115 Q 120 98 136 115"
            fill="none"
            stroke="#1a1120"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Zero Two signature red eyeliner flick */}
          <path
            d="M 134 112 Q 138 108 141 106"
            fill="none"
            stroke="#e11d48"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Natural blinking
    if (isBlinking && emotion !== 'teasing') {
      return (
        <g id="right-eye-blinking">
          <path
            d="M 106 113 Q 120 119 134 113"
            fill="none"
            stroke="#1a1120"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    const irisOffsetY = emotion === 'thinking' ? -5 : emotion === 'shy' ? 3 : 0;
    const irisOffsetX = emotion === 'thinking' ? -2 : 0;
    const irisScale = emotion === 'surprised' ? 1.15 : emotion === 'sad' ? 0.95 : 1;

    return (
      <g id="right-eye-open">
        {/* Eye sclera / white */}
        <path
          d="M 104 113 Q 120 97 136 113 Q 120 127 104 113 Z"
          fill="#ffffff"
          stroke="#1a1120"
          strokeWidth="1.5"
        />
        {/* Upper eyelid with anime liner */}
        <path
          d="M 102 111 Q 120 95 138 113"
          fill="none"
          stroke="#1a1120"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        {/* Signature Red eyeliner wing */}
        <path
          d="M 134 110 Q 139 106 142 105"
          fill="none"
          stroke="#e11d48"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Clip path for right iris */}
        <clipPath id="right-eye-clip">
          <path d="M 104 113 Q 120 97 136 113 Q 120 127 104 113 Z" />
        </clipPath>
        <g clipPath="url(#right-eye-clip)">
          <g
            transform={`translate(${irisOffsetX}, ${irisOffsetY})`}
            className="transition-transform duration-200"
          >
            <ellipse
              cx="120"
              cy="113"
              rx={9 * irisScale}
              ry={11 * irisScale}
              fill="url(#emerald-iris)"
            />
            <ellipse
              cx="120"
              cy="113"
              rx={4.5 * irisScale}
              ry={6 * irisScale}
              fill="#062e15"
            />
            <circle cx="117" cy="109" r="3" fill="#ffffff" />
            <circle cx="123" cy="116" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        </g>
        {/* Lower eyelid */}
        <path
          d="M 110 122 Q 120 125 130 122"
          fill="none"
          stroke="#704353"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    );
  };

  // Render eyebrows based on emotion
  const renderEyebrows = () => {
    if (emotion === 'thinking') {
      return (
        <g id="eyebrows-thinking">
          {/* Left brow slightly furrowed/tilted */}
          <path
            d="M 66 98 Q 80 92 94 95"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right brow raised higher */}
          <path
            d="M 106 93 Q 120 87 134 93"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (emotion === 'surprised') {
      return (
        <g id="eyebrows-surprised">
          <path
            d="M 64 92 Q 80 84 94 91"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 106 91 Q 120 84 136 92"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (emotion === 'sad') {
      return (
        <g id="eyebrows-sad">
          <path
            d="M 66 94 Q 80 97 94 100"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 106 100 Q 120 97 134 94"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (emotion === 'teasing') {
      return (
        <g id="eyebrows-teasing">
          <path
            d="M 66 96 Q 80 91 94 96"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 106 93 Q 120 88 134 94"
            fill="none"
            stroke="#d84877"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Default confident / relaxed eyebrows
    return (
      <g id="eyebrows-default">
        <path
          d="M 66 96 Q 80 91 94 96"
          fill="none"
          stroke="#d84877"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 106 96 Q 120 91 134 96"
          fill="none"
          stroke="#d84877"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    );
  };

  // Render mouth shapes with talking sync
  const renderMouth = () => {
    // If speaking, cycle mouth shapes to simulate active speech
    if (isSpeaking) {
      if (mouthFrame === 1) {
        // Semi-open mouth
        return (
          <path
            d="M 92 142 Q 100 148 108 142 Q 100 144 92 142 Z"
            fill="#801b33"
            stroke="#2b1118"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        );
      }
      if (mouthFrame === 2) {
        // Wide open animated speech mouth
        return (
          <g id="talking-wide">
            <path
              d="M 90 140 Q 100 137 110 140 Q 100 152 90 140 Z"
              fill="#9e2040"
              stroke="#2b1118"
              strokeWidth="2"
            />
            {/* Cute white teeth line */}
            <path d="M 94 140 Q 100 141 106 140" stroke="#ffffff" strokeWidth="1.8" />
            {/* Tongue */}
            <path d="M 96 147 Q 100 145 104 147" fill="#ff70a6" />
          </g>
        );
      }
      if (mouthFrame === 3) {
        // Round O speech mouth
        return (
          <ellipse
            cx="100"
            cy="143"
            rx="4.5"
            ry="6"
            fill="#801b33"
            stroke="#2b1118"
            strokeWidth="1.8"
          />
        );
      }
      // Frame 0: closed line
      return (
        <path
          d="M 93 142 Q 100 144 107 142"
          fill="none"
          stroke="#2b1118"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }

    // Static emotion mouth shapes when NOT speaking
    if (emotion === 'happy') {
      return (
        <g id="mouth-happy">
          <path
            d="M 90 140 Q 100 151 110 140 Q 100 142 90 140 Z"
            fill="#d6336c"
            stroke="#2b1118"
            strokeWidth="2"
          />
          <path d="M 94 141 Q 100 142 106 141" stroke="#ffffff" strokeWidth="1.6" />
        </g>
      );
    }

    if (emotion === 'surprised') {
      return (
        <ellipse
          cx="100"
          cy="144"
          rx="5"
          ry="7.5"
          fill="#801b33"
          stroke="#2b1118"
          strokeWidth="2"
        />
      );
    }

    if (emotion === 'teasing') {
      return (
        <g id="mouth-teasing">
          {/* Sassy charming anime smirk */}
          <path
            d="M 92 143 Q 102 145 109 139"
            fill="none"
            stroke="#2b1118"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Subtle fang/smirk corner accent */}
          <path d="M 108 139 L 109 141" stroke="#e11d48" strokeWidth="1.5" />
        </g>
      );
    }

    if (emotion === 'sad') {
      return (
        <path
          d="M 93 145 Q 100 141 107 145"
          fill="none"
          stroke="#2b1118"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }

    if (emotion === 'shy') {
      return (
        <path
          d="M 94 142 Q 100 145 106 142"
          fill="none"
          stroke="#2b1118"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }

    if (emotion === 'thinking') {
      return (
        <path
          d="M 94 143 L 105 142"
          fill="none"
          stroke="#2b1118"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }

    // Neutral default: confident small smirk
    return (
      <path
        d="M 93 142 Q 100 145 107 141"
        fill="none"
        stroke="#2b1118"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    );
  };

  const isBlushingState = emotion === 'shy' || emotion === 'surprised';

  return (
    <div
      onClick={onTap}
      className={`relative select-none ${sizeClasses[size]} ${className} ${
        animationsEnabled ? 'cursor-pointer' : ''
      }`}
    >
      {/* Speaking Glow Aura */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full bg-pink-500/25 blur-xl pointer-events-none animate-pulse" />
      )}

      {/* SVG Anime Vector Character */}
      <svg
        viewBox="0 0 200 240"
        className={`w-full h-full drop-shadow-2xl overflow-visible ${
          animationsEnabled ? 'animate-breathe' : ''
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Emerald Eyes Gradient */}
          <linearGradient id="emerald-iris" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="60%" stopColor="#00a844" />
            <stop offset="100%" stopColor="#004d1a" />
          </linearGradient>

          {/* Pink Hair Gradient */}
          <linearGradient id="pink-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb3cc" />
            <stop offset="50%" stopColor="#ff70a6" />
            <stop offset="100%" stopColor="#e63973" />
          </linearGradient>

          {/* Horn Red Glow Gradient */}
          <linearGradient id="horn-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff3366" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#990026" />
          </linearGradient>

          {/* Skin Gradient */}
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5f0" />
            <stop offset="100%" stopColor="#fed7c8" />
          </linearGradient>

          {/* Pilot Uniform Gradient */}
          <linearGradient id="uniform" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#21152d" />
            <stop offset="100%" stopColor="#110a17" />
          </linearGradient>

          {/* Horn Glow Filter */}
          <filter id="horn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation={hornGlowEnabled ? '4' : '1'}
              floodColor="#ff0055"
              floodOpacity={hornGlowEnabled ? '0.85' : '0.3'}
            />
          </filter>
        </defs>

        {/* Back Hair Volume */}
        <g id="back-hair">
          <path
            d="M 40 80 Q 20 160 35 225 Q 55 240 70 215 Q 45 160 55 90 Z"
            fill="url(#pink-hair)"
            opacity="0.95"
          />
          <path
            d="M 160 80 Q 180 160 165 225 Q 145 240 130 215 Q 155 160 145 90 Z"
            fill="url(#pink-hair)"
            opacity="0.95"
          />
          <path
            d="M 45 60 Q 100 20 155 60 Q 185 140 170 230 Q 100 240 30 230 Q 15 140 45 60 Z"
            fill="#d84877"
          />
        </g>

        {/* Body & Futuristic Pilot Uniform */}
        <g id="body">
          {/* Slender neck */}
          <path d="M 88 155 L 88 185 L 112 185 L 112 155 Z" fill="#fcd0c2" />
          {/* Neck shadow under chin */}
          <path d="M 88 155 Q 100 166 112 155 L 112 165 Q 100 172 88 165 Z" fill="#f0b5a3" />

          {/* High Pilot Collar with Crimson Trim */}
          <path
            d="M 72 180 L 88 170 L 112 170 L 128 180 L 132 240 L 68 240 Z"
            fill="url(#uniform)"
          />
          {/* Collar Red Accents */}
          <path
            d="M 88 170 L 88 200 L 96 200 L 96 172 Z"
            fill="#e11d48"
          />
          <path
            d="M 112 170 L 112 200 L 104 200 L 104 172 Z"
            fill="#e11d48"
          />
          {/* Center Zipper / Tech Line */}
          <line x1="100" y1="172" x2="100" y2="240" stroke="#00f0ff" strokeWidth="1.8" />
          {/* Unit 02 Insignia Plate on Shoulder */}
          <rect x="73" y="198" width="16" height="8" rx="2" fill="#2d152a" stroke="#e11d48" strokeWidth="1" />
          <text x="75" y="204" fontSize="5" fill="#ffffff" fontWeight="bold" fontFamily="monospace">02</text>
        </g>

        {/* Head / Face Base */}
        <g id="face-base">
          {/* Head contour */}
          <path
            d="M 54 85 Q 52 135 78 155 Q 100 168 122 155 Q 148 135 146 85 Q 140 45 100 45 Q 60 45 54 85 Z"
            fill="url(#skin)"
          />

          {/* Cute Anime Ears */}
          <ellipse cx="53" cy="116" rx="4.5" ry="8" fill="#fcd0c2" />
          <ellipse cx="147" cy="116" rx="4.5" ry="8" fill="#fcd0c2" />

          {/* Cheeks Blush */}
          <g id="blush">
            <ellipse
              cx="70"
              cy="126"
              rx={isBlushingState ? '10' : '7'}
              ry={isBlushingState ? '5' : '3.5'}
              fill="#ff5983"
              opacity={isBlushingState ? '0.75' : '0.4'}
              className="transition-all duration-300"
            />
            <ellipse
              cx="130"
              cy="126"
              rx={isBlushingState ? '10' : '7'}
              ry={isBlushingState ? '5' : '3.5'}
              fill="#ff5983"
              opacity={isBlushingState ? '0.75' : '0.4'}
              className="transition-all duration-300"
            />
          </g>

          {/* Cute subtle anime nose */}
          <circle cx="100" cy="132" r="1.2" fill="#ba687f" />

          {/* Eyebrows */}
          {renderEyebrows()}

          {/* Eyes */}
          {renderLeftEye()}
          {renderRightEye()}

          {/* Mouth */}
          {renderMouth()}
        </g>

        {/* Headband & Iconic Red Demon Horns */}
        <g id="horns-headband">
          {/* White Futuristic Headband */}
          <path
            d="M 56 68 Q 100 52 144 68 Q 143 62 100 47 Q 57 62 56 68 Z"
            fill="#ffffff"
            stroke="#1a1120"
            strokeWidth="1.2"
          />

          {/* Left Horn */}
          <path
            d="M 68 62 Q 62 42 63 26 Q 73 38 77 59 Z"
            fill="url(#horn-glow)"
            filter="url(#horn-filter)"
          />
          <path
            d="M 69 61 Q 65 42 66 30"
            stroke="#ff8da1"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Right Horn */}
          <path
            d="M 132 62 Q 138 42 137 26 Q 127 38 123 59 Z"
            fill="url(#horn-glow)"
            filter="url(#horn-filter)"
          />
          <path
            d="M 131 61 Q 135 42 134 30"
            stroke="#ff8da1"
            strokeWidth="1.2"
            fill="none"
          />
        </g>

        {/* Front Layer: Bangs and Side Hair Strands */}
        <g id="front-hair">
          {/* Left long side hair strand */}
          <path
            d="M 56 70 Q 42 120 48 180 Q 56 182 58 170 Q 52 125 64 85 Z"
            fill="url(#pink-hair)"
          />

          {/* Right long side hair strand */}
          <path
            d="M 144 70 Q 158 120 152 180 Q 144 182 142 170 Q 148 125 136 85 Z"
            fill="url(#pink-hair)"
          />

          {/* Center Bangs */}
          <path
            d="M 58 66 Q 80 50 100 50 Q 120 50 142 66 Q 128 85 116 88 Q 110 82 104 90 Q 98 82 90 88 Q 74 85 58 66 Z"
            fill="url(#pink-hair)"
          />

          {/* Forehead fringe wisps */}
          <path d="M 82 72 Q 88 95 92 88" fill="#e63973" />
          <path d="M 98 72 Q 102 96 106 88" fill="#e63973" />
          <path d="M 112 72 Q 116 93 120 86" fill="#e63973" />

          {/* Hair Gloss Highlight Halo */}
          <path
            d="M 68 62 Q 100 48 132 62"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      </svg>
    </div>
  );
};
