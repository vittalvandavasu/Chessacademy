import React from 'react';

export interface ChessCadetLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  badgeText?: string;
}

export const ChessCadetLogo: React.FC<ChessCadetLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  badgeText,
}) => {
  const config = {
    xs: { mark: 22, textTitle: 'text-sm', textSubtitle: 'text-[8px]', starSize: 6 },
    sm: { mark: 28, textTitle: 'text-base', textSubtitle: 'text-[9px]', starSize: 8 },
    md: { mark: 36, textTitle: 'text-xl', textSubtitle: 'text-[10px]', starSize: 10 },
    lg: { mark: 48, textTitle: 'text-2xl', textSubtitle: 'text-xs', starSize: 12 },
    xl: { mark: 64, textTitle: 'text-3xl', textSubtitle: 'text-sm', starSize: 16 },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Emblem: Geometric Grandmaster Knight + Cadet Compass Star */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: config.mark, height: config.mark }}
      >
        {/* Soft Ambient Halo */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-amber-500/20 rounded-xl blur-[3px]" />

        {/* Master Emblem SVG */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Obsidian Shield Gradient */}
            <linearGradient id="shieldBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Regal Emerald & Mint Gradient */}
            <linearGradient id="knightEmeraldGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Luxury Champagne Gold Star Gradient */}
            <linearGradient id="cadetStarGold" x1="18" y1="14" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Subtle Metallic Bevel */}
            <linearGradient id="shieldRim" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* Exterior Rounded Shield Plaque */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#shieldBgGrad)"
            stroke="url(#shieldRim)"
            strokeWidth="1.5"
          />

          {/* Inner Precision Inset Rim */}
          <rect
            x="4.5"
            y="4.5"
            width="39"
            height="39"
            rx="9.5"
            fill="none"
            stroke="#10B981"
            strokeWidth="0.75"
            strokeOpacity="0.35"
          />

          {/* Tactical Knight Base / Plinth */}
          <path
            d="M 12 37 C 12 35 14 34 17 34 L 31 34 C 34 34 36 35 36 37 C 36 38 34.5 38.5 32 38.5 L 16 38.5 C 13.5 38.5 12 38 12 37 Z"
            fill="url(#knightEmeraldGrad)"
          />

          {/* Sculpted Geometric Knight Body & Arched Neck */}
          <path
            d="M 14.5 34 C 15 30 16.5 26.5 18 24 C 15.5 23 13 20 12.5 17 C 12 13.5 13.5 12 15 12 C 15.5 12 16.2 12.8 16.8 13.8 C 17.8 11.2 20.5 9 24 8.5 C 25.2 7 27.2 6.2 28.5 6.8 C 29 7.2 28.8 8.5 28.2 9.5 C 30.8 10.2 33 12.2 34 15 C 35 18 34.2 21.5 32 24 C 30.5 26.5 32 30 33 34 Z"
            fill="url(#knightEmeraldGrad)"
          />

          {/* Snout & Nostril Facet Cut */}
          <path
            d="M 12.5 17 C 13.5 18 15.5 18.5 18 18 C 19 18 19.5 17 18.8 16 C 18 15 16.5 14.5 15 14"
            fill="#34D399"
            opacity="0.9"
          />

          {/* Alert Diamond Eye of Strategy */}
          <polygon
            points="21,13.5 22.8,12 22,15"
            fill="#F8FAFC"
          />

          {/* Mane Grooves */}
          <path
            d="M 26 11 C 27.5 13 27.2 15.5 26.2 17"
            stroke="#064E3B"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 29.5 15 C 30.8 17.2 30.2 19.8 29 21.5"
            stroke="#064E3B"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* The Cadet Star of Excellence & Direction (8-point Gold Compass Star) */}
          {/* Main 4 points */}
          <path
            d="M 24.5 20 L 25.8 23.2 L 29 24.5 L 25.8 25.8 L 24.5 29 L 23.2 25.8 L 20 24.5 L 23.2 23.2 Z"
            fill="url(#cadetStarGold)"
          />
          {/* Subtle diagonal micro-points */}
          <polygon
            points="24.5,22.5 25.8,23.2 26.5,24.5 25.8,25.8 24.5,26.5 23.2,25.8 22.5,24.5 23.2,23.2"
            fill="#FEF08A"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Typographic Lockup */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 leading-none">
            <span
              className={`font-black tracking-tight text-white font-display ${config.textTitle}`}
            >
              Chess<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Cadet</span>
            </span>

            {badgeText && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {badgeText}
              </span>
            )}
          </div>

          <span
            className={`font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5 ${config.textSubtitle}`}
          >
            Tactical Academy
          </span>
        </div>
      )}
    </div>
  );
};
