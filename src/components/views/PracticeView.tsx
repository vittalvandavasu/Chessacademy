import React, { useState } from 'react';
import {
  DailyPracticeSession,
  ConceptMastery,
  Exercise,
  TacticalConcept,
} from '../../types/chess';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import {
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react';

interface PracticeViewProps {
  dailyPractice: DailyPracticeSession;
  masteryList: ConceptMastery[];
  streakDays: number;
  onCompleteTask: (taskId: string, xp: number) => void;
  onFinishDailyWorkout: () => void;
  initialConceptFilter?: string | null;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  dailyPractice,
  masteryList,
  streakDays,
  onCompleteTask,
  onFinishDailyWorkout,
  initialConceptFilter,
}) => {
  const [activeMode, setActiveMode] = useState<'daily' | 'drills'>(
    initialConceptFilter ? 'drills' : 'daily'
  );
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState<TacticalConcept | 'ALL'>(
    (initialConceptFilter as TacticalConcept) || 'ALL'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'ALL'>('ALL');
  const [drillExercise, setDrillExercise] = useState<Exercise | null>(null);

  const currentTask = dailyPractice.tasks[activeTaskIndex];
  const completedCount = dailyPractice.tasks.filter((t) => t.completed).length;
  const isWorkoutFinished = completedCount === dailyPractice.tasks.length;

  // Filtered puzzle bank for drills
  const filteredPuzzles = PUZZLES_DATA.filter((p) => {
    if (selectedConcept !== 'ALL' && p.concept !== selectedConcept) return false;
    if (selectedDifficulty !== 'ALL' && p.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleDailyTaskSolved = (result: { xp: number }) => {
    if (currentTask) {
      onCompleteTask(currentTask.id, result.xp);
      if (activeTaskIndex < dailyPractice.tasks.length - 1) {
        setActiveTaskIndex((prev) => prev + 1);
      } else {
        onFinishDailyWorkout();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-emerald-400 mb-1">
            Tactical Training Gym
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display">
            Adaptive Practice & Targeted Drills
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Dynamic sessions calibrated to your accuracy weaknesses and spaced repetition intervals.
          </p>
        </div>

        {/* Mode Selector (segmented control) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMode('daily')}
            className={`py-2 px-4 rounded-lg transition-all ${
              activeMode === 'daily'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today's Workout
          </button>
          <button
            onClick={() => setActiveMode('drills')}
            className={`py-2 px-4 rounded-lg transition-all ${
              activeMode === 'drills'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Targeted Concept Drills
          </button>
        </div>
      </div>

      {activeMode === 'daily' ? (
        /* DAILY WORKOUT MODE */
        <div className="space-y-6">
          {/* Header summary banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1 font-mono-nums">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span>{streakDays}-Day Learning Streak</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400">Est. {dailyPractice.estimatedMinutes} Mins</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-display">
                  Daily Tactical Conditioning
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  5 customized exercises based on your weakest concept, secondary opportunity, and spaced review.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono-nums">
                <div className="text-right">
                  <span className="text-slate-400 block">Progress</span>
                  <span className="text-slate-100 font-bold text-sm">
                    {completedCount} / {dailyPractice.tasks.length} Done
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Reward</span>
                  <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> +{dailyPractice.totalXp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Step navigation dots */}
            <div className="flex items-center gap-2 mt-6">
              {dailyPractice.tasks.map((task, idx) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTaskIndex(idx)}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    task.completed
                      ? 'bg-emerald-500'
                      : idx === activeTaskIndex
                      ? 'bg-amber-400'
                      : 'bg-slate-800'
                  }`}
                  title={task.title}
                />
              ))}
            </div>
          </div>

          {/* Current Exercise Runner */}
          {currentTask && !isWorkoutFinished ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-semibold text-slate-200">
                  Step {activeTaskIndex + 1}: {currentTask.title}
                </span>
                <span className="text-emerald-400 font-mono-nums uppercase">
                  {currentTask.type}
                </span>
              </div>

              <ExerciseEngine
                key={currentTask.id}
                exercise={currentTask.exercise}
                onSolve={handleDailyTaskSolved}
                onNext={() => {
                  if (activeTaskIndex < dailyPractice.tasks.length - 1) {
                    setActiveTaskIndex((prev) => prev + 1);
                  }
                }}
                showNextButton={true}
              />
            </div>
          ) : (
            <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 font-display">
                Workout Complete for Today!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You’ve finished all 5 adaptive drills, maintained your {streakDays}-day streak, and earned{' '}
                <span className="text-emerald-400 font-semibold font-mono-nums">
                  +{dailyPractice.totalXp} XP
                </span>
                . Come back tomorrow for your next customized session!
              </p>
              <button
                onClick={() => setActiveMode('drills')}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Continue Free Tactical Drills →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* TARGETED CONCEPT DRILLS MODE */
        <div className="space-y-6">
          {drillExercise ? (
            /* Running a specific drill */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setDrillExercise(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ← Back to Drill Selector
                </button>
                <span className="text-xs text-emerald-400 font-semibold uppercase">
                  {drillExercise.concept.replace(/_/g, ' ')}
                </span>
              </div>

              <ExerciseEngine
                key={drillExercise.id}
                exercise={drillExercise}
                onSolve={() => {}}
                onNext={() => {
                  // Find next puzzle in filtered list
                  const currentIndex = filteredPuzzles.findIndex((p) => p.id === drillExercise.id);
                  if (currentIndex >= 0 && currentIndex < filteredPuzzles.length - 1) {
                    setDrillExercise(filteredPuzzles[currentIndex + 1]);
                  } else {
                    setDrillExercise(filteredPuzzles[0]);
                  }
                }}
                showNextButton={true}
              />
            </div>
          ) : (
            /* Drill Catalog / Filter */
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Concept:</span>
                </div>
                <select
                  value={selectedConcept}
                  onChange={(e) => setSelectedConcept(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Concepts</option>
                  <option value="FORK">Forks</option>
                  <option value="PIN">Pins</option>
                  <option value="SKEWER">Skewers</option>
                  <option value="BACK_RANK_MATE">Back Rank Mates</option>
                  <option value="DISCOVERED_ATTACK">Discovered Attacks</option>
                  <option value="DEFLECTION">Deflection</option>
                  <option value="OPPOSITION">Opposition</option>
                  <option value="PASSED_PAWNS">Passed Pawns</option>
                </select>

                <div className="flex items-center gap-2 text-slate-400 ml-auto">
                  <span>Difficulty:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    {['ALL', 1, 2, 3].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDifficulty(d as any)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          selectedDifficulty === d
                            ? 'bg-slate-800 text-emerald-400 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {d === 'ALL' ? 'Any' : `${d}★`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid of drills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPuzzles.map((puz) => (
                  <div
                    key={puz.id}
                    className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="uppercase text-emerald-400 font-semibold tracking-wider">
                          {puz.concept.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono-nums">{'★'.repeat(puz.difficulty)}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 font-display mb-2">
                        {puz.type.replace(/_/g, ' ')}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {puz.conceptHint}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                      <span className="text-xs font-mono-nums text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> +{puz.xp} XP
                      </span>
                      <button
                        onClick={() => setDrillExercise(puz)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
