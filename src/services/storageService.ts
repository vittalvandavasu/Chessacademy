import {
  UserStats,
  ConceptMastery,
  DailyPracticeSession,
  Achievement,
  ClassroomStudent,
  ClassroomAssignment,
  DiscussionComment,
  Exercise,
} from '../types/chess';
import { INITIAL_CONCEPT_MASTERY, AdaptiveLearningEngine } from './adaptiveLearningEngine';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';
import { PUZZLES_DATA } from '../data/puzzlesData';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'student' | 'teacher' | 'admin';
  chessExperience: string;
  joinedDate: string;
}

const DEFAULT_USER: UserProfile = {
  id: 'user-demo-alex',
  name: 'Alex Vance',
  email: 'alex.chess@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  role: 'student',
  chessExperience: 'I know basic tactics',
  joinedDate: '2026-08-15',
};

const DEFAULT_STATS: UserStats = {
  learningRating: 1240,
  totalXp: 4820,
  level: 8,
  currentStreakDays: 7,
  longestStreakDays: 14,
  lastActiveDate: new Date().toISOString().split('T')[0],
  lessonsCompleted: 24,
  puzzlesSolved: 68,
  accuracyRate: 78.5,
  totalPracticeMinutes: 340,
};

const DEFAULT_STUDENTS: ClassroomStudent[] = [
  {
    id: 's-1',
    name: 'Sarah Chen',
    avatar: 'SC',
    lessonsCompleted: 28,
    accuracy: 86.2,
    weakestConcept: 'Pins',
    learningRating: 1310,
    lastActive: '2 hours ago',
  },
  {
    id: 's-2',
    name: 'Marcus Brody',
    avatar: 'MB',
    lessonsCompleted: 19,
    accuracy: 71.0,
    weakestConcept: 'Back Rank Mates',
    learningRating: 1180,
    lastActive: '5 hours ago',
  },
  {
    id: 's-3',
    name: 'Elena Rostova',
    avatar: 'ER',
    lessonsCompleted: 34,
    accuracy: 91.5,
    weakestConcept: 'Opposition',
    learningRating: 1460,
    lastActive: 'Yesterday',
  },
  {
    id: 's-4',
    name: 'Liam O’Connor',
    avatar: 'LO',
    lessonsCompleted: 14,
    accuracy: 64.8,
    weakestConcept: 'Back Rank Mates',
    learningRating: 1040,
    lastActive: '3 days ago',
  },
  {
    id: 's-5',
    name: 'Aisha Al-Mansoor',
    avatar: 'AA',
    lessonsCompleted: 22,
    accuracy: 79.4,
    weakestConcept: 'Forks',
    learningRating: 1220,
    lastActive: 'Today',
  },
];

const DEFAULT_ASSIGNMENTS: ClassroomAssignment[] = [
  {
    id: 'asg-1',
    title: 'Back Rank Defense & Luft Practice',
    dueDate: 'Oct 02, 2026',
    pathOrLessonTitle: 'Path 2: First Tactics',
    targetExercisesCount: 10,
    completedCount: 4,
    totalStudents: 5,
  },
  {
    id: 'asg-2',
    title: 'Opening Principles & Center Dominance',
    dueDate: 'Oct 08, 2026',
    pathOrLessonTitle: 'Path 3: Opening Principles',
    targetExercisesCount: 8,
    completedCount: 2,
    totalStudents: 5,
  },
];

const DEFAULT_DISCUSSIONS: DiscussionComment[] = [
  {
    id: 'c-1',
    lessonId: 'les-the-pin',
    authorName: 'Master_Tigran',
    authorAvatar: 'MT',
    authorRating: 1820,
    timestamp: '2 days ago',
    content: 'Remember that an absolute pin against the King cannot be broken by moving the pinned piece—the rules of chess literally make that an illegal move! Always exploit it by adding pressure with pawns.',
    upvotes: 24,
  },
  {
    id: 'c-2',
    lessonId: 'les-the-pin',
    authorName: 'ChessCadet_Dev',
    authorAvatar: 'CD',
    authorRating: 1540,
    timestamp: '1 day ago',
    content: 'In exercise 1, notice how the e-file rook turns the enemy knight into a statue. The knight cannot even sacrifice itself because of the check rule.',
    upvotes: 11,
  },
  {
    id: 'c-3',
    lessonId: 'les-back-rank-mate',
    authorName: 'GrandmasterPawn',
    authorAvatar: 'GP',
    authorRating: 1650,
    timestamp: '3 days ago',
    content: 'A good habit in classical openings: once you castle, play h3 or g3 at an opportune moment. This creates "luft" and prevents 99% of sudden back-rank disasters.',
    upvotes: 39,
  },
];

const STORAGE_KEYS = {
  USER: 'chesscadet_user_profile',
  STATS: 'chesscadet_user_stats',
  MASTERY: 'chesscadet_concept_mastery',
  COMPLETED_LESSONS: 'chesscadet_completed_lessons',
  DAILY_PRACTICE: 'chesscadet_daily_practice',
  ACHIEVEMENTS: 'chesscadet_achievements',
  CUSTOM_EXERCISES: 'chesscadet_custom_exercises',
  DISCUSSIONS: 'chesscadet_discussions',
  ONBOARDING_DONE: 'chesscadet_onboarding_completed',
};

export class StorageService {
  public static getUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  public static saveUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
      // Storage unavailable
    }
  }

  public static getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  }

  public static saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {
      // Storage unavailable
    }
  }

  public static getMastery(): ConceptMastery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MASTERY);
      return data ? JSON.parse(data) : INITIAL_CONCEPT_MASTERY;
    } catch {
      return INITIAL_CONCEPT_MASTERY;
    }
  }

  public static saveMastery(mastery: ConceptMastery[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(mastery));
    } catch {
      // Storage unavailable
    }
  }

  public static getCompletedLessons(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      return data ? JSON.parse(data) : ['les-rook-movement', 'les-bishop-movement', 'les-knight-movement'];
    } catch {
      return ['les-rook-movement', 'les-bishop-movement', 'les-knight-movement'];
    }
  }

  public static completeLesson(lessonId: string, xpReward: number): void {
    const completed = this.getCompletedLessons();
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(completed));

      const stats = this.getStats();
      stats.lessonsCompleted += 1;
      stats.totalXp += xpReward;
      stats.level = Math.floor(stats.totalXp / 600) + 1;
      this.saveStats(stats);
    }
  }

  public static getDailyPractice(): DailyPracticeSession {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_PRACTICE);
      const today = new Date().toISOString().split('T')[0];
      if (data) {
        const parsed: DailyPracticeSession = JSON.parse(data);
        if (parsed.date === today) {
          return parsed;
        }
      }
      const mastery = this.getMastery();
      const newSession = AdaptiveLearningEngine.generateDailyPractice(mastery, PUZZLES_DATA);
      this.saveDailyPractice(newSession);
      return newSession;
    } catch {
      return AdaptiveLearningEngine.generateDailyPractice(INITIAL_CONCEPT_MASTERY, PUZZLES_DATA);
    }
  }

  public static saveDailyPractice(session: DailyPracticeSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_PRACTICE, JSON.stringify(session));
    } catch {
      // Storage unavailable
    }
  }

  public static getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : ACHIEVEMENTS_DATA;
    } catch {
      return ACHIEVEMENTS_DATA;
    }
  }

  public static getCustomExercises(): Exercise[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomExercise(ex: Exercise): void {
    const list = this.getCustomExercises();
    list.unshift(ex);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(list));
  }

  public static getDiscussions(lessonId?: string): DiscussionComment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DISCUSSIONS);
      const list: DiscussionComment[] = data ? JSON.parse(data) : DEFAULT_DISCUSSIONS;
      return lessonId ? list.filter((c) => c.lessonId === lessonId) : list;
    } catch {
      return DEFAULT_DISCUSSIONS;
    }
  }

  public static addDiscussionComment(comment: DiscussionComment): void {
    const list = this.getDiscussions();
    list.unshift(comment);
    localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(list));
  }

  public static getClassroomStudents(): ClassroomStudent[] {
    return DEFAULT_STUDENTS;
  }

  public static getClassroomAssignments(): ClassroomAssignment[] {
    return DEFAULT_ASSIGNMENTS;
  }

  public static isOnboardingCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
  }

  public static setOnboardingCompleted(completed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, completed ? 'true' : 'false');
  }

  public static resetDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.MASTERY);
    localStorage.removeItem(STORAGE_KEYS.COMPLETED_LESSONS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_PRACTICE);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.DISCUSSIONS);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DONE);
  }
}
