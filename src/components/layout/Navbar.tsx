import React, { useState } from 'react';
import { UserStats } from '../../types/chess';
import { UserProfile } from '../../services/storageService';
import { ChessCadetLogo } from '../branding/ChessCadetLogo';
import {
  Search,
  BookOpen,
  Zap,
  Swords,
  Brain,
  Sliders,
  User,
  Compass,
  ArrowRight,
  Flame,
} from 'lucide-react';

export type NavTab =
  | 'journey'
  | 'home'
  | 'learn'
  | 'practice'
  | 'play'
  | 'analyze'
  | 'trainer'
  | 'openings'
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
  onOpenSettings?: () => void;
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
  onOpenSettings,
  onOpenAuth,
  onResetDemo,
  onOpenSearch,
}) => {
  // Main Navigation strictly 4 items: LEARN, PRACTICE, PLAY, ANALYZE
  const mainNavItems: { id: NavTab; label: string }[] = [
    { id: 'learn', label: 'LEARN' },
    { id: 'practice', label: 'PRACTICE' },
    { id: 'play', label: 'PLAY' },
    { id: 'analyze', label: 'ANALYZE' },
  ];

  const isJourneyActive = activeTab === 'journey' || activeTab === 'home';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F5F1E8]/95 backdrop-blur-xs border-b border-[#D5D0C5] text-[#171717] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Academic Crest & Brand Lockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('journey')}
            className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[#315C45] rounded"
            title="ChessCadet · Your Chess Journey"
          >
            <ChessCadetLogo size="sm" showWordmark={true} />
          </button>

          {/* Subtle Journey Indicator button */}
          <button
            onClick={() => onSelectTab('journey')}
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded transition-colors ${
              isJourneyActive
                ? 'bg-[#315C45] text-white'
                : 'text-[#171717]/60 hover:text-[#171717] hover:bg-[#E8E3D8]'
            }`}
          >
            <span>JOURNEY</span>
          </button>
        </div>

        {/* Zone 2: Main Navigation (Strictly: LEARN, PRACTICE, PLAY, ANALYZE) */}
        <nav className="hidden md:flex items-center gap-8">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`py-1 text-xs font-semibold tracking-widest uppercase transition-all relative ${
                  isActive
                    ? 'text-[#315C45]'
                    : 'text-[#171717]/70 hover:text-[#171717]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-[#315C45]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Secondary Controls (Search, Discipline, Settings, Profile) */}
        <div className="flex items-center gap-3">
          {/* Quick Search Shortcut */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 py-1.5 px-2.5 rounded bg-[#E8E3D8] hover:bg-[#D5D0C5]/60 border border-[#D5D0C5] text-[#171717]/70 hover:text-[#171717] text-xs transition-colors"
              title="Search Curriculum & Concepts (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#315C45]" />
              <span className="hidden lg:inline text-[11px]">Search</span>
              <kbd className="hidden lg:inline text-[9px] font-mono text-[#171717]/50 bg-[#F5F1E8] px-1 py-0.5 rounded border border-[#D5D0C5]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Learning Streak Discipline */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#171717] font-mono px-2 py-1 bg-[#E8E3D8] border border-[#D5D0C5] rounded"
            title={`${stats.currentStreakDays}-day study discipline`}
          >
            <Flame className="w-3.5 h-3.5 text-[#C7A45D]" />
            <span className="font-semibold">{stats.currentStreakDays}d</span>
          </div>

          {/* Secondary: SETTINGS */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded hover:bg-[#E8E3D8] text-[#171717]/70 hover:text-[#171717] transition-colors"
              title="Settings & Board Preferences"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Secondary: PROFILE */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 border-l border-[#D5D0C5] group text-left"
            title="User Profile & Academic Record"
          >
            <div className="w-7 h-7 rounded bg-[#E8E3D8] border border-[#D5D0C5] group-hover:border-[#315C45] flex items-center justify-center text-xs font-bold text-[#315C45] transition-colors">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="text-xs font-semibold text-[#171717] leading-tight">
                {user.name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-mono text-[#171717]/60 leading-tight">
                Level {stats.level}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Bar */}
      <div className="md:hidden flex items-center justify-around px-3 py-2 border-t border-[#D5D0C5] text-xs bg-[#E8E3D8]/70">
        <button
          onClick={() => onSelectTab('journey')}
          className={`py-1 px-2 font-semibold text-[11px] tracking-wider uppercase ${
            isJourneyActive ? 'text-[#315C45] font-bold' : 'text-[#171717]/70'
          }`}
        >
          JOURNEY
        </button>
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`py-1 px-2 font-semibold text-[11px] tracking-wider uppercase ${
                isActive ? 'text-[#315C45] font-bold' : 'text-[#171717]/70'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
