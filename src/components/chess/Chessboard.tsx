import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Square } from 'chess.js';
import { ChessEngine } from '../../lib/chess/chessEngine';
import { ChessPieceIcon, PieceSet } from './ChessPieces';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playErrorSound,
} from '../../lib/chess/soundEffects';
import { RotateCw, Palette, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';

export type BoardThemeId = 'tournament' | 'green' | 'wood' | 'blue' | 'dark' | 'glass';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  borderColor: string;
  coordLight: string;
  coordDark: string;
  lastMoveTint: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  tournament: {
    id: 'tournament',
    name: 'Academy Tournament',
    lightSquare: '#E8E1D3',
    darkSquare: '#6D806D',
    borderColor: '#D5D0C5',
    coordLight: '#6D806D',
    coordDark: '#E8E1D3',
    lastMoveTint: 'rgba(199, 164, 93, 0.45)',
  },
  green: {
    id: 'green',
    name: 'Club Green',
    lightSquare: '#EBECD0',
    darkSquare: '#739552',
    borderColor: '#262421',
    coordLight: '#739552',
    coordDark: '#EBECD0',
    lastMoveTint: 'rgba(247, 247, 105, 0.55)',
  },
  wood: {
    id: 'wood',
    name: 'Natural Walnut',
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    borderColor: '#3D2514',
    coordLight: '#B58863',
    coordDark: '#F0D9B5',
    lastMoveTint: 'rgba(235, 195, 75, 0.55)',
  },
  blue: {
    id: 'blue',
    name: 'Tournament Blue',
    lightSquare: '#EAE9D2',
    darkSquare: '#4B7399',
    borderColor: '#1E293B',
    coordLight: '#4B7399',
    coordDark: '#EAE9D2',
    lastMoveTint: 'rgba(100, 200, 255, 0.5)',
  },
  dark: {
    id: 'dark',
    name: 'Modern Charcoal',
    lightSquare: '#A0A7AD',
    darkSquare: '#4E5860',
    borderColor: '#18181B',
    coordLight: '#4E5860',
    coordDark: '#A0A7AD',
    lastMoveTint: 'rgba(250, 204, 21, 0.55)',
  },
  glass: {
    id: 'glass',
    name: 'Emerald Glass',
    lightSquare: '#D8EFE8',
    darkSquare: '#387B64',
    borderColor: '#064E3B',
    coordLight: '#387B64',
    coordDark: '#D8EFE8',
    lastMoveTint: 'rgba(52, 211, 153, 0.55)',
  },
};

export interface BoxHighlight {
  square: string;
  color: 'green' | 'red' | 'amber' | 'blue';
}

export interface ArrowGuideItem {
  from: string;
  to: string;
  color?: string;
  dashed?: boolean;
}

export interface ChessboardProps {
  fen: string;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  onMove?: (move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n'; san: string; fen: string }) => void;
  highlightSquares?: string[];
  boxHighlights?: BoxHighlight[];
  arrowGuide?: ArrowGuideItem[];
  showCoordinates?: boolean;
  showToolbar?: boolean;
  showEvalBar?: boolean;
  evalScore?: number | string;
  theme?: BoardThemeId;
  pieceSet?: PieceSet;
  className?: string;
  resetKey?: number;
  onFlipOrientation?: () => void;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation: initialOrientation = 'white',
  interactive = true,
  onMove,
  highlightSquares = [],
  boxHighlights = [],
  arrowGuide = [],
  showCoordinates = true,
  showToolbar = false,
  showEvalBar = false,
  evalScore = 0,
  theme: propTheme,
  pieceSet: propPieceSet,
  className = '',
  resetKey = 0,
  onFlipOrientation,
}) => {
  const engine = useMemo(() => new ChessEngine(fen), [fen]);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(initialOrientation);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalDestinations, setLegalDestinations] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Persistent Board Theme & Piece Set preferences
  const [currentThemeId, setCurrentThemeId] = useState<BoardThemeId>(() => {
    if (propTheme) return propTheme;
    try {
      const saved = localStorage.getItem('chesscadet_board_theme');
      return (saved as BoardThemeId) || 'tournament';
    } catch {
      return 'tournament';
    }
  });

  const [currentPieceSet, setCurrentPieceSet] = useState<PieceSet>(() => {
    if (propPieceSet) return propPieceSet;
    try {
      const saved = localStorage.getItem('chesscadet_piece_set');
      return (saved as PieceSet) || 'staunton';
    } catch {
      return 'staunton';
    }
  });

  const activeTheme = BOARD_THEMES[currentThemeId] || BOARD_THEMES.tournament;

  // Right-click user annotations (Arrows & Square Highlights just like Chess.com!)
  const [userArrows, setUserArrows] = useState<ArrowGuideItem[]>([]);
  const [userHighlights, setUserHighlights] = useState<Record<string, string>>({});
  const rightClickStartRef = useRef<Square | null>(null);

  // Sync orientation with prop if provided
  useEffect(() => {
    setBoardOrientation(initialOrientation);
  }, [initialOrientation]);

  // Sync engine when fen or resetKey changes
  useEffect(() => {
    engine.load(fen);
    setSelectedSquare(null);
    setLegalDestinations([]);
    setPendingPromotion(null);
    setLastMove(null);
  }, [fen, engine, resetKey]);

  const ranks = useMemo(() => {
    const list = [8, 7, 6, 5, 4, 3, 2, 1];
    return boardOrientation === 'white' ? list : [...list].reverse();
  }, [boardOrientation]);

  const files = useMemo(() => {
    const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return boardOrientation === 'white' ? list : [...list].reverse();
  }, [boardOrientation]);

  const kingInCheckSquare = useMemo(() => {
    if (engine.isCheck) {
      return engine.getKingSquare(engine.turn);
    }
    return null;
  }, [engine, fen]);

  // Handle Square Selection and Moves
  const handleSquareClick = (square: Square) => {
    if (userArrows.length > 0 || Object.keys(userHighlights).length > 0) {
      // Clear annotations on click
      setUserArrows([]);
      setUserHighlights({});
    }

    if (!interactive || pendingPromotion) return;

    const piece = engine.getPiece(square);

    // If already selected a square and clicked a legal destination
    if (selectedSquare && legalDestinations.includes(square)) {
      if (engine.isPromotionMove(selectedSquare, square)) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }
      executeMove(selectedSquare, square, 'q');
      return;
    }

    // If clicked on piece of current turn's color
    if (piece && piece.color === engine.turn) {
      setSelectedSquare(square);
      setLegalDestinations(engine.getLegalDestinations(square));
      return;
    }

    // Deselect
    setSelectedSquare(null);
    setLegalDestinations([]);
  };

  const executeMove = (from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q') => {
    const targetPiece = engine.getPiece(to);
    const move = engine.makeMove(from, to, promotion);

    if (move) {
      setLastMove({ from, to });
      setSelectedSquare(null);
      setLegalDestinations([]);
      setPendingPromotion(null);
      setUserArrows([]);
      setUserHighlights({});

      if (move.captured || targetPiece) {
        playCaptureSound();
      } else if (engine.isCheck) {
        playCheckSound();
      } else {
        playMoveSound();
      }

      if (onMove) {
        onMove({
          from,
          to,
          promotion,
          san: move.san,
          fen: engine.fen,
        });
      }
    } else {
      playErrorSound();
      setSelectedSquare(null);
      setLegalDestinations([]);
      setPendingPromotion(null);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive || pendingPromotion) {
      e.preventDefault();
      return;
    }
    const piece = engine.getPiece(square);
    if (!piece || piece.color !== engine.turn) {
      e.preventDefault();
      return;
    }

    setDraggingSquare(square);
    setSelectedSquare(square);
    setLegalDestinations(engine.getLegalDestinations(square));
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const sourceSquare = (e.dataTransfer.getData('text/plain') as Square) || draggingSquare;
    setDraggingSquare(null);

    if (sourceSquare && sourceSquare !== targetSquare) {
      if (engine.getLegalDestinations(sourceSquare).includes(targetSquare)) {
        if (engine.isPromotionMove(sourceSquare, targetSquare)) {
          setPendingPromotion({ from: sourceSquare, to: targetSquare });
        } else {
          executeMove(sourceSquare, targetSquare, 'q');
        }
      } else {
        setSelectedSquare(null);
        setLegalDestinations([]);
      }
    }
  };

  // Right-Click Drawing & Highlighting (Chess.com Signature Feature)
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      // Right mouse button
      e.preventDefault();
      rightClickStartRef.current = square;
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2 && rightClickStartRef.current) {
      e.preventDefault();
      const startSquare = rightClickStartRef.current;
      rightClickStartRef.current = null;

      if (startSquare === square) {
        // Toggle square highlight
        setUserHighlights((prev) => {
          const next = { ...prev };
          if (next[square]) {
            delete next[square];
          } else {
            next[square] = 'amber';
          }
          return next;
        });
      } else {
        // Toggle arrow
        setUserArrows((prev) => {
          const existingIdx = prev.findIndex(
            (a) => a.from === startSquare && a.to === square
          );
          if (existingIdx !== -1) {
            return prev.filter((_, idx) => idx !== existingIdx);
          } else {
            return [...prev, { from: startSquare, to: square, color: 'amber' }];
          }
        });
      }
    }
  };

  const toggleBoardOrientation = () => {
    const next = boardOrientation === 'white' ? 'black' : 'white';
    setBoardOrientation(next);
    if (onFlipOrientation) onFlipOrientation();
  };

  const cycleTheme = () => {
    const themeKeys: BoardThemeId[] = ['green', 'wood', 'blue', 'dark', 'glass'];
    const curIdx = themeKeys.indexOf(currentThemeId);
    const nextTheme = themeKeys[(curIdx + 1) % themeKeys.length];
    setCurrentThemeId(nextTheme);
    try {
      localStorage.setItem('chesscadet_board_theme', nextTheme);
    } catch {}
  };

  const cyclePieceSet = () => {
    const sets: PieceSet[] = ['neo', 'staunton', 'wood'];
    const curIdx = sets.indexOf(currentPieceSet);
    const nextSet = sets[(curIdx + 1) % sets.length];
    setCurrentPieceSet(nextSet);
    try {
      localStorage.setItem('chesscadet_piece_set', nextSet);
    } catch {}
  };

  // Convert square notation ('e4') to 0-100 coordinates
  const getSquareCoordinates = useCallback(
    (square: string) => {
      const file = square[0];
      const rank = parseInt(square[1], 10);
      const fileIndex = files.indexOf(file);
      const rankIndex = ranks.indexOf(rank);
      if (fileIndex === -1 || rankIndex === -1) return null;
      return {
        x: (fileIndex + 0.5) * 12.5,
        y: (rankIndex + 0.5) * 12.5,
        fileIndex,
        rankIndex,
      };
    },
    [files, ranks]
  );

  // Combine guide arrows and user drawn arrows
  const allArrows = useMemo(() => {
    return [...arrowGuide, ...userArrows];
  }, [arrowGuide, userArrows]);

  // Evaluation Bar calculation (Image 2 style)
  const evalData = useMemo(() => {
    if (!showEvalBar) return null;
    let cp = 0;
    let label = '0.0';
    if (typeof evalScore === 'number') {
      cp = evalScore;
      label = (cp / 100).toFixed(1);
      if (cp > 0) label = `+${label}`;
    } else if (typeof evalScore === 'string') {
      label = evalScore;
      if (evalScore.startsWith('#M')) {
        const mateVal = parseInt(evalScore.replace('#M', ''), 10);
        cp = mateVal > 0 ? 10000 : -10000;
      } else {
        cp = (parseFloat(evalScore) || 0) * 100;
      }
    }
    const winPercent = 50 + 50 * (2 / (1 + Math.exp(-0.0035 * cp)) - 1);
    const whiteHeight = Math.max(4, Math.min(96, winPercent));
    return {
      whiteHeight: boardOrientation === 'white' ? whiteHeight : 100 - whiteHeight,
      label,
    };
  }, [showEvalBar, evalScore, boardOrientation]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Board & Optional Evaluation Bar Wrapper */}
      <div className="flex items-center gap-2.5 w-full justify-center">
        {/* Vertical Evaluation Bar (Chess.com Style - Image 2) */}
        {evalData && (
          <div
            className="w-5 sm:w-6 h-[calc(100%-8px)] rounded-md bg-[#262421] border border-slate-700/60 flex flex-col justify-end overflow-hidden relative shadow-lg shrink-0"
            style={{ height: boardRef.current ? `${boardRef.current.clientHeight - 8}px` : '100%', minHeight: '300px' }}
            title={`Evaluation: ${evalData.label}`}
          >
            {/* White side */}
            <div
              className="w-full bg-[#FFFFFF] transition-all duration-300 ease-out flex items-end justify-center pb-1 text-[10px] font-bold text-slate-900 font-mono select-none"
              style={{ height: `${evalData.whiteHeight}%` }}
            >
              {evalData.whiteHeight > 20 && evalData.label}
            </div>
            {/* Black side text if whiteHeight is low */}
            {evalData.whiteHeight <= 20 && (
              <div className="absolute top-1 inset-x-0 text-center text-[10px] font-bold text-white font-mono select-none">
                {evalData.label}
              </div>
            )}
          </div>
        )}

        {/* Board Outer Container */}
        <div
          className="relative w-full max-w-full aspect-square p-2 sm:p-2.5 rounded-2xl shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: activeTheme.borderColor,
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset',
          }}
          ref={boardRef}
          onContextMenu={(e) => e.preventDefault()}
        >
        {/* Inner Grid */}
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden relative shadow-inner">
          {ranks.map((rank, rankIdx) =>
            files.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (file.charCodeAt(0) - 97 + rank) % 2 !== 0;
              const piece = engine.getPiece(square);

              const isSelected = selectedSquare === square;
              const isLegalDest = legalDestinations.includes(square);
              const isLastMoveSquare =
                lastMove && (lastMove.from === square || lastMove.to === square);
              const isCustomHighlight = highlightSquares.includes(square);
              const userHighlightColor = userHighlights[square];
              const isCheckSquare = kingInCheckSquare === square;
              const boxHighlight = boxHighlights.find((b) => b.square === square);

              // Square background styling
              let squareBg = isLight ? activeTheme.lightSquare : activeTheme.darkSquare;

              return (
                <div
                  key={square}
                  data-square={square}
                  onClick={() => handleSquareClick(square)}
                  onMouseDown={(e) => handleMouseDown(e, square)}
                  onMouseUp={(e) => handleMouseUp(e, square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  style={{ backgroundColor: squareBg }}
                  className="relative flex items-center justify-center cursor-pointer transition-colors duration-150 overflow-hidden"
                >
                  {/* Last Move Overlay (Chess.com sunny tint) */}
                  {isLastMoveSquare && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                      style={{ backgroundColor: activeTheme.lastMoveTint }}
                    />
                  )}

                  {/* Selected Square Overlay */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none ring-2 ring-amber-300 ring-inset"
                      style={{ backgroundColor: 'rgba(245, 246, 130, 0.75)' }}
                    />
                  )}

                  {/* Custom System Highlight */}
                  {isCustomHighlight && (
                    <div className="absolute inset-0 bg-emerald-400/40 ring-2 ring-emerald-500 ring-inset pointer-events-none" />
                  )}

                  {/* User Right-Click Highlight */}
                  {userHighlightColor && (
                    <div className="absolute inset-0 bg-amber-400/45 ring-2 ring-amber-400 ring-inset pointer-events-none" />
                  )}

                  {/* Box Highlight Frame (Image 1 style: thick border frame around piece) */}
                  {boxHighlight && (
                    <div
                      className={`absolute inset-0 pointer-events-none z-10 border-[3.5px] sm:border-[4.5px] ${
                        boxHighlight.color === 'green'
                          ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                          : boxHighlight.color === 'red'
                          ? 'border-red-500 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.35)]'
                          : boxHighlight.color === 'blue'
                          ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.35)]'
                          : 'border-amber-400 bg-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.35)]'
                      }`}
                    />
                  )}

                  {/* King Check Danger Pulse (Chess.com radial gradient glow) */}
                  {isCheckSquare && (
                    <div
                      className="absolute inset-0 pointer-events-none animate-pulse"
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.5) 55%, transparent 80%)',
                      }}
                    />
                  )}

                  {/* Board Coordinate: Rank numbers in top-left of square on leftmost file */}
                  {showCoordinates && fileIdx === 0 && (
                    <span
                      className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-bold leading-none pointer-events-none select-none"
                      style={{
                        color: isLight ? activeTheme.coordLight : activeTheme.coordDark,
                      }}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Board Coordinate: File letters in bottom-right of square on bottom rank */}
                  {showCoordinates && rankIdx === 7 && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-bold leading-none pointer-events-none select-none"
                      style={{
                        color: isLight ? activeTheme.coordLight : activeTheme.coordDark,
                      }}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal Destination: Empty Square Dot (Chess.com style) */}
                  {isLegalDest && !piece && (
                    <div className="w-[30%] h-[30%] rounded-full bg-black/20 pointer-events-none transform transition-transform group-hover:scale-125 z-10" />
                  )}

                  {/* Legal Destination: Capture Target Ring (Chess.com style) */}
                  {isLegalDest && piece && (
                    <div className="absolute inset-1 sm:inset-1.5 rounded-full border-[4px] sm:border-[5px] border-black/25 pointer-events-none animate-pulse z-10" />
                  )}

                  {/* Chess Piece Vector */}
                  {piece && (
                    <div
                      draggable={interactive && piece.color === engine.turn}
                      onDragStart={(e) => handleDragStart(e, square)}
                      className={`w-[88%] h-[88%] flex items-center justify-center relative z-2 transition-transform duration-100 ${
                        interactive && piece.color === engine.turn
                          ? 'cursor-grab active:cursor-grabbing hover:scale-[1.06]'
                          : 'cursor-default'
                      }`}
                    >
                      <ChessPieceIcon
                        type={piece.type}
                        color={piece.color}
                        set={currentPieceSet}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* World-Class Chess.com-Style SVG Arrow Overlay */}
        {allArrows.length > 0 && (
          <svg
            className="absolute inset-2 sm:inset-2.5 w-[calc(100%-16px)] sm:w-[calc(100%-20px)] h-[calc(100%-16px)] sm:h-[calc(100%-20px)] pointer-events-none z-20"
            viewBox="0 0 100 100"
          >
            <defs>
              <filter id="arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
              </filter>
            </defs>
            {allArrows.map((arrow, idx) => {
              const from = getSquareCoordinates(arrow.from);
              const to = getSquareCoordinates(arrow.to);
              if (!from || !to) return null;

              const color = arrow.color || 'emerald';
              const arrowFill =
                color === 'red'
                  ? '#EF4444'
                  : color === 'amber'
                  ? '#F59E0B'
                  : color === 'blue'
                  ? '#3B82F6'
                  : '#10B981';

              const df = to.fileIndex - from.fileIndex;
              const dr = to.rankIndex - from.rankIndex;
              const isKnightMove =
                (Math.abs(df) === 1 && Math.abs(dr) === 2) ||
                (Math.abs(df) === 2 && Math.abs(dr) === 1);

              if (isKnightMove) {
                // Chess.com L-Shaped Knight Arrow!
                let cornerX = from.x;
                let cornerY = to.y;
                let finalDirX = to.x - cornerX;
                let finalDirY = 0;

                if (Math.abs(df) === 2) {
                  cornerX = to.x;
                  cornerY = from.y;
                  finalDirX = 0;
                  finalDirY = to.y - cornerY;
                }

                const headLen = 3.6;
                const headWidth = 2.2;
                const signX = finalDirX !== 0 ? Math.sign(finalDirX) : 0;
                const signY = finalDirY !== 0 ? Math.sign(finalDirY) : 0;
                const shaftEndX = to.x - signX * headLen * 0.7;
                const shaftEndY = to.y - signY * headLen * 0.7;

                return (
                  <g key={`arrow-${idx}`} filter="url(#arrow-shadow)">
                    {/* L-shaft with rounded elbow */}
                    <path
                      d={`M ${from.x} ${from.y} L ${cornerX} ${cornerY} L ${shaftEndX} ${shaftEndY}`}
                      fill="none"
                      stroke={arrowFill}
                      strokeWidth="2.8"
                      strokeOpacity="0.85"
                      strokeDasharray={arrow.dashed ? '4,3' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Head */}
                    <polygon
                      points={
                        signX !== 0
                          ? `${to.x},${to.y} ${to.x - signX * headLen},${to.y - headWidth} ${to.x - signX * headLen},${to.y + headWidth}`
                          : `${to.x},${to.y} ${to.x - headWidth},${to.y - signY * headLen} ${to.x + headWidth},${to.y - signY * headLen}`
                      }
                      fill={arrowFill}
                      opacity="0.85"
                    />
                  </g>
                );
              }

              // Standard Linear / Diagonal Arrow
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              const angle = Math.atan2(dy, dx);
              const headLen = 3.6;
              const headWidth = 2.2;

              // Pull back shaft slightly so head sits on target
              const shaftEndX = to.x - Math.cos(angle) * (headLen * 0.7);
              const shaftEndY = to.y - Math.sin(angle) * (headLen * 0.7);

              const leftX = to.x - headLen * Math.cos(angle) + headWidth * Math.sin(angle);
              const leftY = to.y - headLen * Math.sin(angle) - headWidth * Math.cos(angle);
              const rightX = to.x - headLen * Math.cos(angle) - headWidth * Math.sin(angle);
              const rightY = to.y - headLen * Math.sin(angle) + headWidth * Math.cos(angle);

              return (
                <g key={`arrow-${idx}`} filter="url(#arrow-shadow)">
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={shaftEndX}
                    y2={shaftEndY}
                    stroke={arrowFill}
                    strokeWidth="2.8"
                    strokeOpacity="0.85"
                    strokeDasharray={arrow.dashed ? '4,3' : undefined}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${to.x},${to.y} ${leftX},${leftY} ${rightX},${rightY}`}
                    fill={arrowFill}
                    opacity="0.85"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Promotion Picker Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-4 rounded-xl">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-center max-w-[280px]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-3 font-display">
                Promote Pawn
              </span>
              <div className="flex items-center justify-center gap-2.5">
                {(['q', 'r', 'b', 'n'] as const).map((pieceType) => (
                  <button
                    key={pieceType}
                    onClick={() =>
                      executeMove(pendingPromotion.from, pendingPromotion.to, pieceType)
                    }
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500 p-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                    title={`Promote to ${
                      pieceType === 'q'
                        ? 'Queen'
                        : pieceType === 'r'
                        ? 'Rook'
                        : pieceType === 'b'
                        ? 'Bishop'
                        : 'Knight'
                    }`}
                  >
                    <ChessPieceIcon
                      type={pieceType}
                      color={engine.turn}
                      set={currentPieceSet}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPendingPromotion(null)}
                className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Floating Auxiliary Toolbar (Optional or when requested) */}
      {showToolbar && (
        <div className="flex items-center justify-between w-full mt-2.5 px-1 py-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBoardOrientation}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium"
              title="Flip Board Orientation"
            >
              <RotateCw className="w-3 h-3" />
              <span>Flip</span>
            </button>

            <button
              onClick={cycleTheme}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium"
              title="Change Board Theme"
            >
              <Palette className="w-3 h-3 text-emerald-400" />
              <span>{activeTheme.name.split(' ')[0]}</span>
            </button>

            <button
              onClick={cyclePieceSet}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium"
              title="Change Piece Style"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="capitalize">{currentPieceSet}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono-nums">
            Right-click to draw arrows
          </div>
        </div>
      )}
    </div>
  );
};
