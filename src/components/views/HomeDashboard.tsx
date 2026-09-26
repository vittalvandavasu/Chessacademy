import React from 'react';
import { UserStats, ConceptMastery, DailyPracticeSession } from '../../types/chess';
import { UserProfile } from '../../services/storageService';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import {
  Flame,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play,
  Award,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

interface HomeDashboardProps {
  user: UserProfile;
  stats: UserStats;
  masteryList: ConceptMastery[];
  dailyPractice: DailyPracticeSession;
  biggestOpportunity: ConceptMastery | null;
  onContinueLearning: (lessonId: string) => void;
  onStartDailyPractice: () => void;
  onTrainWeakness: (concept: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  stats,
  masteryList,
  dailyPractice,
  biggestOpportunity,
  onContinueLearning,
  onStartDailyPractice,
  onTrainWeakness,
  onNavigateTab,
}) => {
  // Find current in-progress or next lesson
  const currentPath = CURRICULUM_DATA[1]; // Path 2: First Tactics
  const currentLesson = currentPath.modules[0].lessons[0]; // The Pin

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome & Editorial Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src="/src/assets/images/chess_academy_hero_1790399274247.jpg"
            alt="Chess Academy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">
            <span>Adaptive Chess Academy</span>
            <span aria-hidden="true">·</span>
            <span>Level {stats.level} Scholar</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 font-display mb-3 text-balance">
            Good morning, {user.name.split(' ')[0]}.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Your personal learning system has analyzed your latest exercise data. Today’s training is
            calibrated to strengthen tactical calculation and address back-rank vulnerabilities.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onContinueLearning(currentLesson.id)}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Continue: {currentLesson.title.split(':')[0]}</span>
            </button>

            <button
              onClick={onStartDailyPractice}
              className="py-2.5 px-5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Daily Practice (+{dailyPractice.totalXp} XP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Continue Learning + Today's Practice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Continue Learning */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-semibold tracking-wider text-emerald-400">
                Continue Learning
              </span>
              <span className="font-mono-nums">Path 2 · Module 1</span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 font-display mb-1">
              {currentLesson.title}
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
              {currentLesson.description}
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono-nums">
                <span>Concept mastery</span>
                <span>62%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>
          </div>

          <button
            onClick={() => onContinueLearning(currentLesson.id)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-between"
          >
            <span>Resume Lesson</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Card 2: Today's Dynamic Practice */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-semibold tracking-wider text-amber-400">
                Today's Training
              </span>
              <div className="flex items-center gap-1.5 font-mono-nums text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{stats.currentStreakDays} day streak</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-100 font-display mb-1">
              Adaptive Tactical Workout
            </h3>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
              Personalized session: 1 warmup · 2 back-rank drills · 1 fork exercise · 1 mixed challenge
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-mono-nums">
              <span>Est. {dailyPractice.estimatedMinutes} minutes</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold">+{dailyPractice.totalXp} XP available</span>
            </div>
          </div>

          <button
            onClick={onStartDailyPractice}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-between shadow-sm"
          >
            <span>{dailyPractice.isCompleted ? 'Review Workout' : 'Start Daily Workout'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Identified Weakness Callout */}
      {biggestOpportunity && (
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
                <span>We've Identified a Weakness</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-nums">{biggestOpportunity.masteryPercentage}% Accuracy</span>
              </div>
              <h4 className="text-base font-bold text-slate-100 font-display">
                {biggestOpportunity.name}
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                Your accuracy dropped to {biggestOpportunity.masteryPercentage}% over recent attempts. We've added targeted review exercises to prevent recurring blind spots.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTrainWeakness(biggestOpportunity.concept)}
            className="shrink-0 py-2 px-4 bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Train This</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Summary & Tactical Mastery Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Rating & Quick Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Educational Rating
            </h3>
            <span className="text-[11px] text-slate-500">Not FIDE rating</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-bold text-slate-100 font-mono-nums">
              {stats.learningRating}
            </span>
            <span className="text-xs text-emerald-400 font-semibold font-mono-nums">
              +42 this week
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Measures tactical pattern recognition speed, puzzle accuracy, and conceptual mastery.
          </p>

          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Tactical Accuracy</span>
              <span className="font-mono-nums font-semibold">{stats.accuracyRate}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Puzzles Solved</span>
              <span className="font-mono-nums font-semibold">{stats.puzzlesSolved}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Lessons Completed</span>
              <span className="font-mono-nums font-semibold">{stats.lessonsCompleted}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Total Practice Time</span>
              <span className="font-mono-nums font-semibold">{stats.totalPracticeMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Tactical Mastery Bars */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Tactical Mastery Breakdown
            </h3>
            <button
              onClick={() => onNavigateTab('progress')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              View Full Analytics →
            </button>
          </div>

          <div className="space-y-4">
            {masteryList.slice(0, 5).map((item) => (
              <div key={item.concept} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <span
                    className={`font-mono-nums font-semibold ${
                      item.masteryPercentage < 50
                        ? 'text-red-400'
                        : item.masteryPercentage < 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {item.masteryPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.masteryPercentage < 50
                        ? 'bg-red-500'
                        : item.masteryPercentage < 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.masteryPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
