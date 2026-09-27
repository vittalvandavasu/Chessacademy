import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Exercise, TacticalConcept } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ChessEngine } from '../../lib/chess/chessEngine';
import {
  playSuccessSound,
  playErrorSound,
  playMoveSound,
  toggleSound,
  isSoundEnabled,
} from '../../lib/chess/soundEffects';
import { Square } from 'chess.js';
import { ApiClient } from '../../services/apiClient';
import { ConceptCardModal } from './ConceptCardModal';
import { AnalysisBoard } from './AnalysisBoard';
import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  BookOpen,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExerciseEngineProps {
  exercise: Exercise;
  onSolve?: (result: {
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    xp: number;
    ratingDelta?: number;
    newRating?: number;
    newTotalXp?: number;
  }) => void;
  onNext?: () => void;
  showNextButton?: boolean;
}

export const ExerciseEngine: React.FC<ExerciseEngineProps> = ({
  exercise,
  onSolve,
  onNext,
  showNextButton = true,
}) => {
  const [currentFen, setCurrentFen] = useState(exercise.fen);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'evaluating' | 'correct' | 'incorrect'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [diagnosticCategory, setDiagnosticCategory] = useState<string>('');
  const [hintTier, setHintTier] = useState<number>(0); // 0 = none, 1 = concept, 2 = area, 3 = piece, 4 = move
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [activeArrows, setActiveArrows] = useState<{ from: string; to: string; color?: string }[]>([]);
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const [boardKey, setBoardKey] = useState<number>(0);
  const [orientation, setOrientation] = useState<'white' | 'black'>(
    exercise.initialOrientation || 'white'
  );
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [showObservation, setShowObservation] = useState<boolean>(true);
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [isAnalysisMode, setIsAnalysisMode] = useState<boolean>(false);
  const [lastPlayedSan, setLastPlayedSan] = useState<string>('');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<boolean>(false);

  const isComputerMoving = useRef(false);

  // Reset state when exercise changes
  useEffect(() => {
    setCurrentFen(exercise.fen);
    setStepIndex(0);
    setStatus('idle');
    setFeedbackMessage('');
    setDiagnosticCategory('');
    setHintTier(0);
    setAttempts(0);
    setStartTime(Date.now());
    setActiveArrows(exercise.arrowGuide || []);
    setHighlightSquares(exercise.highlightSquares || []);
    setBoardKey((prev) => prev + 1);
    setOrientation(exercise.initialOrientation || 'white');
    setIsAnalysisMode(false);
    setLastPlayedSan('');
    setShowDetailedBreakdown(false);
    isComputerMoving.current = false;
  }, [exercise]);

  // Handle Progressive Hint request
  const handleRequestHint = () => {
    const nextTier = Math.min(4, hintTier + 1);
    setHintTier(nextTier);

    if (nextTier === 1) {
      setFeedbackMessage(exercise.conceptHint);
    } else if (nextTier === 2) {
      setFeedbackMessage(`${exercise.conceptHint} Target area: ${exercise.areaHint}`);
    } else if (nextTier === 3) {
      setFeedbackMessage(`Piece hint: ${exercise.pieceHint}.`);
    } else if (nextTier === 4) {
      setFeedbackMessage(`Winning move: ${exercise.moveHint}`);
      // Show directional arrow
      const target = exercise.targetMoves[0];
      if (target && target.length >= 4) {
        const from = target.slice(0, 2);
        const to = target.slice(2, 4);
        setActiveArrows([{ from, to, color: 'emerald' }]);
      }
    }
  };

  const handleReset = () => {
    setCurrentFen(exercise.fen);
    setStepIndex(0);
    setStatus('idle');
    setFeedbackMessage('');
    setDiagnosticCategory('');
    setBoardKey((prev) => prev + 1);
    setActiveArrows(exercise.arrowGuide || []);
    setHighlightSquares(exercise.highlightSquares || []);
  };

  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundOn(nextState);
  };

  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  };

  const handleUserMove = async (moveInfo: { from: Square; to: Square; san: string; fen: string }) => {
    if (status === 'correct' || isComputerMoving.current) return;

    setAttempts((prev) => prev + 1);
    setStatus('evaluating');
    setLastPlayedSan(moveInfo.san);

    const cleanSan = moveInfo.san.replace(/[+#?!]/g, '').trim();
    const uci = `${moveInfo.from}${moveInfo.to}`;
    const timeTakenMs = Date.now() - startTime;

    try {
      // 1. Authoritative move evaluation request
      const serverResult = await ApiClient.submitExerciseAttempt(exercise.id, {
        from: moveInfo.from,
        to: moveInfo.to,
        promotion: 'q',
        stepIndex,
        hintsUsed: hintTier,
        timeTakenMs,
      });

      if (!serverResult.isLegal) {
        playErrorSound();
        setStatus('incorrect');
        setDiagnosticCategory('Illegal Move');
        setFeedbackMessage(serverResult.explanation || 'Illegal chess move according to FIDE rules.');
        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setBoardKey((k) => k + 1);
          setStatus('idle');
        }, 1200);
        return;
      }

      if (serverResult.isSuccess) {
        if (serverResult.opponentReplySan && !serverResult.isSequenceComplete) {
          // Multi-step continuation: Computer responds
          isComputerMoving.current = true;
          setCurrentFen(moveInfo.fen);
          setFeedbackMessage('Great move! Opponent defending with ' + serverResult.opponentReplySan + '...');

          setTimeout(() => {
            playMoveSound();
            setCurrentFen(serverResult.opponentReplyFen || moveInfo.fen);
            setStepIndex(serverResult.nextStepIndex ?? (stepIndex + 1));
            setStatus('idle');
            setFeedbackMessage('Find the next decisive continuation!');
            isComputerMoving.current = false;
          }, 600);
        } else {
          // Final solve complete!
          setCurrentFen(moveInfo.fen);
          setStatus('correct');
          setFeedbackMessage(serverResult.explanation || exercise.explanation);
          setShowDetailedBreakdown(true);
          playSuccessSound();
          confetti({
            particleCount: 55,
            spread: 65,
            origin: { y: 0.7 },
          });

          const timeSeconds = Math.max(1, Math.round(timeTakenMs / 1000));
          if (onSolve) {
            onSolve({
              attempts: attempts + 1,
              hintsUsed: hintTier,
              timeSeconds,
              xp: serverResult.gamification?.xpAwarded ?? exercise.xp,
              ratingDelta: serverResult.gamification?.ratingDelta,
              newRating: serverResult.gamification?.newRating,
              newTotalXp: serverResult.gamification?.newTotalXp,
            });
          }
        }
      } else {
        // Move was legal but tactically incorrect
        playErrorSound();
        setStatus('incorrect');

        // Diagnose mistake category
        let diagCat = 'Tactical Oversight';
        if (moveInfo.san.includes('+')) diagCat = 'Premature Check';
        else if (moveInfo.san.includes('x')) diagCat = 'Dubious Capture';
        else if (exercise.alternatives?.some((a) => a.san === cleanSan || a.san === moveInfo.san)) {
          const matchedAlt = exercise.alternatives.find(
            (a) => a.san === cleanSan || a.san === moveInfo.san
          );
          if (matchedAlt?.category) diagCat = matchedAlt.category;
        }

        setDiagnosticCategory(diagCat);
        setFeedbackMessage(
          serverResult.explanation ||
            `Not quite the best move. You played ${moveInfo.san}. Examine piece safety and forcing counter-threats.`
        );

        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setBoardKey((k) => k + 1);
          setStatus('idle');
        }, 1400);
      }
    } catch (apiErr) {
      console.warn('Backend evaluation fallback to client engine:', apiErr);

      // Graceful client-side fallback
      let isCorrectMove = false;
      if (exercise.solutionSequence && exercise.solutionSequence.length > stepIndex) {
        const expectedStep = exercise.solutionSequence[stepIndex];
        const cleanExpected = expectedStep.userMove.replace(/[+#?!]/g, '').trim();
        isCorrectMove =
          cleanSan === cleanExpected ||
          uci === expectedStep.userMove ||
          exercise.targetMoves.some((m) => m.replace(/[+#?!]/g, '') === cleanSan || m === uci);
      } else {
        isCorrectMove = exercise.targetMoves.some(
          (m) => m.replace(/[+#?!]/g, '').trim() === cleanSan || m.trim() === uci
        );
      }

      if (isCorrectMove) {
        const currentStepObj = exercise.solutionSequence?.[stepIndex];
        if (currentStepObj?.opponentReply) {
          isComputerMoving.current = true;
          setCurrentFen(moveInfo.fen);
          setFeedbackMessage('Good move! Defending reply...');

          setTimeout(() => {
            const compEngine = new ChessEngine(moveInfo.fen);
            const replyMove = compEngine.makeSanMove(currentStepObj.opponentReply!);
            if (replyMove) {
              playMoveSound();
              setCurrentFen(compEngine.fen);
              setStepIndex((prev) => prev + 1);
              setStatus('idle');
              setFeedbackMessage('Find the next winning continuation!');
              isComputerMoving.current = false;
            }
          }, 600);
        } else {
          setCurrentFen(moveInfo.fen);
          setStatus('correct');
          setFeedbackMessage(exercise.explanation);
          setShowDetailedBreakdown(true);
          playSuccessSound();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });

          const timeSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          if (onSolve) {
            onSolve({
              attempts: attempts + 1,
              hintsUsed: hintTier,
              timeSeconds,
              xp: exercise.xp,
            });
          }
        }
      } else {
        playErrorSound();
        setStatus('incorrect');
        setDiagnosticCategory('Tactical Inaccuracy');
        const customMistake = exercise.commonMistakes?.[cleanSan] || exercise.commonMistakes?.[uci];
        setFeedbackMessage(
          customMistake ||
            `Not quite. You played ${moveInfo.san}. ${
              hintTier >= 1 ? exercise.conceptHint : 'Examine piece safety and try again.'
            }`
        );
        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setBoardKey((k) => k + 1);
          setStatus('idle');
        }, 1400);
      }
    }
  };

  // Switch to Full Analysis Mode
  if (isAnalysisMode) {
    return (
      <>
        <AnalysisBoard
          exercise={exercise}
          userPlayedMove={lastPlayedSan}
          onExitAnalysis={() => setIsAnalysisMode(false)}
          onOpenConcept={() => setShowConceptModal(true)}
        />
        <ConceptCardModal
          concept={exercise.concept}
          isOpen={showConceptModal}
          onClose={() => setShowConceptModal(false)}
        />
      </>
    );
  }

  const turnColorName = (exercise.initialOrientation || 'white') === 'black' ? 'Black' : 'White';

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full max-w-6xl mx-auto p-1 sm:p-2">
      {/* Interactive Board Column */}
      <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] shrink-0 mx-auto flex flex-col gap-2.5">
        {/* Board Header Toolbar */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full border border-slate-600 shadow-xs ${
                turnColorName === 'White' ? 'bg-white' : 'bg-slate-900'
              }`}
            />
            <span className="font-semibold text-slate-200">{turnColorName} to Move</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handleToggleSound}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
              title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <button
              onClick={handleFlipBoard}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
              title="Flip Board"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConceptModal(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-md transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Concept</span>
            </button>
          </div>
        </div>

        {/* The Board */}
        <Chessboard
          key={boardKey}
          resetKey={boardKey}
          fen={currentFen}
          orientation={orientation}
          interactive={status !== 'correct'}
          onMove={handleUserMove}
          highlightSquares={highlightSquares}
          arrowGuide={activeArrows}
          className="shadow-2xl"
        />

        {/* Board Meta Strip */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
          <div className="flex items-center gap-3">
            <span className="font-mono-nums text-[11px] sm:text-xs">
              Difficulty: <span className="text-amber-400 font-bold">{'★'.repeat(exercise.difficulty)}</span>
            </span>
            <span className="font-mono-nums text-emerald-400 flex items-center gap-1 text-[11px] sm:text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> +{exercise.xp} XP
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono-nums">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Attempts: {attempts}</span>
          </div>
        </div>
      </div>

      {/* Exercise Control & Pedagogical Deck */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-0 lg:min-h-[490px] shadow-xl">
        <div className="space-y-4">
          {/* Top Category & Hierarchy Header */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-emerald-400">
                {exercise.type.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-500">
                {exercise.lessonTitle || 'Interactive Mastery Exercise'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
              {exercise.concept.replace(/_/g, ' ')}
            </h3>

            {exercise.objective && (
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Goal: <span className="text-slate-300">{exercise.objective}</span>
              </p>
            )}
          </div>

          {/* "What Should You Notice?" Observation Prompt (Before Move) */}
          {status !== 'correct' && exercise.observationPrompt && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 transition-all">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowObservation(!showObservation)}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>What Should You Notice?</span>
                </div>
                <button className="text-slate-400 hover:text-slate-200">
                  {showObservation ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {showObservation && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2 pt-2 border-t border-slate-800/60">
                  {exercise.observationPrompt}
                </p>
              )}
            </div>
          )}

          {/* Feedback & Result Box */}
          {feedbackMessage && (
            <div
              className={`p-4 rounded-xl text-sm leading-relaxed transition-all shadow-md ${
                status === 'correct'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-100'
                  : status === 'incorrect'
                  ? 'bg-red-950/50 border border-red-500/30 text-red-200'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {status === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : status === 'incorrect' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm block">
                      {status === 'correct'
                        ? 'Decisive Tactical Move!'
                        : status === 'incorrect'
                        ? `Not Quite: ${diagnosticCategory || 'Tactical Oversight'}`
                        : hintTier > 0
                        ? `Hint Level ${hintTier} of 4`
                        : 'Coach Note'}
                    </span>
                    {status === 'incorrect' && lastPlayedSan && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 font-semibold">
                        Played: {lastPlayedSan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{feedbackMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Tier Solved Feedback (Consequence + Principle) */}
          {status === 'correct' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Level 3: Consequence */}
              {exercise.consequence && (
                <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs sm:text-sm">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    Tactical Follow-up (Consequence)
                  </span>
                  <p className="text-slate-300 leading-relaxed font-mono">
                    {exercise.consequence}
                  </p>
                </div>
              )}

              {/* Level 4: Principle to remember */}
              {exercise.principleToRemember && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                      Pattern To Remember
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {exercise.principleToRemember}
                    </p>
                  </div>
                </div>
              )}

              {/* Why This Move Quick Summary */}
              {exercise.whyThisMove && (
                <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Structured Idea
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Idea:</span>
                      <span className="font-semibold text-slate-200">{exercise.whyThisMove.tacticalIdea}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Target:</span>
                      <span className="font-semibold text-slate-200">{exercise.whyThisMove.target}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Navigation Deck */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          {status === 'correct' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-medium px-1">
                <span>Puzzle solved cleanly!</span>
                <span className="font-mono-nums font-bold">+{exercise.xp} XP Awarded</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAnalysisMode(true)}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Analyze Variations</span>
                </button>

                {showNextButton && onNext && (
                  <button
                    onClick={onNext}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <span>Next Exercise</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRequestHint}
                disabled={hintTier >= 4}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {hintTier === 0
                    ? 'Get Hint (1/4)'
                    : hintTier === 1
                    ? 'Show Area (2/4)'
                    : hintTier === 2
                    ? 'Show Piece (3/4)'
                    : hintTier === 3
                    ? 'Show Move (4/4)'
                    : 'All Hints Revealed'}
                </span>
              </button>

              <button
                onClick={handleReset}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                title="Reset position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setIsAnalysisMode(true)}
                className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
                title="Open Analysis Board"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Concept Card Drawer/Modal */}
      <ConceptCardModal
        concept={exercise.concept}
        isOpen={showConceptModal}
        onClose={() => setShowConceptModal(false)}
      />
    </div>
  );
};
