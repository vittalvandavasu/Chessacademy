import React, { useState, useEffect, useRef } from 'react';
import { Exercise, AlternativeMove } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ChessEngine } from '../../lib/chess/chessEngine';
import { playMoveSound } from '../../lib/chess/soundEffects';
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
  RotateCcw,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface AnalysisBoardProps {
  exercise: Exercise;
  userPlayedMove?: string;
  onExitAnalysis?: () => void;
  onOpenConcept?: () => void;
}

interface PlyPosition {
  ply: number;
  san: string;
  fen: string;
  annotation?: string;
  from?: string;
  to?: string;
  isUserMove: boolean;
  comment?: string;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  exercise,
  userPlayedMove,
  onExitAnalysis,
  onOpenConcept,
}) => {
  const [orientation, setOrientation] = useState<'white' | 'black'>(
    exercise.initialOrientation || 'white'
  );
  const [positions, setPositions] = useState<PlyPosition[]>([]);
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeMove | null>(null);
  const [previewFen, setPreviewFen] = useState<string | null>(null);
  const [activeArrows, setActiveArrows] = useState<{ from: string; to: string; color?: string }[]>([]);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build the complete solution sequence plies from initial position
  useEffect(() => {
    const list: PlyPosition[] = [];
    const engine = new ChessEngine(exercise.fen);

    // Initial position (ply 0)
    list.push({
      ply: 0,
      san: 'Start',
      fen: exercise.fen,
      isUserMove: false,
      comment: exercise.observationPrompt || 'Starting puzzle position.',
    });

    // Compute steps from solutionSequence or targetMoves
    if (exercise.solutionSequence && exercise.solutionSequence.length > 0) {
      exercise.solutionSequence.forEach((step, idx) => {
        const userMoveObj = engine.makeSanMove(step.userMove);
        if (userMoveObj) {
          list.push({
            ply: list.length,
            san: userMoveObj.san,
            fen: engine.fen,
            annotation: step.annotation || '!',
            from: userMoveObj.from,
            to: userMoveObj.to,
            isUserMove: true,
            comment: step.explanation || exercise.explanation,
          });
        }

        if (step.opponentReply) {
          const compMoveObj = engine.makeSanMove(step.opponentReply);
          if (compMoveObj) {
            list.push({
              ply: list.length,
              san: compMoveObj.san,
              fen: engine.fen,
              from: compMoveObj.from,
              to: compMoveObj.to,
              isUserMove: false,
              comment: 'Opponent forced defensive response.',
            });
          }
        }
      });
    } else if (exercise.targetMoves.length > 0) {
      const firstTarget = exercise.targetMoves[0];
      const moveObj = engine.makeSanMove(firstTarget);
      if (moveObj) {
        list.push({
          ply: 1,
          san: moveObj.san,
          fen: engine.fen,
          annotation: '!',
          from: moveObj.from,
          to: moveObj.to,
          isUserMove: true,
          comment: exercise.explanation,
        });
      }
    }

    setPositions(list);
    // Default to the final solved ply
    setCurrentPlyIndex(list.length - 1);
  }, [exercise]);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentPlyIndex((prev) => {
          if (prev >= positions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          playMoveSound();
          return prev + 1;
        });
      }, 1200);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, positions.length]);

  const currentPosition = positions[currentPlyIndex] || {
    fen: exercise.fen,
    san: 'Start',
    comment: '',
  };

  const currentBoardFen = previewFen || currentPosition.fen;

  const goToPly = (idx: number) => {
    setIsPlaying(false);
    setPreviewFen(null);
    setSelectedAlternative(null);
    const clamped = Math.max(0, Math.min(positions.length - 1, idx));
    setCurrentPlyIndex(clamped);
    playMoveSound();

    const targetPos = positions[clamped];
    if (targetPos?.from && targetPos?.to) {
      setActiveArrows([{ from: targetPos.from, to: targetPos.to, color: 'emerald' }]);
    } else {
      setActiveArrows([]);
    }
  };

  const handleShowAlternative = (alt: AlternativeMove) => {
    setSelectedAlternative(alt);
    const tempEngine = new ChessEngine(exercise.fen);
    const moveRes = tempEngine.makeSanMove(alt.san);
    if (moveRes) {
      setPreviewFen(tempEngine.fen);
      setActiveArrows([{ from: moveRes.from, to: moveRes.to, color: 'amber' }]);
      playMoveSound();
    }
  };

  const handleClearAlternative = () => {
    setSelectedAlternative(null);
    setPreviewFen(null);
    setActiveArrows([]);
  };

  // Build Move pairs for the move list (1. e4 e5, 2. Nf3 Nc6)
  const movePairs: { turnNum: number; whitePly?: PlyPosition; blackPly?: PlyPosition }[] = [];
  const pliesOnly = positions.slice(1);
  for (let i = 0; i < pliesOnly.length; i += 2) {
    const turnNum = Math.floor(i / 2) + 1;
    movePairs.push({
      turnNum,
      whitePly: pliesOnly[i],
      blackPly: pliesOnly[i + 1],
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto p-1 sm:p-2">
      {/* Board Column */}
      <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[480px] shrink-0 mx-auto flex flex-col gap-3">
        <div className="relative">
          <Chessboard
            fen={currentBoardFen}
            orientation={orientation}
            interactive={false}
            arrowGuide={activeArrows}
            showToolbar={true}
            className="shadow-2xl"
          />

          {previewFen && (
            <div className="absolute top-2 left-2 bg-amber-500/90 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 backdrop-blur-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Previewing Alternative: {selectedAlternative?.san}</span>
            </div>
          )}
        </div>

        {/* Board Controls Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => goToPly(0)}
              disabled={currentPlyIndex === 0}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First move (Home)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(currentPlyIndex - 1)}
              disabled={currentPlyIndex === 0}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous move (Left arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
              title={isPlaying ? 'Pause' : 'Autoplay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => goToPly(currentPlyIndex + 1)}
              disabled={currentPlyIndex >= positions.length - 1}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next move (Right arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(positions.length - 1)}
              disabled={currentPlyIndex >= positions.length - 1}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last move (End)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-1.5 text-xs"
              title="Flip Board"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>
            {previewFen && (
              <button
                onClick={handleClearAlternative}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-md transition-colors"
              >
                Reset View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Deck & Deep Pedagogical breakdown */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400 block mb-0.5">
                Post-Puzzle Tactical Analysis
              </span>
              <h2 className="text-xl font-bold text-slate-100 font-display">
                {exercise.concept.replace(/_/g, ' ')} Breakdown
              </h2>
            </div>
            {onOpenConcept && (
              <button
                onClick={onOpenConcept}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Concept Guide</span>
              </button>
            )}
          </div>

          {/* Synchronized Move List */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
              Principal Solution Variation
            </span>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
              <button
                onClick={() => goToPly(0)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  currentPlyIndex === 0 && !previewFen
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Start
              </button>
              {movePairs.map((pair) => (
                <div key={pair.turnNum} className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs">{pair.turnNum}.</span>
                  {pair.whitePly && (
                    <button
                      onClick={() => goToPly(pair.whitePly!.ply)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                        currentPlyIndex === pair.whitePly.ply && !previewFen
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {pair.whitePly.san}
                      {pair.whitePly.annotation && (
                        <span className="text-amber-400 ml-0.5">{pair.whitePly.annotation}</span>
                      )}
                    </button>
                  )}
                  {pair.blackPly && (
                    <button
                      onClick={() => goToPly(pair.blackPly!.ply)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        currentPlyIndex === pair.blackPly.ply && !previewFen
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {pair.blackPly.san}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Structured "Why This Move?" 4-Quadrant Card */}
          {exercise.whyThisMove ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-3">
                Why This Move Works
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold mb-1">
                    Tactical Idea
                  </span>
                  <span className="font-semibold text-slate-200">{exercise.whyThisMove.tacticalIdea}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold mb-1">
                    Primary Target
                  </span>
                  <span className="font-semibold text-slate-200">{exercise.whyThisMove.target}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold mb-1">
                    Key Feature
                  </span>
                  <span className="text-slate-300 leading-relaxed">{exercise.whyThisMove.keyFeature}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase text-[10px] font-semibold mb-1">
                    Why It Works
                  </span>
                  <span className="text-slate-300 leading-relaxed">{exercise.whyThisMove.whyItWorks}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                Instructional Note
              </span>
              <p className="leading-relaxed">{exercise.explanation}</p>
            </div>
          )}

          {/* Candidate Alternatives Explorer */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Why Meaningful Alternatives Fail
              </span>
              <div className="space-y-2">
                {exercise.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-amber-300">{alt.san}?</span>
                        {alt.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300 font-medium">
                            {alt.category}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 leading-relaxed">{alt.whyItFails}</p>
                    </div>

                    <button
                      onClick={() => handleShowAlternative(alt)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shrink-0 self-start sm:self-center"
                    >
                      Show On Board
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Principle To Remember */}
          {exercise.principleToRemember && (
            <div className="bg-gradient-to-r from-emerald-950/30 via-slate-800/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-400 block mb-0.5">
                  Pattern To Remember
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {exercise.principleToRemember}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-5 border-t border-slate-800 flex items-center justify-between mt-4">
          <span className="text-xs text-slate-400">
            Use move buttons or arrow keys to navigate variations.
          </span>
          {onExitAnalysis && (
            <button
              onClick={onExitAnalysis}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-all text-xs flex items-center gap-1.5"
            >
              <span>Return to Exercise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
