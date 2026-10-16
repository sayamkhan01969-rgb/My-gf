import React, { useMemo } from 'react';

interface SakuraBackgroundProps {
  enabled: boolean;
}

export const SakuraBackground: React.FC<SakuraBackgroundProps> = ({ enabled }) => {
  const petals = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${(i * 5.8) % 100}%`,
      animationDuration: `${7 + (i % 6) * 2}s`,
      animationDelay: `${(i * 0.7) % 6}s`,
      size: `${10 + (i % 4) * 4}px`,
      opacity: 0.25 + (i % 5) * 0.12,
      rotation: (i * 37) % 360,
    }));
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle neon gradient orbs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-pink-600/15 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full bg-purple-700/15 blur-3xl" />

      {/* Floating Sakura Petals */}
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="sakura-petal absolute"
          style={{
            left: petal.left,
            top: '-20px',
            width: petal.size,
            height: petal.size,
            opacity: petal.opacity,
            animation: `sakuraFall ${petal.animationDuration} linear infinite`,
            animationDelay: petal.animationDelay,
            transform: `rotate(${petal.rotation}deg)`,
          }}
        >
          <svg
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_0_6px_rgba(255,105,180,0.6)]"
          >
            <path
              d="M15 2C15 2 24 9 24 18C24 23 20 27 15 27C10 27 6 23 6 18C6 9 15 2 15 2Z"
              fill="url(#petalGradient)"
            />
            <defs>
              <linearGradient id="petalGradient" x1="6" y1="2" x2="24" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff70a6" />
                <stop offset="1" stopColor="#ff2a85" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
};
