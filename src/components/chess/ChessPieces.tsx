import React from 'react';

interface PieceProps {
  color: 'w' | 'b';
  className?: string;
}

export const KingPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M22.5 11.63V6M20 8h5"
          stroke={isWhite ? '#1e293b' : '#f8fafc'}
          strokeLinejoin="miter"
        />
        <path
          d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23v.5C19 16 9.5 13 5.5 19.5c-3 6 5 10.5 6 10.5v7z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const QueenPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm17 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-14-2.5 14-2.5-14-6 14-7-11 2 12z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M11 38.5a35 35 1 0 0 23 0"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const RookPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M9 39h27v-3H9v3zm3-3v-1.5h21V36H12zm-1-1.5l1.5-3.5h20l1.5 3.5H11zM14 29v-13h17v13H14zm-3-13l2-3h20l2 3H11zM9 13v-3.5h4V12h3.5V9.5h4V12h4V9.5h4V12h3.5V9.5h4V13H9z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M14 16h17m-17 5h17m-17 5h17"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const BishopPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        >
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        </g>
        <path
          d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const KnightPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-11.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z"
          fill={isWhite ? '#1e293b' : '#cbd5e1'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
        <path
          d="M15 15.5c.5.5 1 1 2 1s2.5-.5 3-1.5"
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const PawnPiece: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M22.5 9a3.5 3.5 0 1 1 0 7 3.5 3.5 0 1 1 0-7zm0 10.5c-4 0-6.5 3.5-7 8.5h14c-.5-5-3-8.5-7-8.5zm-8 12.5c2 2 14 2 16 0v2H14.5v-2zm-2.5 4c3.5 1 17.5 1 21 0v2H12v-2z"
          fill={isWhite ? '#ffffff' : '#1e293b'}
          stroke={isWhite ? '#1e293b' : '#cbd5e1'}
        />
      </g>
    </svg>
  );
};

export const ChessPieceIcon: React.FC<{
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  className?: string;
}> = ({ type, color, className = 'w-full h-full' }) => {
  switch (type.toLowerCase()) {
    case 'k':
      return <KingPiece color={color} className={className} />;
    case 'q':
      return <QueenPiece color={color} className={className} />;
    case 'r':
      return <RookPiece color={color} className={className} />;
    case 'b':
      return <BishopPiece color={color} className={className} />;
    case 'n':
      return <KnightPiece color={color} className={className} />;
    case 'p':
    default:
      return <PawnPiece color={color} className={className} />;
  }
};
