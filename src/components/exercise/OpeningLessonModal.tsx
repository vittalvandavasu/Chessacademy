import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Chess } from 'chess.js';
import { ChessOpeningLesson } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { playMoveSound, playCaptureSound, playCheckSound } from '../../lib/chess/soundEffects';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Award,
  BookOpen,
  Shield,
  Swords,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Target,
} from 'lucide-react';

interface OpeningLessonModalProps {
  opening: ChessOpeningLesson;
  onClose: () => void;
  onCompleteOpening: (openingId: string, xpReward: number) => void;
  isCompleted?: boolean;
}

type ModalTab = 'walkthrough' | 'drill' | 'strategy' | 'traps-quiz';

export const OpeningLessonModal: React.FC<OpeningLessonModalProps> = ({
  opening,
  onClose,
  onCompleteOpening,
  isCompleted = false,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('walkthrough');

  // Walkthrough State
  // Flatten moves into half-moves for granular stepping
  const halfMoves = useMemo(() => {
    const list: {
      moveNumber: number;
      turn: 'w' | 'b';
      san: string;
      explanation: string;
      fen: string;
      prevFen: string;
    }[] = [];

    const sim = new Chess(opening.startingFen);
    for (const step of opening.movesSequence) {
      const prevFenW = sim.fen();
      sim.move(step.white.san);
      list.push({
        moveNumber: step.moveNumber,
        turn: 'w',
        san: step.white.san,
        explanation: step.white.explanation,
        fen: sim.fen(),
        prevFen: prevFenW,
      });

      if (step.black) {
        const prevFenB = sim.fen();
        sim.move(step.black.san);
        list.push({
          moveNumber: step.moveNumber,
          turn: 'b',
          san: step.black.san,
          explanation: step.black.explanation,
          fen: sim.fen(),
          prevFen: prevFenB,
        });
      }
    }
    return list;
  }, [opening]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = startingFen
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drill State ("Play the Opening on Board")
  const [drillStepIndex, setDrillStepIndex] = useState<number>(0); // which half-move the student is on
  const [drillFen, setDrillFen] = useState<string>(opening.startingFen);
  const [drillFeedback, setDrillFeedback] = useState<{
    type: 'success' | 'error' | 'hint' | 'complete' | null;
    message: string;
  }>({
    type: null,
    message: 'Make the opening move on the board to begin the masterclass drill.',
  });
  const [drillShowHint, setDrillShowHint] = useState<boolean>(false);
  const [drillCompleted, setDrillCompleted] = useState<boolean>(isCompleted);
  const [drillResetKey, setDrillResetKey] = useState<number>(0);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Current FEN for Walkthrough
  const currentWalkthroughFen = useMemo(() => {
    if (currentStepIndex === -1) return opening.startingFen;
    return halfMoves[currentStepIndex]?.fen || opening.startingFen;
  }, [currentStepIndex, halfMoves, opening.startingFen]);

  // Current highlights for walkthrough
  const currentHighlights = useMemo(() => {
    if (currentStepIndex === -1) return [];
    const move = halfMoves[currentStepIndex];
    if (!move) return [];
    // Extract squares from chess.js move history
    try {
      const c = new Chess(move.prevFen);
      const res = c.move(move.san);
      if (res) return [res.from, res.to];
    } catch {
      // fallback
    }
    return [];
  }, [currentStepIndex, halfMoves]);

  // Arrows for Walkthrough
  const currentArrows = useMemo(() => {
    if (currentHighlights.length === 2) {
      return [{ from: currentHighlights[0], to: currentHighlights[1], color: '#10b981' }];
    }
    return [];
  }, [currentHighlights]);

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= halfMoves.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          playMoveSound();
          return prev + 1;
        });
      }, 1800);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, halfMoves.length]);

  // Cleanup auto-play when tab changes
  useEffect(() => {
    setIsAutoPlaying(false);
  }, [activeTab]);

  // Walkthrough navigation handlers
  const handleStepForward = () => {
    if (currentStepIndex < halfMoves.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      playMoveSound();
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex((prev) => prev - 1);
      playMoveSound();
    }
  };

  const handleResetWalkthrough = () => {
    setIsAutoPlaying(false);
    setCurrentStepIndex(-1);
    playMoveSound();
  };

  // DRILL HANDLER: Physical Board Interaction
  const handleDrillMove = (moveData: { from: string; to: string; san: string; fen: string }) => {
    if (drillCompleted || drillStepIndex >= halfMoves.length) return;

    const expectedHalfMove = halfMoves[drillStepIndex];
    if (!expectedHalfMove) return;

    // Check if the user's move matches the expected book move
    const isCorrect =
      moveData.san.replace('+', '').replace('#', '') ===
      expectedHalfMove.san.replace('+', '').replace('#', '');

    if (isCorrect) {
      // Correct user move!
      playMoveSound();
      setDrillShowHint(false);
      setDrillFen(moveData.fen);

      const nextIndex = drillStepIndex + 1;

      if (nextIndex >= halfMoves.length) {
        // Entire sequence finished!
        playCheckSound();
        setDrillCompleted(true);
        setDrillStepIndex(nextIndex);
        setDrillFeedback({
          type: 'complete',
          message: `Masterclass Complete! You played the full theoretical line for ${opening.name} flawlessly!`,
        });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onCompleteOpening(opening.id, 50);
        return;
      }

      // Check if the NEXT move is the opponent's reply
      const opponentHalfMove = halfMoves[nextIndex];
      if (opponentHalfMove) {
        setDrillFeedback({
          type: 'success',
          message: `Excellent! ${expectedHalfMove.san}: ${expectedHalfMove.explanation}`,
        });

        // Opponent replies automatically after short delay
        setTimeout(() => {
          const sim = new Chess(moveData.fen);
          const replyRes = sim.move(opponentHalfMove.san);
          if (replyRes) {
            playMoveSound();
            const newOpponentFen = sim.fen();
            setDrillFen(newOpponentFen);
            setDrillResetKey((k) => k + 1);

            const afterOpponentIndex = nextIndex + 1;
            setDrillStepIndex(afterOpponentIndex);

            if (afterOpponentIndex >= halfMoves.length) {
              setDrillCompleted(true);
              setDrillFeedback({
                type: 'complete',
                message: `Masterclass Complete! You played the theoretical line for ${opening.name} to perfection.`,
              });
              confetti({ particleCount: 70, spread: 60 });
              onCompleteOpening(opening.id, 50);
            } else {
              const nextUserMove = halfMoves[afterOpponentIndex];
              setDrillFeedback({
                type: 'success',
                message: `Book response: ${opponentHalfMove.san} (${opponentHalfMove.explanation}). Now play ${nextUserMove.san}!`,
              });
            }
          }
        }, 550);
      }
    } else {
      // Inaccurate move
      playCaptureSound();
      setDrillFeedback({
        type: 'error',
        message: `In ${opening.name}, the theoretical recommendation here is not ${moveData.san}. Try to find the thematic plan!`,
      });
      // Revert board to current drill FEN
      setDrillResetKey((k) => k + 1);
    }
  };

  const handleRestartDrill = () => {
    setDrillStepIndex(0);
    setDrillFen(opening.startingFen);
    setDrillCompleted(false);
    setDrillShowHint(false);
    setDrillResetKey((k) => k + 1);
    setDrillFeedback({
      type: null,
      message: `Drill restarted. Make move 1 for White: ${halfMoves[0]?.san}`,
    });
    playMoveSound();
  };

  // Highlight hint squares during drill
  const drillHintHighlights = useMemo(() => {
    if (!drillShowHint || drillStepIndex >= halfMoves.length) return [];
    const move = halfMoves[drillStepIndex];
    if (!move) return [];
    try {
      const c = new Chess(drillFen);
      const res = c.move(move.san);
      if (res) return [res.from, res.to];
    } catch {
      // ignore
    }
    return [];
  }, [drillShowHint, drillStepIndex, halfMoves, drillFen]);

  const drillHintArrows = useMemo(() => {
    if (drillHintHighlights.length === 2) {
      return [{ from: drillHintHighlights[0], to: drillHintHighlights[1], color: '#f59e0b' }];
    }
    return [];
  }, [drillHintHighlights]);

  // Quiz submission handler
  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = (qIdx: number) => {
    setQuizSubmitted((prev) => ({ ...prev, [qIdx]: true }));
    const q = opening.quizQuestions?.[qIdx];
    if (q && quizAnswers[qIdx] === q.correctIndex) {
      playCheckSound();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      onCompleteOpening(opening.id, 25);
    } else {
      playCaptureSound();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[96vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              {opening.eco}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="opening-modal-title" className="text-lg sm:text-xl font-bold text-slate-100 font-display">
                  {opening.name}
                </h2>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mastered</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                {opening.movesSan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hidden md:inline">
              Difficulty: {opening.difficulty} / 5
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'walkthrough'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Move Walkthrough</span>
          </button>

          <button
            onClick={() => setActiveTab('drill')}
            className={`py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'drill'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Play on Board Drill</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'strategy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Plans & Pawn Structure</span>
          </button>

          <button
            onClick={() => setActiveTab('traps-quiz')}
            className={`py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'traps-quiz'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Traps & Mastery Quiz</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: MOVE-BY-MOVE WALKTHROUGH */}
          {activeTab === 'walkthrough' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Chessboard Column */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <Chessboard
                  fen={currentWalkthroughFen}
                  orientation="white"
                  interactive={false}
                  highlightSquares={currentHighlights}
                  arrowGuide={currentArrows}
                  showToolbar={true}
                  className="w-full max-w-[440px]"
                />

                {/* Walkthrough Controls */}
                <div className="flex items-center justify-center gap-3 mt-4 w-full max-w-[420px]">
                  <button
                    onClick={handleResetWalkthrough}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                    title="Reset to initial position"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleStepBackward}
                    disabled={currentStepIndex === -1}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700"
                    title="Previous move"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Auto-Play</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleStepForward}
                    disabled={currentStepIndex >= halfMoves.length - 1}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700"
                    title="Next move"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Commentary & Move Navigation Column */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between h-full">
                {/* Tagline & Philosophy */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Opening Core Concept</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 font-display">
                    {opening.tagline}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {opening.philosophy}
                  </p>
                </div>

                {/* Move List Pills */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Move Sequence
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentStepIndex(-1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                        currentStepIndex === -1
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Start
                    </button>
                    {halfMoves.map((step, idx) => {
                      const isCurrent = currentStepIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsAutoPlaying(false);
                            setCurrentStepIndex(idx);
                            playMoveSound();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                            isCurrent
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {step.turn === 'w' ? `${step.moveNumber}. ` : `${step.moveNumber}... `}
                          {step.san}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Move Deep Coaching */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-inner min-h-[140px] flex flex-col justify-center">
                  {currentStepIndex === -1 ? (
                    <div>
                      <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">
                        INITIAL POSITION
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Click <strong className="text-emerald-300">Next</strong> or select any move above to analyze the theoretical development and tactical purpose of each move.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          MOVE {halfMoves[currentStepIndex].moveNumber} ({halfMoves[currentStepIndex].turn === 'w' ? 'WHITE' : 'BLACK'}):{' '}
                          <span className="text-white text-sm">{halfMoves[currentStepIndex].san}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Step {currentStepIndex + 1} of {halfMoves.length}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {halfMoves[currentStepIndex].explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Action to Drill */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab('drill')}
                    className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <span>Test Yourself: Play on Board</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE PHYSICAL BOARD DRILL */}
          {activeTab === 'drill' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Chessboard Column */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <Chessboard
                  fen={drillFen}
                  orientation="white"
                  interactive={!drillCompleted}
                  onMove={handleDrillMove}
                  highlightSquares={drillHintHighlights}
                  arrowGuide={drillHintArrows}
                  resetKey={drillResetKey}
                  showToolbar={true}
                  className="w-full max-w-[440px]"
                />

                <div className="flex items-center justify-between gap-3 mt-4 w-full max-w-[440px]">
                  <button
                    onClick={handleRestartDrill}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restart Drill</span>
                  </button>

                  <button
                    onClick={() => setDrillShowHint(!drillShowHint)}
                    disabled={drillCompleted}
                    className="py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{drillShowHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                </div>
              </div>

              {/* Coaching Feedback & Instructions */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Interactive Muscle Memory Training
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Progress: {Math.min(drillStepIndex, halfMoves.length)} / {halfMoves.length} moves
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${(Math.min(drillStepIndex, halfMoves.length) / halfMoves.length) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Play the moves of the <strong className="text-emerald-400">{opening.name}</strong> on the board.
                    When you make the correct move, the theoretical purpose will be revealed and your virtual opponent will automatically play the book defense!
                  </p>
                </div>

                {/* Active Coach Diagnosis Message */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    drillFeedback.type === 'complete'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : drillFeedback.type === 'error'
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : drillFeedback.type === 'success'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {drillFeedback.type === 'complete' ? (
                      <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : drillFeedback.type === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : drillFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                        {drillFeedback.type === 'complete'
                          ? 'Opening Mastered! (+50 XP)'
                          : drillFeedback.type === 'error'
                          ? 'Theoretical Inaccuracy'
                          : drillFeedback.type === 'success'
                          ? 'Thematic Move Executed'
                          : 'Grandmaster Coach'}
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed">
                        {drillFeedback.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hint Box */}
                {drillShowHint && !drillCompleted && drillStepIndex < halfMoves.length && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Hint: The next theoretical move is{' '}
                      <strong className="text-amber-200 font-mono">{halfMoves[drillStepIndex]?.san}</strong>.
                      Look at the highlighted squares on the board!
                    </span>
                  </div>
                )}

                {/* Next Steps Buttons */}
                {drillCompleted && (
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('strategy')}
                      className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Learn Grandmaster Plans</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('traps-quiz')}
                      className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Take Retention Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STRATEGIC PLANS & PAWN STRUCTURE */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Dual Column: White Plans vs Black Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* White Plans */}
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                    <Swords className="w-4 h-4" />
                    <span>White’s Core Strategic Plans</span>
                  </div>
                  <ul className="space-y-2.5">
                    {opening.whitePlans.map((plan, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Black Plans */}
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
                    <Shield className="w-4 h-4" />
                    <span>Black’s Counter-Attacking Plans</span>
                  </div>
                  <ul className="space-y-2.5">
                    {opening.blackPlans.map((plan, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pawn Structure & Center Dynamics */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Key Pawn Structure & Center Dynamics</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {opening.keyPawnStructure}
                </p>
              </div>

              {/* Key Variations */}
              {opening.keyVariations && opening.keyVariations.length > 0 && (
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Critical Branching Variations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opening.keyVariations.map((v, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-xs font-bold text-slate-200 font-display mb-1">
                          {v.name}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 mb-1">
                          {v.moves}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {v.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legendary Grandmasters */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Mastered By World Champions & Legends
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {opening.famousChampions.map((champ, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700"
                      >
                        {champ}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('traps-quiz')}
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue to Traps & Quiz</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DEADLY TRAPS & MASTERY QUIZ */}
          {activeTab === 'traps-quiz' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Famous Trap Section */}
              {opening.famousTrap && (
                <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Deadly Trap Warning: {opening.famousTrap.name}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
                    {opening.famousTrap.description}
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-rose-300 border border-rose-900/40">
                    <span className="text-slate-500 mr-2">Sequence:</span>
                    {opening.famousTrap.moves}
                  </div>
                </div>
              )}

              {/* Interactive Retention Quiz */}
              {opening.quizQuestions && opening.quizQuestions.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>Mastery Retention Questions</span>
                  </div>

                  {opening.quizQuestions.map((q, qIdx) => {
                    const selectedOpt = quizAnswers[qIdx];
                    const isSub = quizSubmitted[qIdx];
                    const isCorrect = selectedOpt === q.correctIndex;

                    return (
                      <div
                        key={qIdx}
                        className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4"
                      >
                        <h4 className="text-sm font-semibold text-slate-100 font-display">
                          {qIdx + 1}. {q.question}
                        </h4>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selectedOpt === optIdx;
                            let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white';

                            if (isSub) {
                              if (optIdx === q.correctIndex) {
                                btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                              } else if (isChosen) {
                                btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-300';
                              } else {
                                btnStyle = 'bg-slate-900/40 border-slate-850 text-slate-500';
                              }
                            } else if (isChosen) {
                              btnStyle = 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold';
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isSub}
                                onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                                className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isSub && optIdx === q.correctIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {!isSub ? (
                          <button
                            disabled={selectedOpt === undefined}
                            onClick={() => handleSubmitQuiz(qIdx)}
                            className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold text-xs transition-colors"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <div
                            className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                              isCorrect
                                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                                : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
                            }`}
                          >
                            <span className="font-bold block mb-1">
                              {isCorrect ? '✓ Correct!' : '✗ Explanation:'}
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Completion Celebration Footer */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Ready to play {opening.name} in competitive matches!</span>
                </div>
                <button
                  onClick={onClose}
                  className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
