import React from 'react';
import { UserStats } from '../../types/chess';
import { UserProfile } from '../../services/storageService';
import { ChessCadetLogo } from '../branding/ChessCadetLogo';
import {
  Flame,
  Zap,
  Search,
  BookOpen,
  Compass,
  Target,
  GraduationCap,
  TrendingUp,
  Users,
  ShieldAlert,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'learn'
  | 'openings'
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
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  user,
  onOpenProfile,
  onOpenAuth,
  onResetDemo,
  onOpenSearch,
}) => {
  const navLinks: { id: NavTab; label: string; icon: any }[] = [
    { id: 'home', label: 'Dashboard', icon: TrendingUp },
    { id: 'learn', label: 'Curriculum', icon: BookOpen },
    { id: 'openings', label: 'Openings', icon: Compass },
    { id: 'puzzles', label: 'Tactics', icon: Target },
    { id: 'practice', label: 'Practice', icon: Zap },
    { id: 'progress', label: 'Mastery', icon: GraduationCap },
    { id: 'classroom', label: 'Classroom', icon: Users },
    { id: 'admin', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Redesigned Logo */}
        <button
          onClick={() => onSelectTab('home')}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          title="ChessCadet Home"
        >
          <ChessCadetLogo size="sm" showWordmark={true} />
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Omni-Search + Metrics & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Search Shortcut Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors shadow-inner"
              title="Quick Search (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Gamification Stats: Streak & XP */}
          <div className="hidden sm:flex items-center gap-3 text-xs pl-2 border-l border-slate-850">
            {/* Streak */}
            <div
              className="flex items-center gap-1 font-mono-nums text-amber-400 font-semibold"
              title={`${stats.currentStreakDays}-day study streak`}
            >
              <Flame className="w-4 h-4 fill-amber-500/20 text-amber-500" />
              <span>{stats.currentStreakDays}d</span>
            </div>

            {/* Level & XP */}
            <div
              className="flex items-center gap-1 font-mono-nums text-emerald-400 font-semibold"
              title={`Level ${stats.level} · ${stats.totalXp} XP`}
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">{stats.totalXp} XP</span>
            </div>
          </div>

          {/* User Profile Avatar & Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
              title="Open User Profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-xs font-bold text-emerald-400 group-hover:border-emerald-500/50 transition-colors shadow-sm">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.name.split(' ')[0]}
                </span>
                <span
                  className={`text-[10px] font-mono leading-tight ${
                    user.role === 'ADMIN'
                      ? 'text-amber-400 font-bold'
                      : user.role === 'TEACHER'
                      ? 'text-indigo-400 font-bold'
                      : 'text-emerald-400'
                  }`}
                >
                  {user.role || 'STUDENT'}
                </span>
              </div>
            </button>

            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white border border-slate-800 transition-colors hidden md:inline"
                title="Switch persona or sign in"
              >
                Switch Role
              </button>
            )}

            {onResetDemo && (
              <button
                onClick={onResetDemo}
                className="hidden 2xl:inline text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline"
                title="Reset demo data to default baseline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-t border-slate-850 overflow-x-auto text-xs bg-slate-950/80">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`py-1 px-2.5 rounded-md whitespace-nowrap transition-colors text-xs font-medium ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
