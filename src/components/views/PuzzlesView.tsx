import React, { useState, useMemo } from 'react';
import { Exercise, TacticalConcept } from '../../types/chess';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import { AdaptiveLearningEngine } from '../../services/adaptiveLearningEngine';
import {
  Flame,
  Award,
  Zap,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Layers,
} from 'lucide-react';

interface PuzzlesViewProps {
  learningRating: number;
  onRatingChange: (newRating: number, delta: number) => void;
  onXpGained: (xp: number) => void;
}

const CATEGORY_FILTERS: { label: string; concept?: TacticalConcept }[] = [
  { label: 'All Puzzles' },
  { label: 'Forks', concept: 'FORK' },
  { label: 'Pins', concept: 'PIN' },
  { label: 'Skewers', concept: 'SKEWER' },
  { label: 'Back-Rank', concept: 'BACK_RANK_MATE' },
  { label: 'Discovered', concept: 'DISCOVERED_ATTACK' },
  { label: 'Deflection', concept: 'DEFLECTION' },
  { label: 'Endgames', concept: 'OPPOSITION' },
];

export const PuzzlesView: React.FC<PuzzlesViewProps> = ({
  learningRating,
  onRatingChange,
  onXpGained,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TacticalConcept | 'ALL'>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'ALL'>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(3);
  const [solvedInSession, setSolvedInSession] = useState(0);
  const [ratingChangeNotice, setRatingChangeNotice] = useState<number | null>(null);

  // Filter puzzles based on selected category and difficulty
  const filteredPuzzles = useMemo(() => {
    return PUZZLES_DATA.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        p.concept === selectedCategory ||
        (selectedCategory === 'OPPOSITION' && (p.concept === 'OPPOSITION' || p.concept === 'PASSED_PAWNS'));
      const matchesDiff =
        selectedDifficulty === 'ALL' || p.difficulty === selectedDifficulty;
      return matchesCategory && matchesDiff;
    });
  }, [selectedCategory, selectedDifficulty]);

  // Ensure current index is within bounds of filtered list
  const activePuzzle =
    filteredPuzzles.length > 0
      ? filteredPuzzles[currentIndex % filteredPuzzles.length]
      : PUZZLES_DATA[0];

  const handlePuzzleSolved = (result: { attempts: number; hintsUsed: number; xp: number }) => {
    const { newRating, change } = AdaptiveLearningEngine.updateLearningRating(
      learningRating,
      activePuzzle.difficulty,
      true,
      result.hintsUsed
    );

    setCurrentStreak((prev) => prev + 1);
    setSolvedInSession((prev) => prev + 1);
    setRatingChangeNotice(change);
    onRatingChange(newRating, change);
    onXpGained(result.xp);

    setTimeout(() => {
      setRatingChangeNotice(null);
    }, 3500);
  };

  const handleNext = () => {
    setRatingChangeNotice(null);
    setCurrentIndex((prev) => (prev + 1) % filteredPuzzles.length);
  };

  const handlePrev = () => {
    setRatingChangeNotice(null);
    setCurrentIndex((prev) => (prev - 1 + filteredPuzzles.length) % filteredPuzzles.length);
  };

  const currentPuzzleNumber = (currentIndex % filteredPuzzles.length) + 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Puzzle Learning Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Course & Context */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span className="text-emerald-400 font-semibold tracking-wide">
                Tactics Arena 2.0
              </span>
              <span aria-hidden="true">·</span>
              <span>{activePuzzle.concept.replace(/_/g, ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>
                Puzzle {currentPuzzleNumber} of {filteredPuzzles.length}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
              {activePuzzle.concept.replace(/_/g, ' ')} Masterclass
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Solve interactive tactical miniatures. Analyze variations, study why alternatives fail,
              and solidify permanent chess patterns.
            </p>
          </div>

          {/* Right: Live Player Stats Ribbon */}
          <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs font-mono-nums">
            {/* Learning Rating */}
            <div className="text-right">
              <span className="text-slate-500 block uppercase text-[10px] font-medium">
                Learning Rating
              </span>
              <div className="flex items-center justify-end gap-1.5 text-base sm:text-lg font-bold text-slate-100">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{learningRating}</span>
                {ratingChangeNotice !== null && (
                  <span className="text-xs text-emerald-400 font-bold animate-bounce">
                    +{ratingChangeNotice}
                  </span>
                )}
              </div>
            </div>

            {/* Streak */}
            <div className="text-right border-l border-slate-800 pl-4 sm:pl-6">
              <span className="text-slate-500 block uppercase text-[10px] font-medium">
                Puzzle Streak
              </span>
              <div className="flex items-center justify-end gap-1.5 text-base sm:text-lg font-bold text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500" />
                <span>{currentStreak}</span>
              </div>
            </div>

            {/* Solved Session */}
            <div className="text-right border-l border-slate-800 pl-4 sm:pl-6">
              <span className="text-slate-500 block uppercase text-[10px] font-medium">
                Session Solved
              </span>
              <div className="flex items-center justify-end gap-1.5 text-base sm:text-lg font-bold text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>{solvedInSession}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full">
            {CATEGORY_FILTERS.map((cat, idx) => {
              const isSelected =
                (cat.concept === undefined && selectedCategory === 'ALL') ||
                selectedCategory === cat.concept;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedCategory(cat.concept || 'ALL');
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Quick Puzzle Steppers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={filteredPuzzles.length <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
              title="Previous Puzzle"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-1">
              {currentPuzzleNumber} / {filteredPuzzles.length}
            </span>
            <button
              onClick={handleNext}
              disabled={filteredPuzzles.length <= 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
              title="Next Puzzle"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Exercise Runner */}
      <div className="w-full">
        <ExerciseEngine
          key={activePuzzle.id}
          exercise={activePuzzle}
          onSolve={handlePuzzleSolved}
          onNext={handleNext}
          showNextButton={true}
        />
      </div>
    </div>
  );
};
