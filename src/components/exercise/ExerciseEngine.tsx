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
  Target,
  Brain,
  Award,
  Check,
  Compass,
  ChevronRight,
  BookmarkCheck,
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

type CoachPhase = 'observe' | 'candidates' | 'execute' | 'masterclass';

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
  const [moveVerdict, setMoveVerdict] = useState<string>('');
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
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [isAnalysisMode, setIsAnalysisMode] = useState<boolean>(false);
  const [lastPlayedSan, setLastPlayedSan] = useState<string>('');

  // Coach Thinking Process Stage
  const [coachPhase, setCoachPhase] = useState<CoachPhase>(
    exercise.observationPrompt || exercise.learningObjective ? 'observe' : 'execute'
  );

  // Review Quiz State
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

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
    setSelectedQuizIndex(null);
    setIsQuizSubmitted(false);
    setCoachPhase(
      exercise.observationPrompt || exercise.learningObjective ? 'observe' : 'execute'
    );
    isComputerMoving.current = false;
  }, [exercise]);

  // Handle Progressive Hint request
  const handleRequestHint = () => {
    const nextTier = Math.min(4, hintTier + 1);
    setHintTier(nextTier);

    const cHint = exercise.hints?.conceptHint || exercise.conceptHint;
    const aHint = exercise.hints?.areaHint || exercise.areaHint;
    const pHint = exercise.hints?.pieceHint || exercise.pieceHint;
    const mHint = exercise.hints?.moveHint || exercise.moveHint;

    if (nextTier === 1) {
      setFeedbackMessage(cHint);
    } else if (nextTier === 2) {
      setFeedbackMessage(`${cHint} Target area: ${aHint}`);
    } else if (nextTier === 3) {
      setFeedbackMessage(`Piece hint: ${pHint}.`);
    } else if (nextTier === 4) {
      setFeedbackMessage(`Winning move: ${mHint}`);
      // Show directional arrow
      const target = exercise.solution || exercise.targetMoves[0];
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

    // Automatically transition to 'execute' phase when a move is attempted
    if (coachPhase !== 'execute') {
      setCoachPhase('execute');
    }

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
        setMoveVerdict(serverResult.verdict || 'TACTICAL_WIN');
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
          setCoachPhase('masterclass');
          playSuccessSound();
          confetti({
            particleCount: 60,
            spread: 70,
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
        setMoveVerdict(serverResult.verdict || 'MISCALCULATION');

        // Diagnose mistake category
        let diagCat = 'Tactical Oversight';
        if (serverResult.verdict === 'HANGING_PIECE') diagCat = 'Hanging Piece';
        else if (serverResult.verdict === 'PREMATURE_CHECK') diagCat = 'Premature Check';
        else if (moveInfo.san.includes('+')) diagCat = 'Premature Check';
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
          setCoachPhase('masterclass');
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
              hintTier >= 1 ? (exercise.hints?.conceptHint || exercise.conceptHint) : 'Examine piece safety and try again.'
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

  const handleSelectQuizOption = (index: number) => {
    if (isQuizSubmitted) return;
    setSelectedQuizIndex(index);
    setIsQuizSubmitted(true);
    if (exercise.reviewQuestion && index === exercise.reviewQuestion.correctIndex) {
      playSuccessSound();
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    } else {
      playErrorSound();
    }
  };

  const handleResetQuiz = () => {
    setSelectedQuizIndex(null);
    setIsQuizSubmitted(false);
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
  const effectiveObjective = exercise.learningObjective || exercise.objective;
  const effectiveTacticalExpl = exercise.tacticalExplanation || exercise.explanation;
  const effectiveCalcExpl = exercise.calculationExplanation || exercise.consequence;
  const effectivePrinciple = exercise.transferablePrinciple || exercise.principleToRemember;

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
          showToolbar={true}
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

      {/* Codecademy for Chess: Masterclass Pedagogical Deck */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between min-h-0 lg:min-h-[510px] shadow-xl">
        <div className="space-y-4">
          {/* Top Category & Hierarchy Header */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-emerald-400">
                {exercise.type.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-500 font-medium">
                {exercise.lessonTitle || exercise.title || 'Interactive Masterclass Lesson'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
              {exercise.title || `${exercise.concept.replace(/_/g, ' ')} Masterclass`}
            </h3>

            {effectiveObjective && (
              <div className="flex items-start gap-2 text-xs text-slate-300 mt-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wide block">
                    Learning Objective
                  </span>
                  {effectiveObjective}
                </p>
              </div>
            )}
          </div>

          {/* Coach Thinking Stepper Ribbon (Codecademy for Chess) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setCoachPhase('observe')}
              className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                coachPhase === 'observe'
                  ? 'bg-slate-800 text-emerald-300 shadow-xs border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Observe</span>
            </button>

            <button
              onClick={() => setCoachPhase('candidates')}
              className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                coachPhase === 'candidates'
                  ? 'bg-slate-800 text-emerald-300 shadow-xs border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Plan</span>
            </button>

            <button
              onClick={() => setCoachPhase('execute')}
              className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                coachPhase === 'execute'
                  ? 'bg-slate-800 text-emerald-300 shadow-xs border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Calculate</span>
            </button>

            <button
              onClick={() => setCoachPhase('masterclass')}
              className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                coachPhase === 'masterclass'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40'
                  : status === 'correct'
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Masterclass</span>
              {status === 'correct' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* PHASE 1: OBSERVE & CONTEXT */}
          {coachPhase === 'observe' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {exercise.positionContext && (
                <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs sm:text-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Position Context
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {exercise.positionContext}
                  </p>
                </div>
              )}

              {exercise.observationPrompt && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs sm:text-sm flex items-start gap-3">
                  <Eye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      What Should You Notice?
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {exercise.observationPrompt}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Tip: Look for unprotected pieces and king sightlines.
                </span>
                <button
                  onClick={() => setCoachPhase('candidates')}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Form a Plan & Candidates</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 2: PLAN & GENERATE CANDIDATES */}
          {coachPhase === 'candidates' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {exercise.thinkingPrompt && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm flex items-start gap-3">
                  <Brain className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Grandmaster Thinking Process
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {exercise.thinkingPrompt}
                    </p>
                  </div>
                </div>
              )}

              {exercise.candidateMovePrompt && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs sm:text-sm">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    Candidate Moves to Calculate
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {exercise.candidateMovePrompt}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl text-xs text-slate-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Forcing Moves Checklist
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 bg-slate-900 rounded-md border border-slate-800">
                    <span className="text-emerald-400 font-bold block">1. Checks</span>
                    <span className="text-slate-400 text-[10px]">Does any move give check?</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded-md border border-slate-800">
                    <span className="text-amber-400 font-bold block">2. Captures</span>
                    <span className="text-slate-400 text-[10px]">Are any pieces undefended?</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded-md border border-slate-800">
                    <span className="text-blue-400 font-bold block">3. Threats</span>
                    <span className="text-slate-400 text-[10px]">Can we fork or pin?</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCoachPhase('observe')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Back to Observation
                </button>
                <button
                  onClick={() => setCoachPhase('execute')}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Ready: Make Move on Board</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: CALCULATE & EXECUTE */}
          {coachPhase === 'execute' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Feedback & Result Box */}
              {feedbackMessage ? (
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
                            ? moveVerdict === 'CHECKMATE'
                              ? 'Checkmate Delivered!'
                              : moveVerdict === 'DECISIVE_FORK'
                              ? 'Winning Fork Executed!'
                              : moveVerdict === 'DECISIVE_PIN'
                              ? 'Winning Pin Executed!'
                              : moveVerdict === 'DECISIVE_SKEWER'
                              ? 'Winning Skewer Executed!'
                              : 'Tactical Move Verified!'
                            : status === 'incorrect'
                            ? moveVerdict === 'HANGING_PIECE' || diagnosticCategory === 'Hanging Piece'
                              ? 'Blunder: Piece Left Hanging!'
                              : moveVerdict === 'PREMATURE_CHECK' || diagnosticCategory === 'Premature Check'
                              ? 'Premature Check (Check ≠ Advantage)'
                              : `Not Quite: ${diagnosticCategory || 'Tactical Oversight'}`
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
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-emerald-400 block mb-0.5">
                      Your Turn to Calculate & Move
                    </span>
                    <p className="text-slate-400 text-xs">
                      Drag or click pieces on the board to execute your chosen tactic.
                    </p>
                  </div>
                  <span className="text-amber-400 text-xs font-mono">
                    Need help? Use hints below ↓
                  </span>
                </div>
              )}

              {/* Solved Quick Callout */}
              {status === 'correct' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-medium">
                    Tactical line solved cleanly!
                  </span>
                  <button
                    onClick={() => setCoachPhase('masterclass')}
                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View Masterclass Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHASE 4: MASTERCLASS BREAKDOWN & UNDERSTAND (Deep Codecademy Lesson) */}
          {coachPhase === 'masterclass' && (
            <div className="space-y-4 animate-in fade-in duration-200 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {/* Tactical Mechanism Card */}
              {effectiveTacticalExpl && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs sm:text-sm">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Tactical Mechanism</span>
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {effectiveTacticalExpl}
                  </p>
                </div>
              )}

              {/* Calculation Depth Card */}
              {effectiveCalcExpl && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs sm:text-sm">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Calculation & Continuation Lines</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed font-mono text-xs">
                    {effectiveCalcExpl}
                  </p>
                </div>
              )}

              {/* Why Alternatives Fail Card */}
              {exercise.whyAlternativesFail && exercise.whyAlternativesFail.length > 0 && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                    Why Alternatives Fail
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {Array.isArray(exercise.whyAlternativesFail) &&
                      exercise.whyAlternativesFail.map((failStr, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-400 font-bold shrink-0">✕</span>
                          <span>{typeof failStr === 'string' ? failStr : (failStr as any).whyItFails}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Recognition Cues */}
              {exercise.recognitionCues && exercise.recognitionCues.length > 0 && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                    How To Spot This in Real Games (Recognition Cues)
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {exercise.recognitionCues.map((cue, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transferable Principle */}
              {effectivePrinciple && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/40 rounded-xl text-xs sm:text-sm flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Transferable Grandmaster Principle
                    </span>
                    <p className="text-slate-100 font-medium leading-relaxed">
                      {effectivePrinciple}
                    </p>
                  </div>
                </div>
              )}

              {/* Real Game Application Heritage */}
              {exercise.realGameApplication && (
                <div className="p-3 bg-slate-800/30 border border-slate-700/60 rounded-xl text-xs text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tournament & World Championship Heritage</span>
                  </span>
                  <p>{exercise.realGameApplication}</p>
                </div>
              )}

              {/* Interactive Retention Review Question */}
              {exercise.reviewQuestion && (
                <div className="p-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Coach Retention Quiz</span>
                    </span>
                    {isQuizSubmitted && (
                      <button
                        onClick={handleResetQuiz}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Try Again
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-100">
                    {exercise.reviewQuestion.question}
                  </p>

                  <div className="space-y-1.5">
                    {exercise.reviewQuestion.options.map((option, idx) => {
                      const isSelected = selectedQuizIndex === idx;
                      const isCorrect = idx === exercise.reviewQuestion?.correctIndex;

                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';
                      if (isQuizSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-950/80 border-red-500/80 text-red-200 line-through';
                        } else {
                          btnStyle = 'opacity-50 bg-slate-900 border-slate-800 text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuizOption(idx)}
                          disabled={isQuizSubmitted}
                          className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug pt-0.5">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isQuizSubmitted && (
                    <div
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        selectedQuizIndex === exercise.reviewQuestion.correctIndex
                          ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-950/50 border border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <span className="font-bold block mb-0.5">
                        {selectedQuizIndex === exercise.reviewQuestion.correctIndex
                          ? '✓ Correct! Coach Note:'
                          : '✕ Inaccurate. Key takeaway:'}
                      </span>
                      {exercise.reviewQuestion.explanation}
                    </div>
                  )}
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
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Masterclass Lesson Completed!</span>
                </span>
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
