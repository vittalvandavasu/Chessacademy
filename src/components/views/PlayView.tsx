import React, { useState, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard, ArrowGuideItem } from '../chess/Chessboard';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playSuccessSound,
  playErrorSound,
} from '../../lib/chess/soundEffects';
import {
  Swords,
  RotateCcw,
  Undo2,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Brain,
  Sparkles,
} from 'lucide-react';

interface PlayViewProps {
  userRating?: number;
}

export const PlayView: React.FC<PlayViewProps> = ({ userRating = 1200 }) => {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [difficulty, setDifficulty] = useState<'novice' | 'club' | 'master'>('club');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [coachThought, setCoachThought] = useState<string>(
    'Game started. Focus on controlling the central squares (e4, d4, e5, d5) and developing minor pieces.'
  );
  const [coachArrows, setCoachArrows] = useState<ArrowGuideItem[]>([
    { from: 'e2', to: 'e4', color: 'emerald' },
    { from: 'd2', to: 'd4', color: 'emerald' },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showThinkingProcess, setShowThinkingProcess] = useState(true);

  const isComputerMoving = useRef(false);

  const resetGame = (color: 'white' | 'black' = playerColor) => {
    const newG = new Chess();
    setGame(newG);
    setFen(newG.fen());
    setPlayerColor(color);
    setMoveHistory([]);
    setCoachThought(
      color === 'white'
        ? 'You play White. Establish central pawn control or develop Knights toward the center.'
        : 'You play Black. Respond symmetrically or counter-attack White’s central pawn.'
    );
    setCoachArrows(
      color === 'white'
        ? [
            { from: 'e2', to: 'e4', color: 'emerald' },
            { from: 'g1', to: 'f3', color: 'emerald' },
          ]
        : []
    );

    if (color === 'black') {
      setTimeout(() => triggerAiMove(newG, []), 600);
    }
  };

  const handleUserMove = ({
    from,
    to,
    promotion,
  }: {
    from: Square;
    to: Square;
    promotion?: 'q' | 'r' | 'b' | 'n';
  }) => {
    if (isComputerMoving.current) return;
    const c = new Chess(game.fen());

    try {
      const move = c.move({ from, to, promotion: promotion || 'q' });
      if (!move) return;

      if (move.captured) playCaptureSound();
      else if (c.isCheck()) playCheckSound();
      else playMoveSound();

      const newHistory = [...moveHistory, move.san];
      setGame(c);
      setFen(c.fen());
      setMoveHistory(newHistory);

      // Check game over
      if (c.isGameOver()) {
        if (c.isCheckmate()) {
          setCoachThought('Checkmate! Outstanding tactical calculation.');
          playSuccessSound();
        } else if (c.isDraw()) {
          setCoachThought('Game drawn by stalemate, repetition, or insufficient material.');
        }
        return;
      }

      // Generate pedagogical in-game thinking coaching
      generatePedagogicalInsight(move.san, c);

      // Trigger AI reply
      triggerAiMove(c, newHistory);
    } catch {
      // Invalid move
    }
  };

  const generatePedagogicalInsight = (san: string, currentPosition: Chess) => {
    if (san.startsWith('N')) {
      setCoachThought(`Good piece development (${san}). Knights belong toward the center where they command up to 8 squares.`);
      setCoachArrows([]);
    } else if (san.startsWith('B')) {
      setCoachThought(`Active diagonal development with ${san}. Keep an eye on open lines toward the enemy King.`);
    } else if (san === 'O-O' || san === 'O-O-O') {
      setCoachThought(`Castling (${san}) secures your King and activates your Rook toward central files.`);
    } else if (san.includes('x')) {
      setCoachThought(`Capture played (${san}). Always evaluate which piece recaptures and if open files are created.`);
    } else if (san.includes('+')) {
      setCoachThought(`Check delivered (${san})! Force the opponent into defensive concessions.`);
    } else {
      setCoachThought(`Solid positional maneuver (${san}). Coordinate your forces before launching an attack.`);
    }
  };

  const triggerAiMove = (currentPosition: Chess, history: string[]) => {
    setIsAiThinking(true);
    isComputerMoving.current = true;

    setTimeout(() => {
      try {
        const c = new Chess(currentPosition.fen());
        const legalMoves = c.moves({ verbose: true });
        if (legalMoves.length === 0) {
          setIsAiThinking(false);
          isComputerMoving.current = false;
          return;
        }

        // Heuristic AI selection based on difficulty
        let selected = legalMoves[0];

        // Preference: checks, captures, central control
        const captures = legalMoves.filter((m) => m.captured);
        const checks = legalMoves.filter((m) => {
          const test = new Chess(c.fen());
          test.move(m);
          return test.isCheck();
        });
        const centerMoves = legalMoves.filter((m) => ['e4', 'd4', 'e5', 'd5', 'c4', 'Nf3', 'Nc3', 'Nf6', 'Nc6'].includes(m.san));

        if (difficulty === 'master') {
          selected = checks[0] || captures[0] || centerMoves[0] || legalMoves[Math.floor(Math.random() * legalMoves.length)];
        } else if (difficulty === 'club') {
          selected = centerMoves[0] || captures[0] || legalMoves[Math.floor(Math.random() * legalMoves.length)];
        } else {
          selected = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        const reply = c.move(selected);
        if (reply) {
          if (reply.captured) playCaptureSound();
          else if (c.isCheck()) playCheckSound();
          else playMoveSound();

          setGame(c);
          setFen(c.fen());
          setMoveHistory([...history, reply.san]);

          // Coach suggestion for the user's turn
          setCoachThought(
            `Cadet Coach played ${reply.san}. Scan for: 1. Checks, 2. Captures, 3. Threats (CCT).`
          );
          if (reply.captured) {
            setCoachArrows([{ from: reply.from, to: reply.to, color: 'crimson' }]);
          } else {
            setCoachArrows([{ from: reply.from, to: reply.to, color: 'amber' }]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAiThinking(false);
        isComputerMoving.current = false;
      }
    }, 500);
  };

  const handleTakeback = () => {
    if (moveHistory.length < 2) return;
    const c = new Chess();
    const newHistory = moveHistory.slice(0, -2);
    newHistory.forEach((m) => c.move(m));
    setGame(c);
    setFen(c.fen());
    setMoveHistory(newHistory);
    setCoachThought('Takeback granted. Recalculate your candidate moves before executing.');
  };

  // Group moves into pairs (White & Black)
  const movePairs: { num: number; w: string; b?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      w: moveHistory[i],
      b: moveHistory[i + 1],
    });
  }

  const isUserTurn =
    (playerColor === 'white' && game.turn() === 'w') ||
    (playerColor === 'black' && game.turn() === 'b');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0C5] pb-6">
        <div>
          <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45] mb-1">
            Sparring & Tactical Application
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#171717]">
            Play Against Cadet Coach
          </h1>
          <p className="text-xs sm:text-sm text-[#171717]/70 max-w-2xl mt-1">
            Test your curriculum concepts in real-time practice games. Cadet Coach guides your thought process and teaches you how to think before every move.
          </p>
        </div>

        {/* Difficulty & Color Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#E8E3D8] p-1 border border-[#D5D0C5] rounded text-xs">
            {(['novice', 'club', 'master'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-1 px-2.5 rounded font-medium capitalize transition-colors ${
                  difficulty === d
                    ? 'bg-[#315C45] text-white font-semibold'
                    : 'text-[#171717]/70 hover:text-[#171717]'
                }`}
              >
                {d === 'novice' ? 'Novice (800)' : d === 'club' ? 'Club (1400)' : 'Master (2000)'}
              </button>
            ))}
          </div>

          <button
            onClick={() => resetGame(playerColor === 'white' ? 'black' : 'white')}
            className="py-1.5 px-3 bg-[#F5F1E8] hover:bg-[#E8E3D8] border border-[#D5D0C5] text-xs font-semibold rounded text-[#171717] transition-colors flex items-center gap-1.5"
            title="Switch Side"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play as {playerColor === 'white' ? 'Black' : 'White'}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tournament Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[500px]">
            <Chessboard
              fen={fen}
              orientation={playerColor}
              interactive={isUserTurn && !game.isGameOver()}
              onMove={handleUserMove}
              arrowGuide={coachArrows}
              showToolbar={true}
              className="shadow-sm"
            />
          </div>

          {/* Bottom Player Indicators */}
          <div className="w-full max-w-[500px] mt-3 flex items-center justify-between text-xs px-2 text-[#171717]/70">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isUserTurn ? 'bg-[#315C45]' : 'bg-[#D5D0C5]'}`} />
              <span className="font-semibold text-[#171717]">
                {isUserTurn ? 'Your Turn' : 'Coach is calculating...'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTakeback}
                disabled={moveHistory.length < 2}
                className="hover:text-[#171717] disabled:opacity-40 flex items-center gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Takeback</span>
              </button>
              <button
                onClick={() => resetGame()}
                className="hover:text-[#171717] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Game</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Thought Coach & Algebraic Scoresheet */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cadet Coach Thought Analysis ("How to Think About Chess") */}
          <div className="p-6 bg-[#E8E3D8]/60 border border-[#D5D0C5] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#315C45]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Cadet Coach Thought Layer
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#315C45] uppercase">
                Active Analysis
              </span>
            </div>

            <p className="text-xs text-[#171717] leading-relaxed font-sans bg-[#F5F1E8] p-3 border border-[#D5D0C5] rounded">
              {coachThought}
            </p>

            <div className="pt-2 text-[11px] text-[#171717]/70 space-y-1">
              <div className="font-semibold text-[#171717]">Grandmaster Thinking Sequence:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                <li>Identify opponent’s immediate threat or loose pieces.</li>
                <li>Search for forcing candidate moves (Checks, Captures, Threats).</li>
                <li>Verify your King safety before initiating tactical complications.</li>
              </ol>
            </div>
          </div>

          {/* Move Log in Pure Algebraic Notation */}
          <div className="p-5 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Tournament Scoresheet
              </span>
              <span className="text-[11px] font-mono text-[#171717]/60">
                {moveHistory.length} plies played
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
              {movePairs.length === 0 ? (
                <div className="text-[11px] text-[#171717]/50 italic py-2">
                  No moves recorded yet. Make a move on the board to begin.
                </div>
              ) : (
                movePairs.map((pair) => (
                  <div key={pair.num} className="grid grid-cols-12 py-1 px-2 hover:bg-[#E8E3D8] rounded">
                    <span className="col-span-3 text-[#171717]/50">{pair.num}.</span>
                    <span className="col-span-4 font-semibold text-[#171717]">{pair.w}</span>
                    <span className="col-span-5 font-semibold text-[#315C45]">{pair.b || ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
