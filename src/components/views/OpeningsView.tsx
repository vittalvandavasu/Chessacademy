import React, { useState, useMemo } from 'react';
import { OPENINGS_DATA } from '../../data/openingsData';
import { ChessOpeningLesson, OpeningFamily } from '../../types/chess';
import { OpeningLessonModal } from '../exercise/OpeningLessonModal';
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  BookOpen,
  Zap,
  Target,
  Sparkles,
  Swords,
  Shield,
  Layers,
  Award,
  Play,
} from 'lucide-react';

interface OpeningsViewProps {
  completedOpenings: string[];
  onCompleteOpening: (openingId: string, xpReward: number) => void;
  initialOpeningId?: string | null;
}

export const OpeningsView: React.FC<OpeningsViewProps> = ({
  completedOpenings,
  onCompleteOpening,
  initialOpeningId,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<OpeningFamily | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | '1-2' | '3' | '4-5'>('ALL');
  const [activeOpening, setActiveOpening] = useState<ChessOpeningLesson | null>(() => {
    if (!initialOpeningId) return null;
    return OPENINGS_DATA.find((o) => o.id === initialOpeningId) || null;
  });

  // Filtered Openings list
  const filteredOpenings = useMemo(() => {
    return OPENINGS_DATA.filter((opening) => {
      // Family filter
      if (selectedFamily !== 'ALL' && opening.family !== selectedFamily) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter === '1-2' && opening.difficulty > 2) return false;
      if (difficultyFilter === '3' && opening.difficulty !== 3) return false;
      if (difficultyFilter === '4-5' && opening.difficulty < 4) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = opening.name.toLowerCase().includes(query);
        const matchEco = opening.eco.toLowerCase().includes(query);
        const matchMoves = opening.movesSan.toLowerCase().includes(query);
        const matchTagline = opening.tagline.toLowerCase().includes(query);
        const matchPhilosophy = opening.philosophy.toLowerCase().includes(query);
        const matchChamp = opening.famousChampions.some((c) => c.toLowerCase().includes(query));

        if (!matchName && !matchEco && !matchMoves && !matchTagline && !matchPhilosophy && !matchChamp) {
          return false;
        }
      }

      return true;
    });
  }, [selectedFamily, difficultyFilter, searchQuery]);

  // Summary statistics
  const totalCount = OPENINGS_DATA.length;
  const masteredCount = OPENINGS_DATA.filter((o) => completedOpenings.includes(o.id)).length;
  const hypermodernCount = OPENINGS_DATA.filter((o) => o.family === 'HYPERMODERN').length;

  const familyLabels: { id: OpeningFamily | 'ALL'; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Openings', count: totalCount },
    {
      id: 'OPEN_GAMES',
      label: 'Classical (1. e4 e5)',
      count: OPENINGS_DATA.filter((o) => o.family === 'OPEN_GAMES').length,
    },
    {
      id: 'SEMI_OPEN',
      label: 'Semi-Open (1. e4)',
      count: OPENINGS_DATA.filter((o) => o.family === 'SEMI_OPEN').length,
    },
    {
      id: 'QUEENS_PAWN',
      label: 'Queen’s Pawn (1. d4)',
      count: OPENINGS_DATA.filter((o) => o.family === 'QUEENS_PAWN').length,
    },
    {
      id: 'HYPERMODERN',
      label: 'Hypermodern Defenses',
      count: hypermodernCount,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              <Compass className="w-4 h-4" />
              <span>Comprehensive Opening Masterclass</span>
              <span aria-hidden="true">·</span>
              <span>20 Error-Free Repertoires</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 font-display">
              The Chess Openings Academy
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              From classical harmony in the <strong className="text-emerald-400">Italian Game</strong> to every cutting-edge{' '}
              <strong className="text-emerald-400">Hypermodern</strong> counter-attacking system (King’s Indian, Nimzo-Indian, Grünfeld, Benoni, Catalan, and beyond).
              Internalize opening moves through physical board drills, deep strategic plans, and trap recognition.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex sm:flex-row md:flex-col gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                {masteredCount}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mastered</span>
                <span className="text-xs font-semibold text-slate-200">
                  {masteredCount} of {totalCount} Openings
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                {hypermodernCount}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Hypermodern</span>
                <span className="text-xs font-semibold text-slate-200">
                  {hypermodernCount} Specialized Systems
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Family Filter Toolbar */}
      <div className="space-y-4">
        {/* Family Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {familyLabels.map((fam) => {
            const isSelected = selectedFamily === fam.id;
            return (
              <button
                key={fam.id}
                onClick={() => setSelectedFamily(fam.id)}
                className={`py-2 px-3 sm:px-4 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{fam.label}</span>
                <span className="font-mono text-[11px] opacity-75">({fam.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Difficulty Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ECO, move, or champion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Difficulty:</span>
            </span>
            {(['ALL', '1-2', '3', '4-5'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  difficultyFilter === diff
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {diff === 'ALL' ? 'All' : diff === '1-2' ? 'Beginner' : diff === '3' ? 'Intermediate' : 'Advanced'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Openings Grid */}
      {filteredOpenings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 mb-1">No openings match your search</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or family filter to view the full repertoire.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOpenings.map((opening) => {
            const isCompleted = completedOpenings.includes(opening.id);

            return (
              <div
                key={opening.id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-slate-950/50 border-emerald-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Clean unboxed metadata with typographic separators */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-bold text-emerald-400">{opening.eco}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-300 font-medium">
                        {opening.family === 'HYPERMODERN'
                          ? 'Hypermodern'
                          : opening.family === 'OPEN_GAMES'
                          ? 'Classical 1.e4'
                          : opening.family === 'SEMI_OPEN'
                          ? 'Semi-Open'
                          : 'Queen’s Pawn'}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400">Diff {opening.difficulty}/5</span>
                    </div>

                    {isCompleted && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-base font-bold text-slate-100 font-display mb-1">
                    {opening.name}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium mb-3">
                    {opening.tagline}
                  </p>

                  {/* Bold Notation */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 font-mono text-xs text-slate-200 mb-3 overflow-x-auto">
                    {opening.movesSan}
                  </div>

                  {/* Philosophy Snippet */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {opening.philosophy}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500 mr-1">Champions:</span>
                    <span>{opening.famousChampions.slice(0, 2).join(', ')}</span>
                  </div>

                  <button
                    onClick={() => setActiveOpening(opening)}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCompleted ? 'Review Lesson' : 'Start Lesson'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Opening Lesson Modal */}
      {activeOpening && (
        <OpeningLessonModal
          opening={activeOpening}
          onClose={() => setActiveOpening(null)}
          onCompleteOpening={onCompleteOpening}
          isCompleted={completedOpenings.includes(activeOpening.id)}
        />
      )}
    </div>
  );
};
