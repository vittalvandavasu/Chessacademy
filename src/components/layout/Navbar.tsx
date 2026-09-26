import React from 'react';
import { UserStats } from '../../types/chess';
import { UserProfile } from '../../services/storageService';
import { Flame, Zap, User } from 'lucide-react';

export type NavTab =
  | 'home'
  | 'learn'
  | 'practice'
  | 'puzzles'
  | 'progress'
  | 'classroom'
  | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: UserStats;
  user: UserProfile & { role?: string };
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onResetDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  user,
  onOpenProfile,
  onOpenAuth,
  onResetDemo,
}) => {
  const navLinks: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'learn', label: 'Learn' },
    { id: 'practice', label: 'Practice' },
    { id: 'puzzles', label: 'Puzzles' },
    { id: 'progress', label: 'Progress' },
    { id: 'classroom', label: 'Classroom' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('home')}
          className="text-xl font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors font-display flex items-center gap-2"
        >
          <span>ChessCadet</span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`transition-colors py-1 relative whitespace-nowrap ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions and user gamification metrics */}
        <div className="flex items-center gap-4 text-xs font-medium">
          {/* Streak indicator */}
          <div
            className="flex items-center gap-1.5 text-amber-400 font-mono-nums"
            title={`${stats.currentStreakDays}-day study streak`}
          >
            <Flame className="w-4 h-4 fill-amber-500/20 text-amber-500" />
            <span className="font-semibold text-slate-200">{stats.currentStreakDays}d</span>
          </div>

          {/* XP & Level */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-mono-nums"
            title={`${stats.totalXp} XP (Level ${stats.level})`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">{stats.totalXp} XP</span>
          </div>

          {/* User profile / demo trigger */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              title="User Profile"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-200 leading-tight">
                  {user.name.split(' ')[0]}
                </span>
                <span className={`text-[9px] font-mono leading-tight ${
                  user.role === 'ADMIN'
                    ? 'text-amber-400'
                    : user.role === 'TEACHER'
                    ? 'text-indigo-400'
                    : 'text-emerald-400'
                }`}>
                  {user.role || 'STUDENT'}
                </span>
              </div>
            </button>

            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition-colors hidden sm:inline"
                title="Switch role persona or sign in"
              >
                Switch Role
              </button>
            )}

            {onResetDemo && (
              <button
                onClick={onResetDemo}
                className="hidden xl:inline text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline"
                title="Reset demo data to default baseline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-850 px-2 py-2 overflow-x-auto text-xs bg-slate-900/60">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onSelectTab(link.id)}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              activeTab === link.id
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
