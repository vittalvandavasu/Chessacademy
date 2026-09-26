import React from 'react';
import { UserStats, ConceptMastery, Achievement } from '../../types/chess';
import {
  TrendingUp,
  Award,
  Zap,
  Target,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Crosshair,
  Compass,
} from 'lucide-react';

interface ProgressViewProps {
  stats: UserStats;
  masteryList: ConceptMastery[];
  achievements: Achievement[];
  biggestOpportunity: ConceptMastery | null;
  onTrainWeakness: (concept: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  stats,
  masteryList,
  achievements,
  biggestOpportunity,
  onTrainWeakness,
}) => {
  const averageMastery = Math.round(
    masteryList.reduce((acc, m) => acc + m.masteryPercentage, 0) / masteryList.length
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs uppercase font-semibold tracking-wider text-emerald-400 mb-1">
          Analytics & Performance
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display">
          Learning Progress & Analytics
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mt-1">
          Comprehensive telemetry of your tactical vision, error patterns, and cognitive progression.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Learning Rating</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono-nums">
            {stats.learningRating}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Educational rating</div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Tactical Accuracy</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono-nums">
            {stats.accuracyRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all attempts</div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Overall Mastery</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono-nums">
            {averageMastery}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">9 concepts tracked</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono-nums">
            {stats.currentStreakDays} days
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Best: {stats.longestStreakDays} days</div>
        </div>
      </div>

      {/* Identified Opportunity Callout */}
      {biggestOpportunity && (
        <div className="p-6 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-red-400 tracking-wider">
                Your Biggest Opportunity
              </span>
              <h3 className="text-lg font-bold text-slate-100 font-display mt-0.5">
                {biggestOpportunity.name} · {biggestOpportunity.masteryPercentage}% Accuracy
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                You’ve missed {biggestOpportunity.recentErrors} recent exercises in this category. We’ve calibrated your next practice session with 4 targeted review exercises to reinforce this pattern.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTrainWeakness(biggestOpportunity.concept)}
            className="shrink-0 py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Train Weakness</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tactical Mastery Detailed Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-100 font-display mb-6">
          Concept Mastery & Error Frequencies
        </h3>

        <div className="space-y-5">
          {masteryList.map((concept) => (
            <div key={concept.concept} className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{concept.name}</span>
                  <span className="text-[11px] text-slate-500">
                    ({concept.successfulAttempts}/{concept.totalAttempts} solved)
                  </span>
                </div>
                <div className="flex items-center gap-4 font-mono-nums text-[11px] text-slate-400">
                  <span>Avg time: {concept.averageResponseTimeSeconds}s</span>
                  <span
                    className={`font-semibold text-xs ${
                      concept.masteryPercentage < 50
                        ? 'text-red-400'
                        : concept.masteryPercentage < 75
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {concept.masteryPercentage}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    concept.masteryPercentage < 50
                      ? 'bg-red-500'
                      : concept.masteryPercentage < 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${concept.masteryPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gamification: Badges & Achievements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-display">
              Scholastic Achievements & Badges
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Earn XP and unlock badges through consistency, tactical precision, and concept mastery.
            </p>
          </div>
          <span className="text-xs font-mono-nums text-emerald-400 font-semibold">
            {achievements.filter((a) => a.isUnlocked).length} / {achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                badge.isUnlocked
                  ? 'bg-slate-950/70 border-emerald-500/30'
                  : 'bg-slate-950/30 border-slate-800/80 opacity-60'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  badge.isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Award className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <h4 className="font-bold text-slate-100 truncate">{badge.title}</h4>
                  <span className="font-mono-nums text-emerald-400 text-[11px] font-semibold">
                    +{badge.xpReward} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2">
                  {badge.description}
                </p>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      badge.isUnlocked ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
