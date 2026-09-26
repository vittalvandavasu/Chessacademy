import {
  TacticalConcept,
  ConceptMastery,
  Exercise,
  DailyPracticeSession,
  DailyPracticeTask,
  UserStats,
} from '../types/chess';
import { PUZZLES_DATA } from '../data/puzzlesData';

export const INITIAL_CONCEPT_MASTERY: ConceptMastery[] = [
  {
    concept: 'FORK',
    name: 'Knight & Double Forks',
    category: 'Tactics',
    masteryPercentage: 82,
    totalAttempts: 34,
    successfulAttempts: 28,
    lastPracticed: '2026-09-24T18:30:00Z',
    recentErrors: 1,
    averageResponseTimeSeconds: 6.4,
  },
  {
    concept: 'PIN',
    name: 'Pins & Relative Ties',
    category: 'Tactics',
    masteryPercentage: 61,
    totalAttempts: 28,
    successfulAttempts: 17,
    lastPracticed: '2026-09-23T11:20:00Z',
    recentErrors: 3,
    averageResponseTimeSeconds: 9.8,
  },
  {
    concept: 'SKEWER',
    name: 'Skewers & X-Ray Attacks',
    category: 'Tactics',
    masteryPercentage: 91,
    totalAttempts: 22,
    successfulAttempts: 20,
    lastPracticed: '2026-09-25T14:10:00Z',
    recentErrors: 0,
    averageResponseTimeSeconds: 5.2,
  },
  {
    concept: 'BACK_RANK_MATE',
    name: 'Back Rank Mates',
    category: 'Tactics',
    masteryPercentage: 37, // Critical weakness!
    totalAttempts: 19,
    successfulAttempts: 7,
    lastPracticed: '2026-09-22T08:45:00Z',
    recentErrors: 5,
    averageResponseTimeSeconds: 14.1,
  },
  {
    concept: 'DISCOVERED_ATTACK',
    name: 'Discovered Attacks',
    category: 'Tactics',
    masteryPercentage: 54,
    totalAttempts: 16,
    successfulAttempts: 9,
    lastPracticed: '2026-09-21T19:00:00Z',
    recentErrors: 2,
    averageResponseTimeSeconds: 11.2,
  },
  {
    concept: 'DEFLECTION',
    name: 'Deflection & Overloading',
    category: 'Tactics',
    masteryPercentage: 48,
    totalAttempts: 12,
    successfulAttempts: 6,
    lastPracticed: '2026-09-20T16:15:00Z',
    recentErrors: 3,
    averageResponseTimeSeconds: 13.5,
  },
  {
    concept: 'CENTER_CONTROL',
    name: 'Center Control & Space',
    category: 'Strategy',
    masteryPercentage: 88,
    totalAttempts: 25,
    successfulAttempts: 22,
    lastPracticed: '2026-09-25T10:00:00Z',
    recentErrors: 0,
    averageResponseTimeSeconds: 4.8,
  },
  {
    concept: 'DEVELOPMENT',
    name: 'Opening Tempo & Development',
    category: 'Strategy',
    masteryPercentage: 84,
    totalAttempts: 30,
    successfulAttempts: 25,
    lastPracticed: '2026-09-24T12:00:00Z',
    recentErrors: 1,
    averageResponseTimeSeconds: 5.1,
  },
  {
    concept: 'OPPOSITION',
    name: 'King Opposition & Endgames',
    category: 'Endgames',
    masteryPercentage: 42,
    totalAttempts: 14,
    successfulAttempts: 6,
    lastPracticed: '2026-09-19T20:40:00Z',
    recentErrors: 4,
    averageResponseTimeSeconds: 16.0,
  },
];

export class AdaptiveLearningEngine {
  /**
   * Identifies the primary concept weakness (mastery < 40% or lowest with recent errors)
   */
  public static getBiggestOpportunity(masteryList: ConceptMastery[]): ConceptMastery | null {
    if (!masteryList.length) return null;
    const sorted = [...masteryList].sort((a, b) => {
      // Prioritize low mastery and high recent errors
      const scoreA = a.masteryPercentage - a.recentErrors * 4;
      const scoreB = b.masteryPercentage - b.recentErrors * 4;
      return scoreA - scoreB;
    });
    return sorted[0];
  }

  /**
   * Calculates recommendation score for spaced repetition
   * Score = (100 - mastery) * 0.5 + recentErrors * 10 + decayPenalty
   */
  public static calculateRecommendationScore(mastery: ConceptMastery): number {
    const daysSinceLast = Math.max(
      0,
      (Date.now() - new Date(mastery.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
    );
    // Spaced repetition decay: +2 points per day of neglect
    const decayScore = Math.min(20, daysSinceLast * 2);
    const weaknessWeight = (100 - mastery.masteryPercentage) * 0.6;
    const errorWeight = mastery.recentErrors * 8;

    return weaknessWeight + errorWeight + decayScore;
  }

  /**
   * Updates mastery score based on exercise outcome
   */
  public static updateMastery(
    current: ConceptMastery,
    success: boolean,
    hintsUsed: number,
    timeSeconds: number
  ): ConceptMastery {
    const attempts = current.totalAttempts + 1;
    const successes = success ? current.successfulAttempts + 1 : current.successfulAttempts;
    let newErrors = current.recentErrors;

    let delta = 0;
    if (success) {
      if (hintsUsed === 0) {
        delta = +7;
        newErrors = Math.max(0, newErrors - 1);
      } else {
        delta = Math.max(2, 5 - hintsUsed);
      }
    } else {
      delta = -6;
      newErrors = newErrors + 1;
    }

    const updatedPercentage = Math.min(100, Math.max(10, current.masteryPercentage + delta));
    const avgTime = (current.averageResponseTimeSeconds * current.totalAttempts + timeSeconds) / attempts;

    return {
      ...current,
      masteryPercentage: Math.round(updatedPercentage),
      totalAttempts: attempts,
      successfulAttempts: successes,
      lastPracticed: new Date().toISOString(),
      recentErrors: newErrors,
      averageResponseTimeSeconds: Math.round(avgTime * 10) / 10,
    };
  }

  /**
   * Updates educational Learning Rating (ELO-style educational formula)
   */
  public static updateLearningRating(
    currentRating: number,
    difficulty: number,
    success: boolean,
    hintsUsed: number
  ): { newRating: number; change: number } {
    const expectedDifficultyRating = 800 + difficulty * 150; // Diff 1: 950, Diff 2: 1100, Diff 3: 1250, Diff 4: 1400
    const diffGap = (expectedDifficultyRating - currentRating) / 400;
    const expectedProb = 1 / (1 + Math.pow(10, -diffGap));

    const kFactor = 24;
    let actualScore = success ? 1 : 0;
    if (success && hintsUsed > 0) {
      actualScore = Math.max(0.3, 1 - hintsUsed * 0.2);
    }

    const rawDelta = Math.round(kFactor * (actualScore - expectedProb));
    const change = success ? Math.max(4, rawDelta) : Math.min(-3, rawDelta);
    const newRating = Math.max(400, Math.min(2600, currentRating + change));

    return { newRating, change };
  }

  /**
   * Generates a Personalized Daily Practice session dynamically
   */
  public static generateDailyPractice(
    masteryList: ConceptMastery[],
    availablePuzzles: Exercise[] = PUZZLES_DATA
  ): DailyPracticeSession {
    const biggestWeakness = this.getBiggestOpportunity(masteryList);
    const sortedByWeakness = [...masteryList].sort((a, b) => a.masteryPercentage - b.masteryPercentage);
    const secondaryWeakness = sortedByWeakness[1] || sortedByWeakness[0];
    const mastered = sortedByWeakness.filter((m) => m.masteryPercentage > 75).pop() || sortedByWeakness[sortedByWeakness.length - 1];

    const tasks: DailyPracticeTask[] = [];

    // 1. Warmup (tactics, difficulty 1)
    const warmupPuz =
      availablePuzzles.find((p) => p.difficulty === 1) || availablePuzzles[0];
    tasks.push({
      id: 'task-warmup',
      title: '5-Minute Tactical Warmup',
      concept: warmupPuz.concept,
      exercise: warmupPuz,
      completed: false,
      type: 'warmup',
    });

    // 2. Primary Weakness (e.g. Back Rank Mate)
    const weaknessPuzzles = availablePuzzles.filter((p) => p.concept === biggestWeakness?.concept);
    if (weaknessPuzzles.length > 0) {
      tasks.push({
        id: 'task-weakness-1',
        title: `${biggestWeakness?.name || 'Tactics'} Drill`,
        concept: biggestWeakness?.concept || 'BACK_RANK_MATE',
        exercise: weaknessPuzzles[0],
        completed: false,
        type: 'weakness',
      });
    }

    // 3. Secondary Weakness (e.g. Pin)
    const secPuzzles = availablePuzzles.filter((p) => p.concept === secondaryWeakness?.concept);
    if (secPuzzles.length > 0) {
      tasks.push({
        id: 'task-secondary-1',
        title: `${secondaryWeakness.name} Exercise`,
        concept: secondaryWeakness.concept,
        exercise: secPuzzles[0],
        completed: false,
        type: 'weakness',
      });
    }

    // 4. Mixed Challenge (Difficulty 3)
    const challengePuz =
      availablePuzzles.find((p) => p.difficulty >= 3) || availablePuzzles[availablePuzzles.length - 1];
    tasks.push({
      id: 'task-challenge',
      title: 'Mixed Tactical Challenge',
      concept: challengePuz.concept,
      exercise: challengePuz,
      completed: false,
      type: 'challenge',
    });

    // 5. Spaced Repetition Review (Mastered concept)
    const reviewPuz =
      availablePuzzles.find((p) => p.concept === mastered?.concept) || availablePuzzles[2];
    tasks.push({
      id: 'task-review',
      title: `Spaced Review: ${mastered?.name || 'Fundamental'}`,
      concept: reviewPuz.concept,
      exercise: reviewPuz,
      completed: false,
      type: 'review',
    });

    return {
      date: new Date().toISOString().split('T')[0],
      tasks,
      totalXp: 180,
      estimatedMinutes: 12,
      isCompleted: false,
    };
  }
}
