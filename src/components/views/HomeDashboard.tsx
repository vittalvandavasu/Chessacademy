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
  Compass,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Swords,
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
  // Current in-progress lesson
  const currentPath = CURRICULUM_DATA[1]; // Path 2: First Tactics
  const currentLesson = currentPath.modules[0].lessons[0]; // The Pin

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Hero Command Center */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="/src/assets/images/chess_academy_hero_1790399274247.jpg"
            alt="Chess Academy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
            <span>Adaptive Chess Academy</span>
            <span aria-hidden="true">·</span>
            <span>Grandmaster Cadet Curriculum</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Level {stats.level}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 font-display mb-3 text-balance leading-tight">
            Welcome back, {user.name.split(' ')[0]}.
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm sm:leading-relaxed mb-6 max-w-2xl">
            Your adaptive training engine has calibrated today’s session. Focus on eliminating tactical blind spots, mastering classical pawn structures, and refining opening move orders.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onStartDailyPractice}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Start Daily Workout (+{dailyPractice.totalXp} XP)</span>
            </button>

            <button
              onClick={() => onNavigateTab('openings')}
              className="py-2.5 px-5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Explore 20 Openings</span>
            </button>

            <button
              onClick={() => onNavigateTab('puzzles')}
              className="py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-medium rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Tactics Arena ({stats.learningRating})</span>
            </button>
          </div>
        </div>
      </div>

      {/* The 4 Training Pillars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400 block mb-0.5">
              Core Training Modules
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-display">
              Accelerated Learning Pathways
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-nums">
            4 Specialized Arenas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Openings Academy */}
          <div
            onClick={() => onNavigateTab('openings')}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  20 Repertoires
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display mb-1 group-hover:text-emerald-300 transition-colors">
                Openings Academy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Italian, Sicilian, King's Indian, Benoni, and Catalan with interactive board drills and plans.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">
              <span>Drill Repertoires</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 2: Tactics Arena */}
          <div
            onClick={() => onNavigateTab('puzzles')}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-400">
                  Rating: {stats.learningRating}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display mb-1 group-hover:text-indigo-300 transition-colors">
                Tactics Lab
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Grandmaster-verified tactical combinations: forks, pins, skewers, and queen sacrifices.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs text-slate-400 group-hover:text-indigo-400 transition-colors">
              <span>Solve Tactics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 3: Structured Curriculum */}
          <div
            onClick={() => onNavigateTab('learn')}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-400">
                  {stats.lessonsCompleted} Completed
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display mb-1 group-hover:text-amber-300 transition-colors">
                Curriculum Paths
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Step-by-step masterclasses spanning piece geometry, tactical motifs, and endgame technique.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs text-slate-400 group-hover:text-amber-400 transition-colors">
              <span>Continue Path</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 4: Daily Practice Session */}
          <div
            onClick={onStartDailyPractice}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  +{dailyPractice.totalXp} XP
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display mb-1 group-hover:text-emerald-300 transition-colors">
                Daily Workout
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                5 targeted drills dynamically selected to strengthen your current areas of greatest opportunity.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">
              <span>{dailyPractice.isCompleted ? 'Review Workout' : 'Start Drill'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Identified Weakness Remediation Banner */}
      {biggestOpportunity && (
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">
                <span>Personalized Diagnostic Finding</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-nums">{biggestOpportunity.masteryPercentage}% Accuracy</span>
              </div>
              <h4 className="text-base font-bold text-slate-100 font-display">
                Weakness Detected: {biggestOpportunity.name}
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                Your tactical calculation accuracy dipped on this motif. We have generated focused exercises to reinforce pattern recognition.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTrainWeakness(biggestOpportunity.concept)}
            className="shrink-0 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Remediate Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tactical Mastery Radar & Diagnostic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating & Growth Metric Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Cadet Learning Rating
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Authoritative</span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-100 font-mono-nums font-display">
                {stats.learningRating}
              </span>
              <span className="text-xs text-emerald-400 font-semibold font-mono-nums">
                +38 pts this week
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Calibrated strictly on solving accuracy, blunder avoidance, and response times in verified positions.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-850 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Puzzles Solved</span>
              <span className="font-bold text-slate-200 font-mono-nums text-sm">
                {stats.puzzlesSolved}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Accuracy Rate</span>
              <span className="font-bold text-emerald-400 font-mono-nums text-sm">
                {stats.accuracyRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Motif Mastery Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tactical Mastery Diagnostics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time proficiency calculated across primary tactical motifs.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('progress')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {masteryList.slice(0, 5).map((item) => (
              <div key={item.concept} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3 text-slate-400 font-mono-nums">
                    <span>{item.successfulAttempts}/{item.totalAttempts} solved</span>
                    <span
                      className={`font-semibold ${
                        item.masteryPercentage >= 75
                          ? 'text-emerald-400'
                          : item.masteryPercentage >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.masteryPercentage}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.masteryPercentage >= 75
                        ? 'bg-emerald-500'
                        : item.masteryPercentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
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
