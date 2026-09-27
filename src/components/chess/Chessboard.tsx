import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Square, Move } from 'chess.js';
import { ChessEngine } from '../../lib/chess/chessEngine';
import { ChessPieceIcon } from './ChessPieces';
import { playMoveSound, playCaptureSound, playCheckSound } from '../../lib/chess/soundEffects';

export interface ChessboardProps {
  fen: string;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  onMove?: (move: { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n'; san: string; fen: string }) => void;
  highlightSquares?: string[];
  arrowGuide?: { from: string; to: string; color?: string }[];
  showCoordinates?: boolean;
  className?: string;
  resetKey?: number;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation = 'white',
  interactive = true,
  onMove,
  highlightSquares = [],
  arrowGuide = [],
  showCoordinates = true,
  className = '',
  resetKey = 0,
}) => {
  const engine = useMemo(() => new ChessEngine(fen), [fen]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalDestinations, setLegalDestinations] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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
    return orientation === 'white' ? list : list.reverse();
  }, [orientation]);

  const files = useMemo(() => {
    const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return orientation === 'white' ? list : list.reverse();
  }, [orientation]);

  const kingInCheckSquare = useMemo(() => {
    if (engine.isCheck) {
      return engine.getKingSquare(engine.turn);
    }
    return null;
  }, [engine, fen]);

  const handleSquareClick = (square: Square) => {
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
      setSelectedSquare(null);
      setLegalDestinations([]);
      setPendingPromotion(null);
    }
  };

  // Drag and drop handlers
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

  // Calculate arrow coordinates
  const getSquareCoordinates = (square: string) => {
    const file = square[0];
    const rank = parseInt(square[1], 10);
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);
    if (fileIndex === -1 || rankIndex === -1) return null;
    return {
      x: (fileIndex + 0.5) * 12.5, // percent
      y: (rankIndex + 0.5) * 12.5,
    };
  };

  return (
    <div className={`relative select-none max-w-full aspect-square ${className}`} ref={boardRef}>
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        {ranks.map((rank) =>
          files.map((file) => {
            const square = `${file}${rank}` as Square;
            const fileIdx = file.charCodeAt(0) - 97;
            const isLight = (fileIdx + rank) % 2 !== 0;
            const piece = engine.getPiece(square);

            const isSelected = selectedSquare === square;
            const isLegalDest = legalDestinations.includes(square);
            const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
            const isCustomHighlight = highlightSquares.includes(square);
            const isCheckSquare = kingInCheckSquare === square;

            return (
              <div
                key={square}
                data-square={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isLight ? 'bg-[#ebecd0]' : 'bg-[#739552]'
                } ${
                  isLastMoveSquare ? '!bg-[#f5f682]/60' : ''
                } ${
                  isCustomHighlight ? '!bg-emerald-400/50 ring-2 ring-emerald-500 ring-inset' : ''
                } ${
                  isSelected ? '!bg-[#bbcb2b]/80 ring-2 ring-amber-300 ring-inset' : ''
                } ${
                  isCheckSquare ? '!bg-red-500/70 animate-pulse ring-4 ring-red-600 ring-inset' : ''
                }`}
              >
                {/* Board coordinates - rank on first file */}
                {showCoordinates && file === files[0] && (
                  <span
                    className={`absolute top-1 left-1.5 text-[10px] font-bold pointer-events-none ${
                      isLight ? 'text-[#739552]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {/* Board coordinates - file on last rank */}
                {showCoordinates && rank === ranks[ranks.length - 1] && (
                  <span
                    className={`absolute bottom-0.5 right-1.5 text-[10px] font-bold pointer-events-none ${
                      isLight ? 'text-[#739552]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Legal destination indicator: empty square dot */}
                {isLegalDest && !piece && (
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-black/25 pointer-events-none transition-transform hover:scale-125" />
                )}
                {/* Legal destination indicator: capture target ring */}
                {isLegalDest && piece && (
                  <div className="absolute inset-1 rounded-full border-4 border-black/30 pointer-events-none animate-pulse" />
                )}

                {/* Piece */}
                {piece && (
                  <div
                    draggable={interactive && piece.color === engine.turn}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className={`w-[88%] h-[88%] flex items-center justify-center transition-transform active:scale-95 drop-shadow-sm ${
                      interactive && piece.color === engine.turn ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-default'
                    }`}
                  >
                    <ChessPieceIcon type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Arrow Overlay */}
      {arrowGuide.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="arrowhead-emerald"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#10b981" opacity="0.85" />
            </marker>
            <marker
              id="arrowhead-amber"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#f59e0b" opacity="0.85" />
            </marker>
            <marker
              id="arrowhead-red"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 4 2, 0 4" fill="#ef4444" opacity="0.85" />
            </marker>
          </defs>
          {arrowGuide.map((arrow, idx) => {
            const fromCoord = getSquareCoordinates(arrow.from);
            const toCoord = getSquareCoordinates(arrow.to);
            if (!fromCoord || !toCoord) return null;

            const color = arrow.color || 'emerald';
            const strokeColor =
              color === 'red' ? '#ef4444' : color === 'amber' ? '#f59e0b' : '#10b981';
            const markerId =
              color === 'red'
                ? 'url(#arrowhead-red)'
                : color === 'amber'
                ? 'url(#arrowhead-amber)'
                : 'url(#arrowhead-emerald)';

            // Shorten line slightly so arrow head points at center without clipping
            const dx = toCoord.x - fromCoord.x;
            const dy = toCoord.y - fromCoord.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ratio = (dist - 3.5) / dist;
            const endX = fromCoord.x + dx * ratio;
            const endY = fromCoord.y + dy * ratio;

            return (
              <line
                key={idx}
                x1={`${fromCoord.x}%`}
                y1={`${fromCoord.y}%`}
                x2={`${endX}%`}
                y2={`${endY}%`}
                stroke={strokeColor}
                strokeWidth="2.8"
                strokeOpacity="0.8"
                strokeLinecap="round"
                markerEnd={markerId}
              />
            );
          })}
        </svg>
      )}
      {/* Interactive Promotion Modal Overlay */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl text-center">
            <span className="text-xs font-semibold text-slate-200 block mb-3 font-display">
              Promote Pawn To:
            </span>
            <div className="flex items-center gap-3">
              {(['q', 'r', 'b', 'n'] as const).map((pieceType) => (
                <button
                  key={pieceType}
                  onClick={() => executeMove(pendingPromotion.from, pendingPromotion.to, pieceType)}
                  className="w-12 h-12 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 p-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                  title={`Promote to ${pieceType === 'q' ? 'Queen' : pieceType === 'r' ? 'Rook' : pieceType === 'b' ? 'Bishop' : 'Knight'}`}
                >
                  <ChessPieceIcon type={pieceType} color={engine.turn} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingPromotion(null)}
              className="mt-3 text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
