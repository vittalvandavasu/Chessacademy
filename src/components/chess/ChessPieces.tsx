import React from 'react';
import { PieceSymbol } from 'chess.js';

export type PieceType = PieceSymbol | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type PieceSet = 'neo' | 'staunton' | 'wood';

interface PieceProps {
  color: 'w' | 'b';
  className?: string;
  set?: PieceSet;
}

/**
 * World-Class Tournament & Chess.com-Grade Vector Chess Pieces
 * Meticulously crafted vector geometries with authentic FIDE & Neo proportions,
 * crisp outlines, weighted bases, and refined interior detail lines.
 */

// Colors for White & Black pieces across themes
const PIECE_THEME_COLORS = {
  neo: {
    w: {
      fill: '#FFFFFF',
      stroke: '#1F2937',
      innerLine: '#4B5563',
      shadow: '#E5E7EB',
      accent: '#9CA3AF',
    },
    b: {
      fill: '#262421',
      stroke: '#111827',
      innerLine: '#E5E7EB',
      shadow: '#1F2937',
      accent: '#D1D5DB',
    },
  },
  staunton: {
    w: {
      fill: '#FFFDF7',
      stroke: '#27272A',
      innerLine: '#52525B',
      shadow: '#E4E4E7',
      accent: '#A1A1AA',
    },
    b: {
      fill: '#18181B',
      stroke: '#09090B',
      innerLine: '#F4F4F5',
      shadow: '#27272A',
      accent: '#E4E4E7',
    },
  },
  wood: {
    w: {
      fill: '#FDF6E2',
      stroke: '#4A3319',
      innerLine: '#78542A',
      shadow: '#E6D3B1',
      accent: '#A67C4A',
    },
    b: {
      fill: '#3D2514',
      stroke: '#1F120A',
      innerLine: '#DEB887',
      shadow: '#2B1A0E',
      accent: '#D2A679',
    },
  },
};

// ==========================================
// PAWN PIECE
// ==========================================
export const PawnPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base Plinth */}
        <path d="M 11 39 C 11 36.5 13 36 15 36 L 30 36 C 32 36 34 36.5 34 39 C 34 40.5 32 41 29 41 L 16 41 C 13 41 11 40.5 11 39 Z" />

        {/* Stem Collar & Body */}
        <path d="M 15 36 C 16 29 17 25 17 22 L 28 22 C 28 25 29 29 30 36 Z" />

        {/* Torus Collar Ring */}
        <path d="M 15 22 C 15 20.8 17.5 19.5 22.5 19.5 C 27.5 19.5 30 20.8 30 22 Z" />

        {/* Spherical Head */}
        <circle cx="22.5" cy="12" r="6.5" />

        {/* Interior Accent Sheen for White / Crisp Highlight Line for Black */}
        {isWhite ? (
          <>
            <path
              d="M 19 9.5 C 20.5 8.2 23 8.2 24.5 9"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1.2"
              opacity="0.7"
            />
            <path
              d="M 15 38.5 L 30 38.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="0.8"
              opacity="0.5"
            />
          </>
        ) : (
          <>
            <path
              d="M 19 10 C 20.5 9 22.5 9 24 9.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1.2"
              opacity="0.85"
            />
            <path
              d="M 16 38 L 29 38"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1"
              opacity="0.85"
            />
            <path
              d="M 17 22 L 28 22"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="0.9"
              opacity="0.8"
            />
          </>
        )}
      </g>
    </svg>
  );
};

// ==========================================
// KNIGHT PIECE (The defining tournament piece!)
// ==========================================
export const KnightPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.38)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base */}
        <path d="M 11 39 C 11 36.5 13.5 36 16.5 36 L 29.5 36 C 32.5 36 35 36.5 35 39 C 35 40.5 33 41 30.5 41 L 15.5 41 C 13 41 11 40.5 11 39 Z" />

        {/* Sculpted Stallion Silhouette */}
        <path d="M 14 36 C 14.5 32 15.8 28 17.5 25.5 C 15 24.5 12.5 21 12 17.5 C 11.5 14 13 12.5 14.5 12.5 C 15.2 12.5 15.8 13.2 16.2 14.2 C 17.5 11.5 20.2 9 24 8.5 C 25.2 7 27.5 6 29 6.5 C 29.5 7 29.2 8.5 28.5 9.8 C 31.2 10.5 33.5 12.5 34.5 15.5 C 35.5 18.5 34.8 22.2 32.5 25 C 30.8 27.5 32.5 31.5 33.5 36 Z" />

        {/* Snout & Muzzle fold */}
        <path
          d="M 12 17.5 C 13 18.5 15 19 17.5 18.5 C 18.5 18.5 19 17.5 18.2 16.5 C 17.5 15.5 16 15 14.5 14.5"
          fill={c.fill}
        />

        {/* Eye */}
        <circle cx="21" cy="13.5" r="1.5" fill={isWhite ? c.stroke : c.innerLine} stroke="none" />

        {/* Nostril */}
        <circle cx="13.8" cy="17.8" r="0.8" fill={isWhite ? c.stroke : c.innerLine} stroke="none" />

        {/* Mane Tuft Accents */}
        <path
          d="M 26 11.5 C 27.8 13.5 27.5 16 26.5 17.5"
          fill="none"
          stroke={isWhite ? c.innerLine : c.innerLine}
          strokeWidth="1.3"
          opacity={isWhite ? 0.75 : 0.9}
        />
        <path
          d="M 29.5 15.5 C 31 18 30.5 21 29.2 22.8"
          fill="none"
          stroke={isWhite ? c.innerLine : c.innerLine}
          strokeWidth="1.3"
          opacity={isWhite ? 0.75 : 0.9}
        />
        <path
          d="M 18.5 28 C 17.5 31 17 34 16.5 36"
          fill="none"
          stroke={isWhite ? c.innerLine : c.innerLine}
          strokeWidth="1.1"
          opacity={isWhite ? 0.5 : 0.8}
        />
        <path
          d="M 15 38.5 L 31 38.5"
          fill="none"
          stroke={isWhite ? c.innerLine : c.innerLine}
          strokeWidth="0.9"
          opacity={isWhite ? 0.45 : 0.85}
        />
      </g>
    </svg>
  );
};

// ==========================================
// BISHOP PIECE
// ==========================================
export const BishopPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base */}
        <path d="M 11 39 C 11 36.5 13.5 36 16.5 36 L 28.5 36 C 31.5 36 34 36.5 34 39 C 34 40.5 32 41 29.5 41 L 15.5 41 C 13 41 11 40.5 11 39 Z" />

        {/* Stem */}
        <path d="M 15 36 C 16 31 17.5 27 18 24 L 27 24 C 27.5 27 29 31 30 36 Z" />

        {/* Collar Ring */}
        <path d="M 16 24 C 16 22.8 18.5 22 22.5 22 C 26.5 22 29 22.8 29 24 Z" />

        {/* Mitre Head */}
        <path d="M 16 22 C 14.2 18 15 13 18.5 9.5 C 20.5 7.5 22.5 6.5 22.5 6.5 C 22.5 6.5 24.5 7.5 26.5 9.5 C 30 13 30.8 18 29 22 Z" />

        {/* Crosslet Orb on Mitre */}
        <circle cx="22.5" cy="5.2" r="1.8" />

        {/* Iconic Diagonal Mitre Slit */}
        <path
          d="M 20.5 11 L 25 15 M 24.5 11.5 L 19.8 17.5"
          fill="none"
          stroke={isWhite ? c.stroke : c.innerLine}
          strokeWidth="1.4"
        />

        {/* Base highlight */}
        <path
          d="M 15 38.5 L 30 38.5"
          fill="none"
          stroke={isWhite ? c.innerLine : c.innerLine}
          strokeWidth="0.9"
          opacity={isWhite ? 0.45 : 0.85}
        />
      </g>
    </svg>
  );
};

// ==========================================
// ROOK PIECE (Castle)
// ==========================================
export const RookPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.35)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base */}
        <path d="M 10 39 C 10 36.5 13 36 16 36 L 29 36 C 32 36 35 36.5 35 39 C 35 40.5 33 41 30.5 41 L 14.5 41 C 12 41 10 40.5 10 39 Z" />

        {/* Sturdy Masonry Tower */}
        <path d="M 14.5 36 C 15 28 15.5 22 16 16.5 L 29 16.5 C 29.5 22 30 28 30.5 36 Z" />

        {/* Cornice Neck */}
        <path d="M 13 16.5 L 32 16.5 L 32.5 13.5 L 12.5 13.5 Z" />

        {/* 4 Crenels / 3 Battlements */}
        <path d="M 12 13.5 L 12 8 L 16.5 8 L 16.5 11 L 20 11 L 20 8 L 25 8 L 25 11 L 28.5 11 L 28.5 8 L 33 8 L 33 13.5 Z" />

        {/* Interior Detailing */}
        {isWhite ? (
          <>
            <line
              x1="17"
              y1="23"
              x2="28"
              y2="23"
              stroke={c.innerLine}
              strokeWidth="0.8"
              opacity="0.4"
            />
            <path
              d="M 14.5 38.5 L 30.5 38.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="0.9"
              opacity="0.5"
            />
          </>
        ) : (
          <>
            <line
              x1="16"
              y1="16.5"
              x2="29"
              y2="16.5"
              stroke={c.innerLine}
              strokeWidth="1.1"
              opacity="0.85"
            />
            <line
              x1="17"
              y1="25"
              x2="28"
              y2="25"
              stroke={c.innerLine}
              strokeWidth="0.9"
              opacity="0.75"
            />
            <path
              d="M 14 38.5 L 31 38.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1"
              opacity="0.85"
            />
          </>
        )}
      </g>
    </svg>
  );
};

// ==========================================
// QUEEN PIECE
// ==========================================
export const QueenPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.38)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base */}
        <path d="M 10 39 C 10 36.5 13 36 16.5 36 L 28.5 36 C 32 36 35 36.5 35 39 C 35 40.5 33 41 31 41 L 14 41 C 12 41 10 40.5 10 39 Z" />

        {/* Waisted Gown */}
        <path d="M 14.5 36 C 16 30 17 26 17.5 22.5 L 27.5 22.5 C 28 26 29 30 30.5 36 Z" />

        {/* Gown Ring */}
        <path d="M 15 22.5 C 15 21.2 18 20.2 22.5 20.2 C 27 20.2 30 21.2 30 22.5 Z" />

        {/* Flared 5-point Coronet Crown */}
        <path d="M 14.5 20 C 13.5 16 11 12 9.5 10.5 L 16 16 L 22.5 8 L 29 16 L 35.5 10.5 C 34 12 31.5 16 30.5 20 Z" />

        {/* 5 Coronet Crown Pearls */}
        <circle cx="9.5" cy="9.5" r="1.6" />
        <circle cx="16" cy="14.8" r="1.4" />
        <circle cx="22.5" cy="7" r="1.8" />
        <circle cx="29" cy="14.8" r="1.4" />
        <circle cx="35.5" cy="9.5" r="1.6" />

        {/* Interior Accent Sheen */}
        {isWhite ? (
          <path
            d="M 14.5 38.5 L 30.5 38.5"
            fill="none"
            stroke={c.innerLine}
            strokeWidth="0.9"
            opacity="0.5"
          />
        ) : (
          <>
            <path
              d="M 15.5 22.5 C 17.5 21.2 27.5 21.2 29.5 22.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1"
              opacity="0.85"
            />
            <path
              d="M 14 38.5 L 31 38.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1"
              opacity="0.85"
            />
          </>
        )}
      </g>
    </svg>
  );
};

// ==========================================
// KING PIECE
// ==========================================
export const KingPiece: React.FC<PieceProps> = ({
  color,
  className = 'w-full h-full',
  set = 'neo',
}) => {
  const isWhite = color === 'w';
  const c = PIECE_THEME_COLORS[set][color];

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.38)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base */}
        <path d="M 10 39 C 10 36.5 13 36 16.5 36 L 28.5 36 C 32 36 35 36.5 35 39 C 35 40.5 33 41 31 41 L 14 41 C 12 41 10 40.5 10 39 Z" />

        {/* Regal Body */}
        <path d="M 14.5 36 C 15.8 30 17 26 17.5 22.5 L 27.5 22.5 C 28 26 29.2 30 30.5 36 Z" />

        {/* Crown Tier Ring */}
        <path d="M 14 22.5 C 14 21 17.5 19.5 22.5 19.5 C 27.5 19.5 31 21 31 22.5 Z" />

        {/* Majestic Crown Dome with Arches */}
        <path d="M 14 19.5 C 12 16 13 12 16 9.5 C 18.5 11 20 12.5 22.5 12.5 C 25 12.5 26.5 11 29 9.5 C 32 12 33 16 31 19.5 Z" />

        {/* Sovereign Latin Cross */}
        <path
          d="M 22.5 3.5 L 22.5 9 M 19.5 6 L 25.5 6"
          stroke={c.stroke}
          strokeWidth="1.8"
          strokeLinecap="square"
        />

        {/* Cross Accent Details */}
        {isWhite ? (
          <path
            d="M 14.5 38.5 L 30.5 38.5"
            fill="none"
            stroke={c.innerLine}
            strokeWidth="0.9"
            opacity="0.5"
          />
        ) : (
          <>
            <path
              d="M 15 22.5 C 18 20.8 27 20.8 30 22.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1.1"
              opacity="0.85"
            />
            <circle cx="22.5" cy="16" r="1.3" fill={c.innerLine} stroke="none" />
            <path
              d="M 14 38.5 L 31 38.5"
              fill="none"
              stroke={c.innerLine}
              strokeWidth="1"
              opacity="0.85"
            />
          </>
        )}
      </g>
    </svg>
  );
};

// ==========================================
// UNIFIED CHESS PIECE COMPONENT
// ==========================================
export const ChessPieceIcon: React.FC<{
  type: PieceType;
  color: 'w' | 'b';
  className?: string;
  set?: PieceSet;
}> = ({ type, color, className = 'w-full h-full', set = 'neo' }) => {
  switch (type.toLowerCase()) {
    case 'p':
      return <PawnPiece color={color} className={className} set={set} />;
    case 'n':
      return <KnightPiece color={color} className={className} set={set} />;
    case 'b':
      return <BishopPiece color={color} className={className} set={set} />;
    case 'r':
      return <RookPiece color={color} className={className} set={set} />;
    case 'q':
      return <QueenPiece color={color} className={className} set={set} />;
    case 'k':
      return <KingPiece color={color} className={className} set={set} />;
    default:
      return null;
  }
};
