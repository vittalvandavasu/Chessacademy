import React from 'react';

export interface ChessCadetLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  badgeText?: string;
  variant?: 'full' | 'monogram' | 'compact';
}

/**
 * ChessCadet Master Brand Mark & Identity System
 * Designed with Swiss modernist discipline, mathematical proportions, and classical academic heraldry.
 * Features the Architectural Knight of Strategic Calculation integrated with the Cadet Guiding Star.
 */
export const ChessCadetLogo: React.FC<ChessCadetLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
  badgeText,
  variant = 'full',
}) => {
  const sizeMap = {
    xs: { mark: 24, title: 'text-sm', sub: 'text-[8.5px]', gap: 'gap-2' },
    sm: { mark: 32, title: 'text-base', sub: 'text-[9.5px]', gap: 'gap-2.5' },
    md: { mark: 40, title: 'text-lg', sub: 'text-[10px]', gap: 'gap-3' },
    lg: { mark: 50, title: 'text-xl', sub: 'text-[11px]', gap: 'gap-3.5' },
    xl: { mark: 64, title: 'text-2xl', sub: 'text-xs', gap: 'gap-4' },
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeMap.gap} select-none ${className}`}>
      {/* Precision Vector Emblem (64x64 Master Coordinate Grid) */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 transition-transform duration-200"
        style={{ width: sizeMap.mark, height: sizeMap.mark }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_1px_2px_rgba(23,23,23,0.08)]"
          aria-label="ChessCadet Crest"
        >
          {/* Base Plaque: Architectural Octagonal Seal in Deep Academy Green */}
          <path
            d="M 18 4 L 46 4 L 60 18 L 60 46 L 46 60 L 18 60 L 4 46 L 4 18 Z"
            fill="#315C45"
            stroke="#171717"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Inset Precision Filigree: Muted Brass Academic Thread */}
          <path
            d="M 20 7.5 L 44 7.5 L 56.5 20 L 56.5 44 L 44 56.5 L 20 56.5 L 7.5 44 L 7.5 20 Z"
            fill="none"
            stroke="#C7A45D"
            strokeWidth="1"
            strokeOpacity="0.85"
            strokeLinejoin="round"
          />

          {/* Pedestal: Stepped Tournament Plinth */}
          <path
            d="M 17 50.5 L 47 50.5 L 49 53.5 L 15 53.5 Z"
            fill="#F5F1E8"
          />
          <path
            d="M 19 47.5 L 45 47.5 L 46.5 50.5 L 17.5 50.5 Z"
            fill="#F5F1E8"
            opacity="0.95"
          />

          {/* The Grandmaster Knight: Architectural, Chiseled Lateral Silhouette */}
          <path
            d="M 19 47.5
               C 19.5 43.5 21 38 23 34
               C 19.5 32.5 17 28.5 16.5 25
               C 16 21 18 19 20 19
               C 21.2 19 22 20.2 22.8 21.5
               C 23.5 17.5 27 13.5 32 13
               C 33.5 11 36 9.5 38 10
               C 39 10.5 38.8 12.5 37.8 14.5
               C 42 16 45.5 19.5 46.5 24
               C 47.5 28.5 46 34.5 42.5 38.5
               C 41 40 42.5 44 43.5 47.5
               Z"
            fill="#F5F1E8"
          />

          {/* Mane Articulation: 3 Geometric Facet Channels (The 3 Stages of Calculation) */}
          <path
            d="M 29.5 16 C 31.5 18 34.5 20.5 38 21"
            stroke="#315C45"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 32 23 C 34.5 25 37.5 27 41 27.5"
            stroke="#315C45"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 34.5 30 C 37 31.5 39.5 33 42 33.5"
            stroke="#315C45"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Eye of Strategic Focus: Diamond Cartouche */}
          <path
            d="M 25 22.5 L 26.5 24 L 25 25.5 L 23.5 24 Z"
            fill="#315C45"
          />

          {/* Muzzle & Jaw Inset: Chiseled Classical Plane */}
          <path
            d="M 18.5 24 L 21 27 L 23 25.5"
            stroke="#315C45"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The Cadet Guiding Star: Emblem of Guidance & Scholarly Rank */}
          <g transform="translate(31, 37)">
            {/* 4-Point Compass Rose */}
            <path
              d="M 0 -6 L 1.6 -1.6 L 6 0 L 1.6 1.6 L 0 6 L -1.6 1.6 L -6 0 L -1.6 -1.6 Z"
              fill="#C7A45D"
            />
            {/* Center Core Radiance */}
            <circle cx="0" cy="0" r="1.2" fill="#315C45" />
          </g>

          {/* Micro Geometric Corner Registration Points (Swiss Typographic Grid) */}
          <circle cx="18" cy="4" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="46" cy="4" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="60" cy="18" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="60" cy="46" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="46" cy="60" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="18" cy="60" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="4" cy="46" r="0.8" fill="#C7A45D" opacity="0.7" />
          <circle cx="4" cy="18" r="0.8" fill="#C7A45D" opacity="0.7" />
        </svg>
      </div>

      {/* Typographic Lockup: Classical High-Contrast Serif & Swiss Modern Sans */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-1.5 leading-none">
            {/* Pure Classical Display Display Typography */}
            <span
              className={`font-bold font-display text-[#171717] tracking-tight ${sizeMap.title}`}
            >
              Chess<span className="text-[#315C45] font-semibold">Cadet</span>
            </span>

            {/* Optional Classical Cadet Mark Badge */}
            {badgeText && (
              <span className="text-[9px] uppercase font-mono font-semibold tracking-widest px-1.5 py-0.5 border border-[#D5D0C5] bg-[#E8E3D8] text-[#315C45] rounded-xs">
                {badgeText}
              </span>
            )}
          </div>

          {/* Editorial Subline: Strict Letterspaced Typography */}
          <span
            className={`font-semibold uppercase tracking-[0.24em] text-[#171717]/65 mt-1 font-sans ${sizeMap.sub}`}
          >
            Digital Chess Academy
          </span>
        </div>
      )}
    </div>
  );
};
