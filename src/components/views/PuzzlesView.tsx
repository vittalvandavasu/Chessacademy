import React, { useState } from 'react';
import { Exercise } from '../../types/chess';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import { AdaptiveLearningEngine } from '../../services/adaptiveLearningEngine';
import {
  Flame,
  Award,
  Zap,
  RotateCw,
  TrendingUp,
  Target,
} from 'lucide-react';

interface PuzzlesViewProps {
  learningRating: number;
  onRatingChange: (newRating: number, delta: number) => void;
  onXpGained: (xp: number) => void;
}

export const PuzzlesView: React.FC<PuzzlesViewProps> = ({
  learningRating,
  onRatingChange,
  onXpGained,
}) => {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(3);
  const [ratingChangeNotice, setRatingChangeNotice] = useState<number | null>(null);

  const currentPuzzle = PUZZLES_DATA[puzzleIndex % PUZZLES_DATA.length];

  const handlePuzzleSolved = (result: { attempts: number; hintsUsed: number; xp: number }) => {
    const { newRating, change } = AdaptiveLearningEngine.updateLearningRating(
      learningRating,
      currentPuzzle.difficulty,
      true,
      result.hintsUsed
    );

    setCurrentStreak((prev) => prev + 1);
    setRatingChangeNotice(change);
    onRatingChange(newRating, change);
    onXpGained(result.xp);

    setTimeout(() => {
      setRatingChangeNotice(null);
    }, 3000);
  };

  const handleNext = () => {
    setRatingChangeNotice(null);
    setPuzzleIndex((prev) => (prev + 1) % PUZZLES_DATA.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Puzzle Rating Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-emerald-400 mb-1">
            Tactical Puzzle Arena
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            Puzzle #{puzzleIndex + 104}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Find the winning tactical sequence. Speed, accuracy, and hint restraint boost your Learning Rating.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 text-xs font-mono-nums">
          <div className="text-right">
            <span className="text-slate-500 block uppercase text-[10px]">Learning Rating</span>
            <div className="flex items-center justify-end gap-1.5 text-base font-bold text-slate-100">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{learningRating}</span>
              {ratingChangeNotice !== null && (
                <span className="text-xs text-emerald-400 font-semibold animate-bounce">
                  +{ratingChangeNotice}
                </span>
              )}
            </div>
          </div>

          <div className="text-right border-l border-slate-800 pl-6">
            <span className="text-slate-500 block uppercase text-[10px]">Puzzle Streak</span>
            <div className="flex items-center justify-end gap-1.5 text-base font-bold text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{currentStreak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Exercise Runner */}
      <div className="w-full">
        <ExerciseEngine
          key={currentPuzzle.id}
          exercise={currentPuzzle}
          onSolve={handlePuzzleSolved}
          onNext={handleNext}
          showNextButton={true}
        />
      </div>
    </div>
  );
};
