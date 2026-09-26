import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Exercise, ExerciseStep } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ChessEngine } from '../../lib/chess/chessEngine';
import { playSuccessSound, playErrorSound, playMoveSound } from '../../lib/chess/soundEffects';
import { Square } from 'chess.js';
import { ApiClient } from '../../services/apiClient';
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
  const [hintTier, setHintTier] = useState<number>(0); // 0 = none, 1 = concept, 2 = area, 3 = piece, 4 = move
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState<number>(Date.now());
  const [activeArrows, setActiveArrows] = useState<{ from: string; to: string; color?: string }[]>([]);
  const [highlightSquares, setHighlightSquares] = useState<string[]>([]);
  const isComputerMoving = useRef(false);

  // Reset state when exercise changes
  useEffect(() => {
    setCurrentFen(exercise.fen);
    setStepIndex(0);
    setStatus('idle');
    setFeedbackMessage('');
    setHintTier(0);
    setAttempts(0);
    setActiveArrows(exercise.arrowGuide || []);
    setHighlightSquares(exercise.highlightSquares || []);
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
      setFeedbackMessage(`Hint: ${exercise.pieceHint}.`);
    } else if (nextTier === 4) {
      setFeedbackMessage(`Best move: ${exercise.moveHint}`);
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
    setActiveArrows(exercise.arrowGuide || []);
    setHighlightSquares(exercise.highlightSquares || []);
  };

  const handleUserMove = async (moveInfo: { from: Square; to: Square; san: string; fen: string }) => {
    if (status === 'correct' || isComputerMoving.current) return;

    setAttempts((prev) => prev + 1);
    setStatus('evaluating');

    const cleanSan = moveInfo.san.replace(/[+#?!]/g, '').trim();
    const uci = `${moveInfo.from}${moveInfo.to}`;
    const timeTakenMs = Date.now() - startTime;

    try {
      // 1. Send authoritative move evaluation request to backend API
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
        setFeedbackMessage(serverResult.explanation || 'Illegal chess move rejected by server engine.');
        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setStatus('idle');
        }, 1200);
        return;
      }

      if (serverResult.isSuccess) {
        if (serverResult.opponentReplySan && !serverResult.isSequenceComplete) {
          // Multi-step continuation: Computer responds
          isComputerMoving.current = true;
          setCurrentFen(moveInfo.fen);
          setFeedbackMessage('Good move! Defending reply...');

          setTimeout(() => {
            playMoveSound();
            setCurrentFen(serverResult.opponentReplyFen || moveInfo.fen);
            setStepIndex(serverResult.nextStepIndex ?? (stepIndex + 1));
            setStatus('idle');
            setFeedbackMessage('Find the next winning continuation!');
            isComputerMoving.current = false;
          }, 600);
        } else {
          // Final solve complete!
          setStatus('correct');
          setFeedbackMessage(serverResult.explanation || exercise.explanation);
          playSuccessSound();
          confetti({
            particleCount: 50,
            spread: 60,
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
        setFeedbackMessage(serverResult.explanation || 'Not quite. Check unprotected pieces and try again.');
        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setStatus('idle');
        }, 1200);
      }
    } catch (apiErr) {
      console.warn('Backend evaluation fallback to client engine:', apiErr);

      // Graceful client-side fallback if network or custom test position
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
          setStatus('correct');
          setFeedbackMessage(exercise.explanation);
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
        const customMistake = exercise.commonMistakes?.[cleanSan] || exercise.commonMistakes?.[uci];
        setFeedbackMessage(
          customMistake ||
            `Not quite. You played ${moveInfo.san}. ${
              hintTier >= 1 ? exercise.conceptHint : 'Examine Black’s king safety and unprotected pieces.'
            }`
        );
        setTimeout(() => {
          setCurrentFen(exercise.fen);
          setStatus('idle');
        }, 1200);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-5 sm:gap-6 w-full max-w-5xl mx-auto p-1 sm:p-2">
      {/* Interactive Board Column */}
      <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] shrink-0 mx-auto">
        <Chessboard
          fen={currentFen}
          orientation={exercise.initialOrientation || 'white'}
          interactive={status !== 'correct'}
          onMove={handleUserMove}
          highlightSquares={highlightSquares}
          arrowGuide={activeArrows}
          className="shadow-2xl"
        />
        <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-medium">
              {exercise.initialOrientation === 'black' ? 'Black to Move' : 'White to Move'}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="font-mono-nums text-[11px] sm:text-xs">
              Difficulty: {'★'.repeat(exercise.difficulty)}
            </span>
            <span className="font-mono-nums text-amber-400 flex items-center gap-1 text-[11px] sm:text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" /> +{exercise.xp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Exercise Control & Pedagogical Deck */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col justify-between min-h-0 lg:min-h-[440px] shadow-lg">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="uppercase tracking-wider font-semibold text-slate-400">
              {exercise.type.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-2 font-mono-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>Attempts: {attempts}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-100 mb-2 font-display">
            {exercise.concept.replace(/_/g, ' ')}
          </h3>

          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            {status === 'correct'
              ? 'Excellent tactical execution!'
              : 'Interact with the board above to play the correct move.'}
          </p>

          {/* Feedback Box */}
          {feedbackMessage && (
            <div
              className={`p-4 rounded-lg mb-4 text-sm leading-relaxed transition-all ${
                status === 'correct'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : status === 'incorrect'
                  ? 'bg-red-950/50 border border-red-500/30 text-red-200'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {status === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : status === 'incorrect' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block mb-0.5">
                    {status === 'correct'
                      ? 'Decisive Move!'
                      : status === 'incorrect'
                      ? 'Try Again'
                      : `Hint Level ${hintTier}`}
                  </span>
                  <span>{feedbackMessage}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800">
          {status === 'correct' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-medium px-1">
                <span>Problem solved successfully</span>
                <span className="font-mono-nums">+{exercise.xp} XP Earned</span>
              </div>
              {showNextButton && onNext && (
                <button
                  onClick={onNext}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Continue to Next Exercise</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
