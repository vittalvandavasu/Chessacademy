import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/layout/Navbar';
import { HomeDashboard } from './components/views/HomeDashboard';
import { PlayView } from './components/views/PlayView';
import { AnalyzeView } from './components/views/AnalyzeView';
import { AiTrainer } from './components/views/AiTrainer';
import { LearnView } from './components/views/LearnView';
import { OpeningsView } from './components/views/OpeningsView';
import { PracticeView } from './components/views/PracticeView';
import { PuzzlesView } from './components/views/PuzzlesView';
import { ProgressView } from './components/views/ProgressView';
import { ClassroomView } from './components/views/ClassroomView';
import { AdminView } from './components/views/AdminView';
import { LessonModal } from './components/views/LessonModal';
import { OnboardingModal } from './components/views/OnboardingModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { SettingsModal } from './components/profile/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { QuickCommandPalette } from './components/navigation/QuickCommandPalette';
import { StorageService, UserProfile } from './services/storageService';
import { UserStats, ConceptMastery, DailyPracticeSession, Achievement, Lesson } from './types/chess';
import { AdaptiveLearningEngine } from './services/adaptiveLearningEngine';
import { CURRICULUM_DATA } from './data/curriculumData';
import { ApiClient } from './services/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [user, setUser] = useState<UserProfile & { role?: string; id?: string }>(() => ({
    ...StorageService.getUser(),
    role: 'STUDENT',
  }));
  const [stats, setStats] = useState<UserStats>(() => StorageService.getStats());
  const [masteryList, setMasteryList] = useState<ConceptMastery[]>(() => StorageService.getMastery());
  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    StorageService.getCompletedLessons()
  );
  const [completedOpenings, setCompletedOpenings] = useState<string[]>(() =>
    StorageService.getCompletedOpenings()
  );
  const [dailyPractice, setDailyPractice] = useState<DailyPracticeSession>(() =>
    StorageService.getDailyPractice()
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    StorageService.getAchievements()
  );

  // Modals & Navigation triggers
  const [activeLessonModal, setActiveLessonModal] = useState<Lesson | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !StorageService.isOnboardingCompleted());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedOpeningIdForModal, setSelectedOpeningIdForModal] = useState<string | null>(null);
  const [practiceConceptFilter, setPracticeConceptFilter] = useState<string | null>(null);

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        let authUser: any = null;
        try {
          const meRes = await ApiClient.getMe();
          authUser = meRes.user;
        } catch {
          // If no active session, sign in default student account via standard login
          try {
            const loginRes = await ApiClient.login({
              email: 'alex@chesscadet.com',
              password: 'Scholar123!',
            });
            authUser = loginRes.user;
          } catch {
            // Continue in guest mode if server is not reachable
          }
        }

        if (authUser && isMounted) {
          const profile = authUser.profile || {};
          const updatedUser: UserProfile = {
            id: authUser.id || 'user-demo-alex',
            name: authUser.fullName || 'Alex Vance',
            email: authUser.email || 'alex@chesscadet.com',
            role: authUser.role || 'STUDENT',
            avatar: authUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
            chessExperience: profile.chessExperience || 'I know how the pieces move',
            joinedDate: '2026-09-26',
          };
          setUser(updatedUser);

          // Check if local storage needs migration into database
          const localStats = StorageService.getStats();
          if (localStats.totalXp > 0 && (!profile.totalXp || profile.totalXp === 0)) {
            try {
              await ApiClient.migrateLocalStorage({
                totalXp: localStats.totalXp,
                learningRating: localStats.learningRating,
                completedLessons: StorageService.getCompletedLessons(),
                currentStreakDays: localStats.currentStreakDays,
              });
            } catch (err) {
              console.warn('Migration warning:', err);
            }
          }

          // Fetch fresh server progress, mastery, and daily practice
          try {
            const [progRes, masteryRes, dailyRes] = await Promise.all([
              ApiClient.getProgress(),
              ApiClient.getMastery(),
              ApiClient.getDailyPractice(),
            ]);

            if (progRes.profile) {
              setStats((prev) => ({
                ...prev,
                learningRating: progRes.profile.learningRating ?? prev.learningRating,
                totalXp: progRes.profile.totalXp ?? prev.totalXp,
                level: progRes.profile.level ?? prev.level,
                currentStreakDays: progRes.profile.currentStreakDays ?? prev.currentStreakDays,
                longestStreakDays: progRes.profile.longestStreakDays ?? prev.longestStreakDays,
                lessonsCompleted: progRes.completedLessons?.length ?? prev.lessonsCompleted,
              }));
              if (progRes.completedLessons) {
                setCompletedLessons(progRes.completedLessons);
              }
            }

            if (masteryRes.masteryList && masteryRes.masteryList.length > 0) {
              setMasteryList(
                masteryRes.masteryList.map((m: any) => ({
                  concept: m.conceptKey as any,
                  name: m.concept?.name || m.conceptKey.replace(/_/g, ' '),
                  category: (m.concept?.category as any) || 'Tactics',
                  masteryPercentage: m.masteryPercentage,
                  totalAttempts: m.totalAttempts,
                  successfulAttempts: m.successfulAttempts,
                  recentErrors: m.recentErrors,
                  averageResponseTimeSeconds: m.averageResponseTimeSeconds,
                  lastPracticed: 'Recently',
                }))
              );
            }

            if (dailyRes.session) {
              setDailyPractice(dailyRes.session);
            }
          } catch (fetchErr) {
            console.warn('Could not fetch server progress, using local seed:', fetchErr);
          }
        }
      } catch (err) {
        console.warn('Init session error:', err);
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate biggest opportunity
  const biggestOpportunity = AdaptiveLearningEngine.getBiggestOpportunity(masteryList);

  // Handle lesson completion with backend sync
  const handleCompleteLesson = async (lessonId: string, xpReward: number) => {
    try {
      const res = await ApiClient.completeLesson(lessonId);
      const awarded = res.xpAwarded !== undefined ? res.xpAwarded : xpReward;
      StorageService.completeLesson(lessonId, awarded);
    } catch {
      StorageService.completeLesson(lessonId, xpReward);
    }
    setCompletedLessons(StorageService.getCompletedLessons());
    setStats(StorageService.getStats());
  };

  // Handle opening completion
  const handleCompleteOpening = (openingId: string, xpReward: number) => {
    StorageService.completeOpening(openingId, xpReward);
    setCompletedOpenings(StorageService.getCompletedOpenings());
    setStats(StorageService.getStats());
  };

  // Handle daily practice task completion
  const handleCompleteDailyTask = (taskId: string, xpGained: number) => {
    const updatedTasks = dailyPractice.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    const isAllDone = updatedTasks.every((t) => t.completed);
    const updatedSession: DailyPracticeSession = {
      ...dailyPractice,
      tasks: updatedTasks,
      isCompleted: isAllDone,
    };

    setDailyPractice(updatedSession);
    StorageService.saveDailyPractice(updatedSession);

    const newStats: UserStats = {
      ...stats,
      totalXp: stats.totalXp + xpGained,
      puzzlesSolved: stats.puzzlesSolved + 1,
      totalPracticeMinutes: stats.totalPracticeMinutes + 3,
      level: Math.floor((stats.totalXp + xpGained) / 600) + 1,
    };
    setStats(newStats);
    StorageService.saveStats(newStats);
  };

  const handleFinishDailyWorkout = () => {
    const updatedSession: DailyPracticeSession = {
      ...dailyPractice,
      isCompleted: true,
    };
    setDailyPractice(updatedSession);
    StorageService.saveDailyPractice(updatedSession);
  };

  // Handle puzzle rating adjustments
  const handleRatingChange = (newRating: number, delta: number) => {
    const newStats: UserStats = {
      ...stats,
      learningRating: newRating,
      puzzlesSolved: stats.puzzlesSolved + 1,
    };
    setStats(newStats);
    StorageService.saveStats(newStats);
  };

  const handleXpGained = (xp: number) => {
    const newStats: UserStats = {
      ...stats,
      totalXp: stats.totalXp + xp,
      level: Math.floor((stats.totalXp + xp) / 600) + 1,
    };
    setStats(newStats);
    StorageService.saveStats(newStats);
  };

  // Navigate to train a specific weakness
  const handleTrainWeakness = (concept: string) => {
    setPracticeConceptFilter(concept);
    setActiveTab('practice');
  };

  // Continue learning specific lesson
  const handleContinueLearning = (lessonId: string) => {
    for (const p of CURRICULUM_DATA) {
      for (const m of p.modules) {
        const found = m.lessons.find((l) => l.id === lessonId);
        if (found) {
          setActiveLessonModal(found);
          return;
        }
      }
    }
  };

  // Diagnostic experience onboarding selection
  const handleSelectExperience = (optionLabel: string, startingPathId: string) => {
    const updatedUser = {
      ...user,
      chessExperience: optionLabel,
    };
    setUser(updatedUser);
    StorageService.saveUser(updatedUser);
    StorageService.setOnboardingCompleted(true);
    setShowOnboarding(false);
    setActiveTab('learn');
  };

  // Reset Demo
  const handleResetDemo = () => {
    StorageService.resetDemo();
    setUser({ ...StorageService.getUser(), role: 'STUDENT' });
    setStats(StorageService.getStats());
    setMasteryList(StorageService.getMastery());
    setCompletedLessons(StorageService.getCompletedLessons());
    setDailyPractice(StorageService.getDailyPractice());
    setAchievements(StorageService.getAchievements());
    setShowProfileModal(false);
    setActiveTab('home');
  };

  // Handle Auth / Role switch success
  const handleAuthSuccess = (authUser: any) => {
    const profile = authUser.profile || {};
    const updated: UserProfile = {
      id: authUser.id || 'user-demo-alex',
      name: authUser.fullName || 'Alex Vance',
      email: authUser.email || 'alex@chesscadet.com',
      role: authUser.role || 'STUDENT',
      avatar: authUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      chessExperience: profile.chessExperience || 'I know how the pieces move',
      joinedDate: '2026-09-26',
    };
    setUser(updated);

    if (profile.totalXp !== undefined) {
      setStats((prev) => ({
        ...prev,
        totalXp: profile.totalXp,
        learningRating: profile.learningRating || prev.learningRating,
        level: profile.level || prev.level,
        currentStreakDays: profile.currentStreakDays || prev.currentStreakDays,
      }));
    }

    if (authUser.role === 'TEACHER') {
      setActiveTab('classroom');
    } else if (authUser.role === 'ADMIN') {
      setActiveTab('admin');
    }
  };

  const handleLogout = async () => {
    try {
      await ApiClient.logout();
    } catch {
      // Ignored
    }
    // Switch to student persona
    try {
      const demoRes = await ApiClient.switchDemoRole('STUDENT');
      handleAuthSuccess(demoRes.user);
    } catch {
      setUser({ ...StorageService.getUser(), role: 'STUDENT' });
    }
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F1E8] text-[#171717] selection:bg-[#315C45]/20 selection:text-[#315C45]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'practice') setPracticeConceptFilter(null);
        }}
        stats={stats}
        user={user}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onResetDemo={handleResetDemo}
        onOpenSearch={() => setShowCommandPalette(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {(activeTab === 'home' || activeTab === 'journey') && (
          <HomeDashboard
            user={user}
            stats={stats}
            masteryList={masteryList}
            dailyPractice={dailyPractice}
            biggestOpportunity={biggestOpportunity}
            onContinueLearning={handleContinueLearning}
            onStartDailyPractice={() => setActiveTab('practice')}
            onTrainWeakness={handleTrainWeakness}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'learn' && (
          <LearnView
            completedLessons={completedLessons}
            onCompleteLesson={handleCompleteLesson}
            onNavigateToOpenings={() => setActiveTab('openings')}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeView
            dailyPractice={dailyPractice}
            masteryList={masteryList}
            streakDays={stats.currentStreakDays}
            onCompleteTask={handleCompleteDailyTask}
            onFinishDailyWorkout={handleFinishDailyWorkout}
            initialConceptFilter={practiceConceptFilter}
          />
        )}

        {activeTab === 'play' && (
          <PlayView userRating={stats.learningRating} />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeView />
        )}

        {activeTab === 'trainer' && (
          <AiTrainer
            userRating={stats.learningRating}
            onBackToDashboard={() => setActiveTab('journey')}
          />
        )}

        {activeTab === 'openings' && (
          <OpeningsView
            completedOpenings={completedOpenings}
            onCompleteOpening={handleCompleteOpening}
            initialOpeningId={selectedOpeningIdForModal}
          />
        )}

        {activeTab === 'puzzles' && (
          <PuzzlesView
            learningRating={stats.learningRating}
            onRatingChange={handleRatingChange}
            onXpGained={handleXpGained}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            stats={stats}
            masteryList={masteryList}
            achievements={achievements}
            biggestOpportunity={biggestOpportunity}
            onTrainWeakness={handleTrainWeakness}
          />
        )}

        {activeTab === 'classroom' && (
          <ClassroomView
            userRole={user.role as any}
            onSwitchToTeacher={async () => {
              const res = await ApiClient.switchDemoRole('TEACHER');
              handleAuthSuccess(res.user);
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            userRole={user.role as any}
            onSwitchToAdmin={async () => {
              const res = await ApiClient.switchDemoRole('ADMIN');
              handleAuthSuccess(res.user);
            }}
          />
        )}
      </main>

      {/* Active Lesson Modal */}
      {activeLessonModal && (
        <LessonModal
          lesson={activeLessonModal}
          onClose={() => setActiveLessonModal(null)}
          onCompleteLesson={handleCompleteLesson}
        />
      )}

      {/* Diagnostic Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onSelectExperience={handleSelectExperience}
          onClose={() => {
            StorageService.setOnboardingCompleted(true);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Student Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          stats={stats}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={setUser}
          onResetDemo={handleResetDemo}
          onOpenAuth={() => {
            setShowProfileModal(false);
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Academy Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* Auth & Persona Switcher Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Quick Navigation Command Palette (⌘K) */}
      <QuickCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'practice') setPracticeConceptFilter(null);
        }}
        onSelectOpening={(openingId) => {
          setSelectedOpeningIdForModal(openingId);
          setActiveTab('openings');
        }}
        onSelectLesson={handleContinueLearning}
      />

      {/* Clean Educational Academic Footer */}
      <footer className="border-t border-[#D5D0C5] bg-[#E8E3D8]/60 py-8 px-4 text-xs text-[#171717]/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#171717] font-display">ChessCadet</span>
            <span aria-hidden="true">·</span>
            <span>A Personal Chess Academy That Teaches You How to Think</span>
          </div>
          <div className="flex items-center gap-4 text-[#171717]/60 text-[11px]">
            <span>Swiss Editorial Standards</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Rules Engine</span>
            <span aria-hidden="true">·</span>
            <span>Cadet Coach Pedagogical Layer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
