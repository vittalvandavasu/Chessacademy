import React from 'react';
import { UserStats, ConceptMastery, DailyPracticeSession } from '../../types/chess';
import { UserProfile } from '../../services/storageService';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import {
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
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
  // Current in-progress lesson & recommended next lesson
  const currentPath = CURRICULUM_DATA[1] || CURRICULUM_DATA[0];
  const currentLesson = currentPath?.modules[0]?.lessons[0] || CURRICULUM_DATA[0].modules[0].lessons[0];
  const nextRecommendedLesson =
    currentPath?.modules[0]?.lessons[1] || currentPath?.modules[1]?.lessons[0] || currentLesson;

  // Calculate high-level skill masteries across core domains
  const getDomainMastery = (categoryPrefix: string, fallback: number) => {
    const matching = masteryList.filter(
      (m) =>
        m.category.toLowerCase().includes(categoryPrefix.toLowerCase()) ||
        m.concept.toLowerCase().includes(categoryPrefix.toLowerCase())
    );
    if (matching.length === 0) return fallback;
    const avg = matching.reduce((sum, item) => sum + item.masteryPercentage, 0) / matching.length;
    return Math.round(avg);
  };

  const domainMasteries = [
    { domain: 'Foundations & Board Rules', percentage: getDomainMastery('movement', 92), level: 'Mastered' },
    { domain: 'Chess Language & Algebraic Notation', percentage: 68, level: 'Developing' },
    { domain: 'Tactics & Calculation (Pins, Forks, Skewers)', percentage: getDomainMastery('tactics', 74), level: 'Proficient' },
    { domain: 'Strategic Center Control & Development', percentage: getDomainMastery('strategy', 60), level: 'Developing' },
    { domain: 'Essential Endgame Technique', percentage: getDomainMastery('endgame', 52), level: 'Developing' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Editorial Title & Academic Discipline Bar */}
      <div className="space-y-4 border-b border-[#D5D0C5] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45]">
              Personal Chess Academy
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-[#171717] mt-1 tracking-tight">
              YOUR CHESS JOURNEY
            </h1>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#171717]/70 font-mono-nums">
            <div>
              <span className="block text-[10px] uppercase font-sans text-[#171717]/50 tracking-wider">
                Current Level
              </span>
              <span className="font-semibold text-[#171717]">Level {stats.level} · Scholar</span>
            </div>
            <div className="border-l border-[#D5D0C5] pl-6">
              <span className="block text-[10px] uppercase font-sans text-[#171717]/50 tracking-wider">
                Study Discipline
              </span>
              <span className="font-semibold text-[#315C45]">{stats.currentStreakDays} Days Streak</span>
            </div>
            <div className="border-l border-[#D5D0C5] pl-6">
              <span className="block text-[10px] uppercase font-sans text-[#171717]/50 tracking-wider">
                Academy Rating
              </span>
              <span className="font-semibold text-[#171717]">{stats.learningRating} CC</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-[#171717]/75 max-w-2xl leading-relaxed">
          Welcome back, {user.name.split(' ')[0]}. Here is your clear pedagogical path: deliberate practice, notation fluency, and strategic pattern recognition.
        </p>
      </div>

      {/* Primary Section: "WHAT SHOULD I LEARN NEXT?" Hero Card */}
      <div className="bg-[#E8E3D8] border border-[#D5D0C5] rounded p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#315C45]">
            Immediate Recommendation
          </div>
          <span className="text-[11px] font-mono text-[#171717]/60">
            Curriculum Path 2 · Lesson 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="text-[11px] uppercase font-semibold text-[#171717]/60 tracking-wider">
              Recommended Next Lesson
            </div>
            <h2 className="text-2xl font-bold font-display text-[#171717]">
              {nextRecommendedLesson.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#171717]/80 leading-relaxed max-w-xl">
              {nextRecommendedLesson.description ||
                'Master how to freeze enemy pieces against high-value targets and convert positional pressure into decisive material gains.'}
            </p>
            <div className="flex items-center gap-4 text-xs text-[#171717]/65 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{nextRecommendedLesson.estimatedMinutes} minutes</span>
              </span>
              <span>·</span>
              <span>Interactive board exercises + Cadet Coach guidance</span>
            </div>
          </div>

          {/* Singular Prominent Primary CTA (No competing CTAs) */}
          <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center">
            <button
              onClick={() => onContinueLearning(nextRecommendedLesson.id)}
              className="w-full sm:w-auto py-3.5 px-7 bg-[#315C45] hover:bg-[#284a37] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase rounded transition-all shadow-xs flex items-center justify-center gap-3 group"
            >
              <span>CONTINUE LEARNING</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-[10px] text-[#171717]/50 mt-2 text-right">
              Curriculum progression will advance automatically
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Academic Section: Skill Mastery & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Skill Mastery */}
        <div className="lg:col-span-7 bg-[#F5F1E8] border border-[#D5D0C5] rounded p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717]">
              Skill Mastery Breakdown
            </h3>
            <span className="text-[11px] font-mono text-[#315C45] font-semibold">
              Curriculum Standards
            </span>
          </div>

          <div className="space-y-4">
            {domainMasteries.map((m) => (
              <div key={m.domain} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#171717]">{m.domain}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono text-[#171717]/50">
                      {m.level}
                    </span>
                    <span className="font-mono font-semibold text-[#171717]">{m.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#E8E3D8] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      m.percentage < 55
                        ? 'bg-[#B94A48]'
                        : m.percentage < 75
                        ? 'bg-[#C7A45D]'
                        : 'bg-[#315C45]'
                    }`}
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-[#171717]/70 italic border-t border-[#D5D0C5]">
            Evaluated continuously against tournament-level standards and accuracy metrics.
          </div>
        </div>

        {/* Right Column (5 cols): Weak Areas & Targeted Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#E8E3D8] border border-[#D5D0C5] rounded p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#D5D0C5] pb-3">
              <AlertCircle className="w-4 h-4 text-[#B94A48]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#171717]">
                Identified Weak Areas
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#171717]">Disambiguation in Notation</span>
                  <span className="font-mono text-[11px] font-bold text-[#B94A48]">21% Mastery</span>
                </div>
                <p className="text-[11px] text-[#171717]/70 leading-relaxed">
                  Hesitation when two identical pieces share a destination square (e.g., Nbd2 vs Nfd2).
                </p>
                <button
                  onClick={() => onNavigateTab('practice')}
                  className="text-[11px] text-[#315C45] font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>Practice 5 positions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-3 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-[#171717]">Rook Endgames: Passive King</span>
                  <span className="font-mono text-[11px] font-bold text-[#C7A45D]">44% Mastery</span>
                </div>
                <p className="text-[11px] text-[#171717]/70 leading-relaxed">
                  Tendency to keep King back rather than activating it to support passed pawns in the endgame.
                </p>
                <button
                  onClick={() => onNavigateTab('learn')}
                  className="text-[11px] text-[#315C45] font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>Study Endgame Chapter</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Performance Log */}
          <div className="bg-[#F5F1E8] border border-[#D5D0C5] rounded p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Recent Academic Record
              </h3>
              <span className="text-[10px] font-mono text-[#171717]/50">Last 3 Sessions</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#D5D0C5]/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#315C45]" />
                  <span className="text-[#171717]">The Pin: Absolute vs Relative</span>
                </div>
                <span className="font-mono text-[11px] text-[#315C45] font-medium">100% Accuracy</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#D5D0C5]/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#315C45]" />
                  <span className="text-[#171717]">Rook Trajectory & Open Files</span>
                </div>
                <span className="font-mono text-[11px] text-[#315C45] font-medium">92% Accuracy</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#315C45]" />
                  <span className="text-[#171717]">Algebraic Coordinates: Grid Mastery</span>
                </div>
                <span className="font-mono text-[11px] text-[#315C45] font-medium">88% Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
