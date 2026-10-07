import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { Chessboard, BoxHighlight, ArrowGuideItem, BoardThemeId } from '../chess/Chessboard';
import { PieceSet } from '../chess/ChessPieces';
import { OPENINGS_DATA } from '../../data/openingsData';
import { ChessOpeningLesson } from '../../types/chess';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playSuccessSound,
  playErrorSound,
} from '../../lib/chess/soundEffects';
import {
  Bot,
  Sparkles,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Send,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Award,
  BookOpen,
  Target,
  Compass,
  Zap,
  Swords,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export interface AiTrainerProps {
  onBackToDashboard?: () => void;
  userRating?: number;
}

interface GameMoveStep {
  ply: number;
  san: string;
  fen: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  classification?: 'BRILLIANT' | 'BEST' | 'GOOD' | 'INACCURACY' | 'MISTAKE' | 'BLUNDER' | 'BOOK';
  evalStr?: string;
  coachCommentary?: string;
  arrows?: ArrowGuideItem[];
  boxes?: BoxHighlight[];
  betterMove?: { san: string; from: string; to: string; reason: string };
}

// Curated Masterclass Games including the exact references from user images
const FEATURED_GAMES = [
  {
    id: 'centre-game',
    title: 'Centre Game: Dynamic Opening & Tactics',
    subtitle: 'Centre Game Accepted: Normal Variation (Reference Image 2)',
    whitePlayer: { name: 'JuanayCarlos', rating: 539, flag: '🇺🇸' },
    blackPlayer: { name: 'vittalacharya', rating: 546, flag: '🇮🇳' },
    openingName: 'Centre Game (C22)',
    pgn: '1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qd1 Nf6 5. Bg5 h6 6. Bxf6 Qxf6 7. Nc3 Bb4 8. Qd2 d6 9. Nf3 O-O',
  },
  {
    id: 'sigma-tactics',
    title: 'Tactical Pin & Knight Outpost Maneuver',
    subtitle: 'King & Rook Pin with Knight Infiltration (Reference Image 1)',
    whitePlayer: { name: 'Grandmaster Sigma', rating: 2650, flag: '🌐' },
    blackPlayer: { name: 'Cadet Challenger', rating: 1450, flag: '⚔️' },
    openingName: 'Endgame Tactics & Pins',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Neg5 O-O-O',
  },
  {
    id: 'morphy-opera',
    title: 'Morphy’s Immortal Opera House Game',
    subtitle: 'Paul Morphy vs Duke of Brunswick & Count Isouard (Paris 1858)',
    whitePlayer: { name: 'Paul Morphy', rating: 2700, flag: '🇺🇸' },
    blackPlayer: { name: 'Duke & Count', rating: 1800, flag: '🇫🇷' },
    openingName: 'Philidor Defense',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#',
  },
];

export const AiTrainer: React.FC<AiTrainerProps> = ({ userRating = 1250 }) => {
  // Mode selection: 'analysis' | 'play' | 'openings' | 'blunder_challenge'
  const [activeMode, setActiveMode] = useState<'analysis' | 'play' | 'openings' | 'blunder_challenge'>('analysis');

  // Active game in analysis
  const [selectedGameIdx, setSelectedGameIdx] = useState(0);
  const currentGame = FEATURED_GAMES[selectedGameIdx];

  // Game step history parsed from PGN
  const [moveHistory, setMoveHistory] = useState<GameMoveStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Board appearance
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>('wood');
  const [pieceSet, setPieceSet] = useState<PieceSet>('neo');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  // AI Coach state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'coach'; text: string; tag?: string }[]
  >([
    {
      sender: 'coach',
      text: `Hello! I'm Grandmaster Sigma, your personal AI Chess Coach. Step through any move, ask me about plans, or test yourself with tactical challenges!`,
    },
  ]);
  const [userInputQuestion, setUserInputQuestion] = useState('');
  const [customPgnInput, setCustomPgnInput] = useState('');
  const [showPgnModal, setShowPgnModal] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);

  // Opening Trainer state
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>('op-italian-game');
  const selectedOpening = useMemo(() => {
    return OPENINGS_DATA.find((o) => o.id === selectedOpeningId) || OPENINGS_DATA[0];
  }, [selectedOpeningId]);
  const [openingMoveIdx, setOpeningMoveIdx] = useState(0);

  // Interactive Play with Coach
  const [playFen, setPlayFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  const [coachAlert, setCoachAlert] = useState<string>('Make your first move as White!');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Parse PGN moves into step history
  useEffect(() => {
    try {
      const chess = new Chess();
      const pgn = currentGame.pgn;
      chess.loadPgn(pgn);
      const verboseMoves = chess.history({ verbose: true });

      const replayChess = new Chess();
      const steps: GameMoveStep[] = [
        {
          ply: 0,
          san: 'Start',
          fen: replayChess.fen(),
          from: '',
          to: '',
          color: 'w',
          classification: 'BOOK',
          evalStr: '0.0',
          coachCommentary: 'Initial tournament starting position. White has first-move initiative.',
        },
      ];

      verboseMoves.forEach((m, idx) => {
        const moveRes = replayChess.move({ from: m.from, to: m.to, promotion: m.promotion });
        const ply = idx + 1;
        const isWhite = m.color === 'w';

        // Rich pedagogical annotations per game step
        let classification: GameMoveStep['classification'] = 'GOOD';
        let evalStr = '0.0';
        let commentary = '';
        let arrows: ArrowGuideItem[] = [];
        let boxes: BoxHighlight[] = [];

        // Center Game annotations (Reference Image 2)
        if (currentGame.id === 'centre-game') {
          if (m.san === 'e4' || m.san === 'e5') {
            classification = 'BOOK';
            evalStr = '+0.2';
            commentary = 'Classical King’s Pawn opening controlling vital central squares.';
          } else if (m.san === 'd4') {
            classification = 'BOOK';
            evalStr = '+0.3';
            commentary = '1. d4 initiates the Center Game, immediately challenging Black’s e5 pawn.';
            arrows = [{ from: 'd2', to: 'd4', color: 'emerald' }];
          } else if (m.san === 'exd4') {
            classification = 'BOOK';
            evalStr = '+0.3';
            commentary = 'Capturing on d4 is standard, deflecting White’s pawn.';
          } else if (m.san === 'Qxd4') {
            classification = 'GOOD';
            evalStr = '+0.2';
            commentary = 'The Queen enters the center early. Watch out for Black developing with tempo via ...Nc6!';
            arrows = [{ from: 'd1', to: 'd4', color: 'blue' }];
          } else if (m.san === 'Nc6') {
            classification = 'BEST';
            evalStr = '-0.1';
            commentary = 'Developing with tempo! Attacks the white Queen and accelerates queenside activity.';
            arrows = [{ from: 'b8', to: 'c6', color: 'emerald' }];
            boxes = [{ square: 'c6', color: 'green' }];
          } else if (m.san === 'Qd1') {
            classification = 'INACCURACY';
            evalStr = '-0.5';
            commentary = 'Retreating all the way to d1 loses two tempi. 4. Qe3 (the Paulsen attack) is sharper.';
            arrows = [{ from: 'd4', to: 'd1', color: 'amber', dashed: true }];
            boxes = [{ square: 'd1', color: 'amber' }];
          } else if (m.san === 'Nf6') {
            classification = 'BEST';
            evalStr = '-0.7';
            commentary = 'Excellent piece activity! Both Black knights dominate the center.';
          } else if (m.san === 'Bg5') {
            classification = 'GOOD';
            evalStr = '-0.5';
            commentary = 'Pins the Knight on f6 to the Queen, contesting kingside development.';
            arrows = [{ from: 'c1', to: 'g5', color: 'emerald' }];
          } else if (m.san === 'h6') {
            classification = 'BEST';
            evalStr = '-0.8';
            commentary = 'Puts the question to the Bishop immediately: trade or retreat.';
            arrows = [{ from: 'h7', to: 'h6', color: 'emerald' }];
          }
        }
        // Sigma Tactics Game (Reference Image 1: Pin & Knight fork)
        else if (currentGame.id === 'sigma-tactics') {
          if (ply === 10) {
            classification = 'BRILLIANT';
            evalStr = '+2.4';
            commentary = 'Masterclass! The Knight coordinates with the Rook to pin and paralyze Black’s king.';
            // Exact arrows from Reference Image 1:
            // 1. Green bent knight arrow: e3 -> e5 -> f5
            // 2. Red dashed threat arrow from King d6 -> f5
            arrows = [
              { from: 'e3', to: 'f5', color: 'emerald' },
              { from: 'd6', to: 'f5', color: 'red', dashed: true },
            ];
            // Green square box on f5, Red square box on d6 (exact match to Image 1!)
            boxes = [
              { square: 'f5', color: 'green' },
              { square: 'd6', color: 'red' },
            ];
          }
        }
        // Morphy Opera Game
        else if (currentGame.id === 'morphy-opera') {
          if (m.san === 'Bxb5+') {
            classification = 'BEST';
            evalStr = '+3.5';
            commentary = 'Morphy sacrifices material to maintain crushing open diagonals against the uncastled king.';
            arrows = [{ from: 'c4', to: 'b5', color: 'emerald' }];
          } else if (m.san === 'Rd8#') {
            classification = 'BRILLIANT';
            evalStr = '#M0';
            commentary = 'Checkmate! The rook delivers back-rank checkmate after the magnificent Queen sacrifice on b8!';
            arrows = [{ from: 'd1', to: 'd8', color: 'emerald' }];
            boxes = [{ square: 'd8', color: 'green' }];
          }
        }

        steps.push({
          ply,
          san: m.san,
          fen: replayChess.fen(),
          from: m.from,
          to: m.to,
          color: m.color,
          classification,
          evalStr,
          coachCommentary: commentary || `Move ${ply}: ${m.san}. Position evaluated at ${evalStr}.`,
          arrows,
          boxes,
        });
      });

      setMoveHistory(steps);
      setCurrentStepIndex(steps.length > 5 ? 4 : 0);
    } catch (e) {
      console.error('Failed to parse PGN:', e);
    }
  }, [currentGame]);

  // Current active step in analysis
  const currentStep = moveHistory[currentStepIndex] || moveHistory[0] || {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    san: 'Start',
    ply: 0,
    evalStr: '0.0',
    coachCommentary: 'Position ready for review.',
  };

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch AI Coach live analysis whenever the step changes
  useEffect(() => {
    if (!currentStep) return;
    const fetchCoachInsight = async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/ai-coach/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fen: currentStep.fen,
            playedMove: currentStep.san,
            history: moveHistory.slice(0, currentStepIndex + 1).map((s) => s.san),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCoachAnalysis(data);
        }
      } catch (err) {
        console.warn('Live AI coach fetch error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchCoachInsight();
  }, [currentStepIndex, currentStep?.fen]);

  // Navigation handlers
  const handleFirstMove = () => setCurrentStepIndex(0);
  const handlePrevMove = () => setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  const handleNextMove = () => setCurrentStepIndex((prev) => Math.min(moveHistory.length - 1, prev + 1));
  const handleLastMove = () => setCurrentStepIndex(moveHistory.length - 1);

  // Ask Coach Question handler
  const handleAskCoach = async (queryText?: string) => {
    const q = (queryText || userInputQuestion).trim();
    if (!q) return;

    setUserInputQuestion('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);

    try {
      const res = await fetch('/api/ai-coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: currentStep.fen,
          question: q,
          userRating,
          history: moveHistory.slice(0, currentStepIndex + 1).map((s) => s.san),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: data.answer || "That's a vital question. Focus on central piece control and king safety.",
            tag: data.conceptTag,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: `In this position, look for central outposts and coordination between your rooks and knights. Keep your king sheltered!`,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: `In this position, control the open files and prevent opponent counterplay against your pawn structure.`,
        },
      ]);
    }
  };

  // Play with AI Coach Move
  const handlePlayMove = (move: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n'; san: string; fen: string }) => {
    playMoveSound();
    setPlayFen(move.fen);
    const updatedHistory = [...playHistory, move.san];
    setPlayHistory(updatedHistory);

    // AI Opponent Response after realistic 600ms
    setTimeout(() => {
      try {
        const c = new Chess(move.fen);
        if (c.isGameOver()) {
          setCoachAlert(c.isCheckmate() ? 'Checkmate! Game Over.' : 'Draw!');
          return;
        }

        const legal = c.moves({ verbose: true });
        // Prioritize checks, captures, or smart central moves
        const captureOrCheck = legal.filter((m) => m.captured || m.san.includes('+'));
        const reply = captureOrCheck.length > 0 ? captureOrCheck[0] : legal[Math.floor(Math.random() * legal.length)];

        if (reply) {
          c.move(reply);
          if (reply.captured) {
            playCaptureSound();
          } else if (c.isCheck()) {
            playCheckSound();
          } else {
            playMoveSound();
          }

          setPlayFen(c.fen());
          setPlayHistory([...updatedHistory, reply.san]);
          setCoachAlert(`Coach Sigma played ${reply.san}. Look for responses that challenge the center!`);
        }
      } catch (err) {
        console.error('Play AI error:', err);
      }
    }, 600);
  };

  // Opening Trainer Sequence
  const openingSteps = selectedOpening.movesSequence || [];
  const currentOpeningFen = useMemo(() => {
    if (openingSteps.length === 0) return selectedOpening.startingFen;
    const step = openingSteps[Math.min(openingMoveIdx, openingSteps.length - 1)];
    return step?.fenAfter || selectedOpening.startingFen;
  }, [selectedOpening, openingMoveIdx, openingSteps]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 space-y-6">
      {/* Top Breadcrumb & AI Coach Master Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                AI Chess Trainer
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Coach Sigma 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized Grandmaster Analysis, Game Review & Opening Mastery inspired by Chessigma.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveMode('analysis')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'analysis'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Game Review</span>
          </button>

          <button
            onClick={() => setActiveMode('openings')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'openings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Openings Trainer</span>
          </button>

          <button
            onClick={() => setActiveMode('play')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeMode === 'play'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Play vs Coach</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: GAME REVIEW & ANALYSIS (Inspired by Reference Image 1 & Image 2) */}
      {/* ========================================================================= */}
      {activeMode === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: PLAYER HEADERS, EVAL BAR, CHESSBOARD & PGN CONTROLS */}
          <div className="lg:col-span-7 flex flex-col items-center gap-3">
            {/* Top Game Selector Pill Bar */}
            <div className="flex items-center justify-between w-full max-w-[500px] text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {FEATURED_GAMES.map((g, idx) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGameIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedGameIdx === idx
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {g.id === 'centre-game' ? 'Centre Game' : g.id === 'sigma-tactics' ? 'Knight Pin' : 'Morphy'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentStep.fen);
                  setCopiedFen(true);
                  setTimeout(() => setCopiedFen(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono"
                title="Copy FEN"
              >
                {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFen ? 'Copied' : 'FEN'}</span>
              </button>
            </div>

            {/* Black Player Header (Image 2 style) */}
            <div className="flex items-center justify-between w-full max-w-[500px] px-2 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                  {currentGame.blackPlayer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-200 leading-none">
                    <span>{currentGame.blackPlayer.name}</span>
                    <span className="text-[11px] text-slate-400">({currentGame.blackPlayer.rating})</span>
                    <span>{currentGame.blackPlayer.flag}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Black</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="font-mono-nums text-xs font-semibold text-slate-400">
                {currentStep.color === 'b' ? 'Thinking...' : 'Waiting'}
              </div>
            </div>

            {/* The Chessboard with live Evaluation Bar, Box Highlights & Arrows */}
            <div className="w-full max-w-[500px] flex justify-center">
              <Chessboard
                fen={currentStep.fen}
                orientation={orientation}
                interactive={false}
                arrowGuide={currentStep.arrows || coachAnalysis?.suggestedArrows || []}
                boxHighlights={currentStep.boxes || coachAnalysis?.suggestedBoxes || []}
                showEvalBar={true}
                evalScore={currentStep.evalStr || coachAnalysis?.evalString || '0.0'}
                theme={boardTheme}
                pieceSet={pieceSet}
                className="w-full"
              />
            </div>

            {/* White Player Header (Image 2 style) */}
            <div className="flex items-center justify-between w-full max-w-[500px] px-2 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                  {currentGame.whitePlayer.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-200 leading-none">
                    <span>{currentGame.whitePlayer.name}</span>
                    <span className="text-[11px] text-slate-400">({currentGame.whitePlayer.rating})</span>
                    <span>{currentGame.whitePlayer.flag}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">White</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="font-mono-nums text-xs font-semibold text-slate-400">
                {currentStep.color === 'w' ? 'Thinking...' : 'Waiting'}
              </div>
            </div>

            {/* Step-by-Step PGN Controller Bar (Image 2 style) */}
            <div className="flex items-center justify-between w-full max-w-[500px] px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={handleFirstMove}
                  disabled={currentStepIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title="First Move"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrevMove}
                  disabled={currentStepIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title="Previous Move"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMove}
                  disabled={currentStepIndex >= moveHistory.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title="Next Move"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLastMove}
                  disabled={currentStepIndex >= moveHistory.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title="Last Move"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Move indicator */}
              <div className="text-xs font-mono text-slate-300 font-bold">
                Ply {currentStep.ply}: <span className="text-emerald-400">{currentStep.san}</span>
              </div>

              {/* Theme & Orientation toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Flip Board"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const themes: BoardThemeId[] = ['wood', 'blue', 'green', 'dark'];
                    const next = themes[(themes.indexOf(boardTheme) + 1) % themes.length];
                    setBoardTheme(next);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors capitalize font-medium"
                  title="Switch Board Theme"
                >
                  {boardTheme}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: AI COACH SIGMA COPILOT, MOVE CLASSIFICATION & Q&A */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Opening Badge & Title Card (Image 2 style) */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{currentGame.openingName}</span>
                </div>
                {/* Classification Badge */}
                {currentStep.classification && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${
                      currentStep.classification === 'BRILLIANT'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : currentStep.classification === 'BEST'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : currentStep.classification === 'GOOD'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        : currentStep.classification === 'INACCURACY'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}
                  >
                    {currentStep.classification} ({currentStep.evalStr})
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-display">
                  {currentGame.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentGame.subtitle}
                </p>
              </div>

              {/* Coach Sigma Commentary */}
              <div className="p-3 bg-slate-950/80 border border-slate-850 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-display">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Coach Sigma’s Breakdown:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {coachAnalysis?.explanation || currentStep.coachCommentary}
                </p>
              </div>
            </div>

            {/* Move History Grid (Image 2 style: 2-column move notation table) */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 px-1">
                <span>Move Notation History</span>
                <span className="text-[11px] text-slate-500 font-mono-nums">
                  {moveHistory.length - 1} plies
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto pr-1 space-y-1 text-xs font-mono">
                {Array.from({ length: Math.ceil((moveHistory.length - 1) / 2) }).map((_, rowIdx) => {
                  const whitePly = rowIdx * 2 + 1;
                  const blackPly = rowIdx * 2 + 2;
                  const whiteStep = moveHistory[whitePly];
                  const blackStep = moveHistory[blackPly];

                  return (
                    <div
                      key={rowIdx}
                      className="grid grid-cols-12 py-1 px-1.5 rounded-lg hover:bg-slate-850 transition-colors items-center"
                    >
                      <span className="col-span-2 text-slate-500 font-bold">{rowIdx + 1}.</span>
                      {whiteStep && (
                        <button
                          onClick={() => setCurrentStepIndex(whitePly)}
                          className={`col-span-5 text-left px-2 py-0.5 rounded transition-all flex items-center justify-between ${
                            currentStepIndex === whitePly
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{whiteStep.san}</span>
                          {whiteStep.classification === 'BRILLIANT' && <span className="text-cyan-400 text-[10px]">!!</span>}
                          {whiteStep.classification === 'BEST' && <span className="text-emerald-400 text-[10px]">★</span>}
                          {whiteStep.classification === 'INACCURACY' && <span className="text-amber-400 text-[10px]">?!</span>}
                        </button>
                      )}
                      {blackStep && (
                        <button
                          onClick={() => setCurrentStepIndex(blackPly)}
                          className={`col-span-5 text-left px-2 py-0.5 rounded transition-all flex items-center justify-between ${
                            currentStepIndex === blackPly
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{blackStep.san}</span>
                          {blackStep.classification === 'BRILLIANT' && <span className="text-cyan-400 text-[10px]">!!</span>}
                          {blackStep.classification === 'BEST' && <span className="text-emerald-400 text-[10px]">★</span>}
                          {blackStep.classification === 'INACCURACY' && <span className="text-amber-400 text-[10px]">?!</span>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* "Ask Coach Sigma" Interactive Conversational Panel */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col h-64">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ask Coach Sigma</span>
                </div>
                <span className="text-[10px] text-slate-500">Powered by Gemini AI</span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-750'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.tag && (
                      <span className="text-[9px] text-emerald-400 font-mono mt-0.5 px-1">
                        Topic: {msg.tag}
                      </span>
                    )}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-[11px]">
                <button
                  onClick={() => handleAskCoach("What is White's best strategic plan here?")}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
                >
                  💡 Best Plan?
                </button>
                <button
                  onClick={() => handleAskCoach('What tactical threats should I watch out for?')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
                >
                  ⚠️ Tactical Threats?
                </button>
                <button
                  onClick={() => handleAskCoach('Evaluate the pawn structure and weaknesses.')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 whitespace-nowrap transition-colors"
                >
                  ♟️ Pawn Structure?
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={userInputQuestion}
                  onChange={(e) => setUserInputQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCoach()}
                  placeholder="Ask Coach Sigma anything about this position..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleAskCoach()}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  title="Send Question"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: OPENING REPERTOIRE TRAINER WITH AI COACH */}
      {/* ========================================================================= */}
      {activeMode === 'openings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Repertoire List */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Select Opening Repertoire (20)</span>
            </h3>

            <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
              {OPENINGS_DATA.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOpeningId(op.id);
                    setOpeningMoveIdx(0);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition-all border ${
                    selectedOpeningId === op.id
                      ? 'bg-slate-800 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs text-slate-100">{op.name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">{op.eco}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{op.tagline}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Board & Coach Theory */}
          <div className="lg:col-span-8 flex flex-col lg:flex-row gap-6 items-center">
            {/* Board */}
            <div className="w-full max-w-[440px] shrink-0">
              <Chessboard
                fen={currentOpeningFen}
                orientation="white"
                interactive={false}
                theme={boardTheme}
                pieceSet={pieceSet}
                showCoordinates={true}
                className="w-full"
              />

              {/* Move Stepper */}
              <div className="flex items-center justify-between mt-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setOpeningMoveIdx((prev) => Math.max(0, prev - 1))}
                  disabled={openingMoveIdx === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors"
                >
                  Previous
                </button>
                <span className="font-mono font-bold text-emerald-400">
                  Move {openingMoveIdx + 1} of {openingSteps.length}
                </span>
                <button
                  onClick={() => setOpeningMoveIdx((prev) => Math.min(openingSteps.length - 1, prev + 1))}
                  disabled={openingMoveIdx >= openingSteps.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-semibold transition-colors"
                >
                  Next Move
                </button>
              </div>
            </div>

            {/* Opening Theory & AI Coach Insights */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {selectedOpening.eco} · {selectedOpening.family}
                </span>
                <h2 className="text-2xl font-bold text-white font-display mt-0.5">
                  {selectedOpening.name}
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedOpening.philosophy}
                </p>
              </div>

              {/* Strategic Plans for White & Black */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-300">White's Primary Plans</span>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    {selectedOpening.whitePlans.slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Black's Counterplay</span>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    {selectedOpening.blackPlans.slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Signature Variations */}
              {selectedOpening.keyVariations && selectedOpening.keyVariations.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-white block">Key Repertoire Variations:</span>
                  <div className="space-y-1.5">
                    {selectedOpening.keyVariations.slice(0, 2).map((v, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-semibold text-emerald-300">{v.name}: </span>
                        <span className="font-mono text-slate-300">{v.moves}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: PLAY VS AI COACH WITH REAL-TIME TEACHING */}
      {/* ========================================================================= */}
      {activeMode === 'play' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full max-w-[480px] px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white">Grandmaster Sigma (AI)</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">Live Teaching Mode</span>
            </div>

            <div className="w-full max-w-[480px]">
              <Chessboard
                fen={playFen}
                orientation="white"
                interactive={true}
                onMove={handlePlayMove}
                theme={boardTheme}
                pieceSet={pieceSet}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-[480px] px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => {
                  setPlayFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
                  setPlayHistory([]);
                  setCoachAlert('New game initialized. Make your move!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart Game</span>
              </button>
              <span className="text-slate-400 font-mono">You are White</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Coach Sigma Live Advice</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {coachAlert}
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-2">
              <span className="text-xs font-bold text-white block">Moves Played:</span>
              <div className="max-h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {playHistory.map((m, idx) => (
                  <span key={idx} className="inline-block mr-2 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                    {idx % 2 === 0 ? `${idx / 2 + 1}. ` : ''}
                    {m}
                  </span>
                ))}
                {playHistory.length === 0 && <span className="text-slate-500 font-sans">No moves played yet.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
