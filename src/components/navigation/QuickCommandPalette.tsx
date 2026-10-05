import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Compass, Target, BookOpen, Zap, Award, ArrowRight, X } from 'lucide-react';
import { OPENINGS_DATA } from '../../data/openingsData';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import { NavTab } from '../layout/Navbar';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onSelectOpening?: (openingId: string) => void;
  onSelectLesson?: (lessonId: string) => void;
}

interface SearchItem {
  id: string;
  type: 'action' | 'opening' | 'puzzle' | 'lesson' | 'tab';
  title: string;
  subtitle: string;
  badge?: string;
  icon: any;
  action: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectOpening,
  onSelectLesson,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search Results
  const results = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default recommended quick links
      return [
        {
          id: 'act-daily',
          type: 'action',
          title: 'Start Daily Practice Session',
          subtitle: '5 calibrated exercises tailored to your tactical weaknesses',
          icon: Zap,
          action: () => {
            onNavigateTab('practice');
            onClose();
          },
        },
        {
          id: 'act-openings',
          type: 'action',
          title: 'Browse All 20 Openings Repertoires',
          subtitle: 'Italian, Sicilian, King’s Indian, Catalan, and more',
          icon: Compass,
          action: () => {
            onNavigateTab('openings');
            onClose();
          },
        },
        {
          id: 'act-puzzles',
          type: 'action',
          title: 'Tactics Arena & Puzzles',
          subtitle: 'Master forks, pins, skewers, and sacrifices with coach hints',
          icon: Target,
          action: () => {
            onNavigateTab('puzzles');
            onClose();
          },
        },
      ];
    }

    const items: SearchItem[] = [];

    // Search Openings
    OPENINGS_DATA.forEach((op) => {
      if (
        op.name.toLowerCase().includes(q) ||
        op.eco.toLowerCase().includes(q) ||
        op.movesSan.toLowerCase().includes(q) ||
        op.tagline.toLowerCase().includes(q) ||
        op.philosophy.toLowerCase().includes(q)
      ) {
        items.push({
          id: op.id,
          type: 'opening',
          title: op.name,
          subtitle: `${op.eco} · ${op.movesSan}`,
          badge: op.family === 'HYPERMODERN' ? 'Hypermodern' : 'Opening',
          icon: Compass,
          action: () => {
            onNavigateTab('openings');
            if (onSelectOpening) onSelectOpening(op.id);
            onClose();
          },
        });
      }
    });

    // Search Tactical Puzzles
    PUZZLES_DATA.forEach((puz) => {
      const puzTitle = puz.title || puz.concept.replace(/_/g, ' ');
      if (
        puzTitle.toLowerCase().includes(q) ||
        puz.concept.toLowerCase().includes(q) ||
        puz.learningObjective?.toLowerCase().includes(q)
      ) {
        items.push({
          id: puz.id,
          type: 'puzzle',
          title: puzTitle,
          subtitle: `Tactic · ${puz.concept.replace(/_/g, ' ')}`,
          badge: 'Tactic',
          icon: Target,
          action: () => {
            onNavigateTab('puzzles');
            onClose();
          },
        });
      }
    });

    // Search Curriculum Lessons
    CURRICULUM_DATA.forEach((path) => {
      path.modules.forEach((mod) => {
        mod.lessons.forEach((les) => {
          if (
            les.title.toLowerCase().includes(q) ||
            les.description.toLowerCase().includes(q)
          ) {
            items.push({
              id: les.id,
              type: 'lesson',
              title: les.title,
              subtitle: `${path.title.split(':')[0]} · ${les.estimatedMinutes} min`,
              badge: 'Lesson',
              icon: BookOpen,
              action: () => {
                onNavigateTab('learn');
                if (onSelectLesson) onSelectLesson(les.id);
                onClose();
              },
            });
          }
        });
      });
    });

    return items.slice(0, 8);
  }, [query, onNavigateTab, onSelectOpening, onSelectLesson, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Navigation"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/50">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type an opening, tactic, or lesson name (e.g. Italian, Fork, Pin, Réti)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              ESC
            </span>
          )}
        </div>

        {/* Results list */}
        <div className="p-2 max-h-96 overflow-y-auto divide-y divide-slate-850">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching chess concepts or openings found for "{query}".
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with click or arrow keys</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
