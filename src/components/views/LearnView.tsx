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
  Compass,
  ArrowRight,
} from 'lucide-react';

interface LearnViewProps {
  completedLessons: string[];
  onCompleteLesson: (lessonId: string, xp: number) => void;
  initialLessonId?: string | null;
  onNavigateToOpenings?: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  completedLessons,
  onCompleteLesson,
  initialLessonId,
  onNavigateToOpenings,
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
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#D5D0C5] pb-6">
        <div>
          <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45] mb-1">
            Structured Chess Academy
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#171717]">
            The Curriculum Journey
          </h1>
          <p className="text-xs sm:text-sm text-[#171717]/70 max-w-2xl mt-1">
            A comprehensive sequence of deliberate lessons. Each concept is demonstrated on an interactive board and reinforced with tactical exercises.
          </p>
        </div>

        {onNavigateToOpenings && (
          <button
            onClick={onNavigateToOpenings}
            className="shrink-0 py-2 px-3.5 bg-[#E8E3D8] hover:bg-[#D5D0C5] text-[#315C45] border border-[#D5D0C5] font-semibold rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Openings Explorer (20)</span>
          </button>
        )}
      </div>

      {/* Curriculum Path Tabs (Editorial, clean, Swiss-style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#D5D0C5]">
        {CURRICULUM_DATA.map((path) => {
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
              className={`py-2 px-3.5 rounded text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-[#315C45] text-white border-[#315C45] shadow-xs'
                  : 'bg-[#E8E3D8]/60 text-[#171717]/70 border-[#D5D0C5] hover:text-[#171717] hover:bg-[#E8E3D8]'
              }`}
            >
              <span>{path.title.replace('Path ', 'Part ')}</span>
              <span className="font-mono text-[10px] ml-1.5 opacity-80">
                ({completedInPath}/{totalLessons})
              </span>
            </button>
          );
        })}
      </div>

      {/* Path Syllabus Overview Card */}
      <div className="p-6 bg-[#E8E3D8]/50 border border-[#D5D0C5] rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#315C45]">
              Level: {selectedPath.level} · Path Syllabus
            </div>
            <h2 className="text-xl font-bold font-display text-[#171717] mt-0.5">
              {selectedPath.title}
            </h2>
          </div>
          <div className="text-xs font-mono text-[#171717]/60">
            {selectedPath.modules.length} Modules · Deliberate Practice
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#171717]/80 leading-relaxed max-w-3xl">
          {selectedPath.description}
        </p>
      </div>

      {/* Modules & Lessons Syllabus List */}
      <div className="space-y-6">
        {selectedPath.modules.map((module, mIdx) => (
          <div
            key={module.id}
            className="bg-[#F5F1E8] border border-[#D5D0C5] rounded overflow-hidden"
          >
            {/* Module Header */}
            <div className="px-6 py-4 bg-[#E8E3D8]/80 border-b border-[#D5D0C5] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#171717]/60 tracking-wider">
                  Module {mIdx + 1}
                </span>
                <h3 className="text-base font-bold font-display text-[#171717]">
                  {module.title}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#171717]/60">
                {module.lessons.length} Lessons
              </span>
            </div>

            {/* Lessons List in Module */}
            <div className="divide-y divide-[#D5D0C5]/60">
              {module.lessons.map((lesson, lIdx) => {
                const isCompleted = completedLessons.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#E8E3D8]/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#315C45] shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-[#D5D0C5] flex items-center justify-center text-[10px] font-mono shrink-0">
                            {lIdx + 1}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-[#171717]">{lesson.title}</h4>
                      </div>
                      <p className="text-xs text-[#171717]/70 pl-6 max-w-2xl">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 pl-6 sm:pl-0 shrink-0">
                      <span className="text-xs text-[#171717]/60 font-mono">
                        {lesson.estimatedMinutes}m
                      </span>
                      <button
                        onClick={() => setActiveLesson(lesson)}
                        className={`py-1.5 px-3.5 rounded text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-[#E8E3D8] hover:bg-[#D5D0C5] text-[#171717]'
                            : 'bg-[#315C45] hover:bg-[#284a37] text-white'
                        }`}
                      >
                        <span>{isCompleted ? 'REVIEW' : 'START'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active Split-Screen Lesson Modal */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onCompleteLesson={onCompleteLesson}
        />
      )}
    </div>
  );
};
