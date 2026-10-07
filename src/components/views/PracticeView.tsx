import React, { useState } from 'react';
import {
  DailyPracticeSession,
  ConceptMastery,
  Exercise,
  TacticalConcept,
} from '../../types/chess';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import { NotationTrainer } from '../notation/NotationTrainer';
import {
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
  BookOpen,
  Target,
  Brain,
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
  const [activeTab, setActiveTab] = useState<'notation' | 'motifs' | 'daily'>(
    initialConceptFilter ? 'motifs' : 'notation'
  );
  const [selectedConcept, setSelectedConcept] = useState<TacticalConcept | 'ALL'>(
    (initialConceptFilter as TacticalConcept) || 'ALL'
  );
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [drillExercise, setDrillExercise] = useState<Exercise | null>(null);

  const currentTask = dailyPractice.tasks[activeTaskIndex];
  const completedCount = dailyPractice.tasks.filter((t) => t.completed).length;
  const isWorkoutFinished = completedCount === dailyPractice.tasks.length;

  const filteredPuzzles = PUZZLES_DATA.filter((p) => {
    if (selectedConcept !== 'ALL' && p.concept !== selectedConcept) return false;
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
    <div className="space-y-6">
      {/* Sub-Navigation for Practice Hub */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 border-b border-[#D5D0C5] pb-2">
          <button
            onClick={() => {
              setActiveTab('notation');
              setDrillExercise(null);
            }}
            className={`py-2 px-4 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'notation'
                ? 'bg-[#315C45] text-white shadow-xs'
                : 'text-[#171717]/70 hover:text-[#171717] hover:bg-[#E8E3D8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notation Trainer</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('motifs');
              setDrillExercise(null);
            }}
            className={`py-2 px-4 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'motifs'
                ? 'bg-[#315C45] text-white shadow-xs'
                : 'text-[#171717]/70 hover:text-[#171717] hover:bg-[#E8E3D8]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Tactical Motifs</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('daily');
              setDrillExercise(null);
            }}
            className={`py-2 px-4 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-[#315C45] text-white shadow-xs'
                : 'text-[#171717]/70 hover:text-[#171717] hover:bg-[#E8E3D8]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Daily Workout</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Dedicated Notation Trainer */}
      {activeTab === 'notation' && <NotationTrainer />}

      {/* Tab 2: Tactical Motifs Practice */}
      {activeTab === 'motifs' && (
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0C5] pb-4">
            <div>
              <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45] mb-1">
                Tactical Calculation Gym
              </div>
              <h2 className="text-2xl font-bold font-display text-[#171717]">
                Pattern Recognition by Motif
              </h2>
            </div>

            {/* Concept Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(['ALL', 'PIN', 'FORK', 'SKEWER', 'DEFLECTION', 'DISCOVERED_ATTACK', 'DOUBLE_ATTACK'] as const).map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedConcept(c as any);
                      setDrillExercise(null);
                    }}
                    className={`py-1.5 px-3 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      selectedConcept === c
                        ? 'bg-[#315C45] text-white'
                        : 'bg-[#E8E3D8] text-[#171717]/70 hover:text-[#171717]'
                    }`}
                  >
                    {c.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {drillExercise ? (
            <div className="p-4 bg-[#E8E3D8]/50 border border-[#D5D0C5] rounded">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase text-[#315C45]">
                  Active Motif Drill: {drillExercise.concept}
                </span>
                <button
                  onClick={() => setDrillExercise(null)}
                  className="text-xs font-semibold text-[#171717]/70 hover:text-[#171717]"
                >
                  ← Back to Motif Selection
                </button>
              </div>
              <ExerciseEngine
                exercise={drillExercise}
                onNext={() => setDrillExercise(null)}
                showNextButton={true}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPuzzles.slice(0, 9).map((puzzle) => (
                <div
                  key={puzzle.id}
                  className="p-5 bg-[#E8E3D8]/40 border border-[#D5D0C5] rounded space-y-3 hover:border-[#315C45]/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#315C45] uppercase tracking-wider text-[11px]">
                      {puzzle.concept.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[#171717]/60">Diff {puzzle.difficulty}/5</span>
                  </div>

                  <h3 className="text-base font-bold font-display text-[#171717]">
                    {puzzle.title || 'Tactical Calculation'}
                  </h3>

                  <p className="text-xs text-[#171717]/70 line-clamp-2">
                    {puzzle.conceptHint || 'Find the optimal forcing continuation.'}
                  </p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setDrillExercise(puzzle)}
                      className="py-1.5 px-3 bg-[#315C45] hover:bg-[#284a37] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                    >
                      <span>SOLVE DRILL</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Daily Curated Workout */}
      {activeTab === 'daily' && (
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
          <div className="p-6 bg-[#E8E3D8] border border-[#D5D0C5] rounded space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45]">
                  Daily Calibration
                </div>
                <h2 className="text-2xl font-bold font-display text-[#171717]">
                  Targeted Spaced Repetition
                </h2>
              </div>
              <div className="text-right font-mono text-xs text-[#171717]">
                Progress: {completedCount} / {dailyPractice.tasks.length} Completed
              </div>
            </div>

            <p className="text-xs text-[#171717]/80">
              Complete these targeted drills daily to maintain tactical sharpness and reinforce weak concepts.
            </p>
          </div>

          {!isWorkoutFinished && currentTask ? (
            <div className="p-6 bg-[#F5F1E8] border border-[#D5D0C5] rounded">
              <div className="mb-4 text-xs font-semibold text-[#171717]/60 uppercase tracking-wider">
                Workout Task {activeTaskIndex + 1}: {currentTask.title}
              </div>
              <ExerciseEngine
                exercise={currentTask.exercise}
                onSolve={handleDailyTaskSolved}
                onNext={() => {
                  if (activeTaskIndex < dailyPractice.tasks.length - 1) {
                    setActiveTaskIndex((p) => p + 1);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-[#E8E3D8] border border-[#D5D0C5] rounded space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#315C45] mx-auto" />
              <h3 className="text-xl font-bold font-display text-[#171717]">
                Daily Workout Completed
              </h3>
              <p className="text-xs text-[#171717]/70 max-w-md mx-auto">
                Excellent discipline. Your tactical diagnostic scores have been updated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
