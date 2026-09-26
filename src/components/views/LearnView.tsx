import React, { useState } from 'react';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import { Lesson, LearningPath } from '../../types/chess';
import { LessonModal } from './LessonModal';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface LearnViewProps {
  completedLessons: string[];
  onCompleteLesson: (lessonId: string, xp: number) => void;
  initialLessonId?: string | null;
}

export const LearnView: React.FC<LearnViewProps> = ({
  completedLessons,
  onCompleteLesson,
  initialLessonId,
}) => {
  const [selectedPathId, setSelectedPathId] = useState<string>(CURRICULUM_DATA[0].id);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    if (!initialLessonId) return null;
    for (const p of CURRICULUM_DATA) {
      for (const m of p.modules) {
        const found = m.lessons.find((l) => l.id === initialLessonId);
        if (found) return found;
      }
    }
    return null;
  });

  const selectedPath =
    CURRICULUM_DATA.find((p) => p.id === selectedPathId) || CURRICULUM_DATA[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="text-xs uppercase font-semibold tracking-wider text-emerald-400 mb-1">
          Structured Curriculum
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display">
          Learning Paths & Progression
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mt-1">
          Master the game systematically through guided conceptual lessons, physical board manipulation,
          and automated tactical feedback.
        </p>
      </div>

      {/* Path Selector Tabs (Interactive filter control following frontend-design rules) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {CURRICULUM_DATA.map((path, idx) => {
          const isSelected = path.id === selectedPathId;
          const totalLessons = path.modules.reduce((acc, m) => acc + m.lessons.length, 0);
          const completedInPath = path.modules.reduce(
            (acc, m) =>
              acc + m.lessons.filter((l) => completedLessons.includes(l.id)).length,
            0
          );

          return (
            <button
              key={path.id}
              onClick={() => setSelectedPathId(path.id)}
              className={`py-2 px-4 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{path.title.split(':')[0]}</span>
              <span className="font-mono-nums text-[11px] opacity-75">
                ({completedInPath}/{totalLessons})
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Path Overview */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase mb-1">
              <span>{selectedPath.level}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPath.subtitle}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-display">
              {selectedPath.title}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
              {selectedPath.description}
            </p>
          </div>
        </div>
      </div>

      {/* Modules & Lesson Cards */}
      <div className="space-y-6">
        {selectedPath.modules.map((module, mIdx) => (
          <div
            key={module.id}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Module {mIdx + 1}
                </span>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  {module.title}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono-nums">
                {module.lessons.length} Lessons
              </span>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {module.lessons.map((lesson, lIdx) => {
                const isCompleted = completedLessons.includes(lesson.id);
                // First lesson of path or previous completed allows unlock
                const isUnlocked = true; // All lessons accessible for open study

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isCompleted
                        ? 'bg-slate-950/50 border-emerald-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <div className="flex items-center gap-1.5 font-mono-nums">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lesson.estimatedMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-mono-nums font-semibold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>+{lesson.xpReward} XP</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 font-display mb-1">
                        {lesson.title}
                      </h4>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Not started</span>
                      )}

                      <button
                        onClick={() => setActiveLesson(lesson)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isCompleted ? 'Review' : 'Start Lesson'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full Interactive Lesson Modal */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onCompleteLesson={(id, xp) => {
            onCompleteLesson(id, xp);
          }}
        />
      )}
    </div>
  );
};
