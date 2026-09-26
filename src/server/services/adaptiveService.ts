import { prisma } from '../db/prisma';
import { ConceptGraphService } from './conceptGraphService';

export interface MasteryModel {
  calculateMastery(current: number, success: boolean, hints: number, timeMs: number): number;
}

export interface RecommendationModel {
  getTopWeakness(masteryRecords: { conceptKey: string; masteryPercentage: number; recentErrors: number }[]): string | null;
}

export interface SpacedRepetitionModel {
  computeDecay(daysSinceLast: number, currentMastery: number): number;
}

export class StandardMasteryModel implements MasteryModel {
  calculateMastery(current: number, success: boolean, hints: number, timeMs: number): number {
    let delta = 0;
    if (success) {
      delta = hints === 0 ? 7 : Math.max(1, 4 - hints);
    } else {
      delta = -6;
    }
    return Math.max(10, Math.min(100, current + delta));
  }
}

export class StandardRecommendationModel implements RecommendationModel {
  getTopWeakness(
    masteryRecords: { conceptKey: string; masteryPercentage: number; recentErrors: number }[]
  ): string | null {
    if (!masteryRecords.length) return null;
    const sorted = [...masteryRecords].sort((a, b) => {
      const scoreA = a.masteryPercentage - a.recentErrors * 4;
      const scoreB = b.masteryPercentage - b.recentErrors * 4;
      return scoreA - scoreB;
    });
    return sorted[0].conceptKey;
  }
}

export class AdaptiveService {
  private static masteryModel: MasteryModel = new StandardMasteryModel();
  private static recommendationModel: RecommendationModel = new StandardRecommendationModel();

  public static async getUserMastery(userId: string) {
    const list = await prisma.conceptMastery.findMany({
      where: { userId },
      include: { concept: true },
      orderBy: { masteryPercentage: 'asc' },
    });
    return list;
  }

  public static async getPersonalizedDailyPractice(userId: string) {
    const masteries = await prisma.conceptMastery.findMany({
      where: { userId },
    });

    const masteryMap: Record<string, number> = {};
    masteries.forEach((m) => {
      masteryMap[m.conceptKey] = m.masteryPercentage;
    });

    // 1. Identify primary concept weakness
    let primaryConcept = this.recommendationModel.getTopWeakness(masteries) || 'BACK_RANK_MATE';

    // 2. Check concept graph for root prerequisite weakness!
    const rootConcept = ConceptGraphService.findRootWeakness(primaryConcept, masteryMap);
    if (rootConcept !== primaryConcept) {
      primaryConcept = rootConcept;
    }

    // 3. Query exercises for daily workout
    const [warmupEx, weaknessEx1, weaknessEx2, challengeEx, reviewEx] = await Promise.all([
      prisma.exercise.findFirst({ where: { difficulty: 1, status: 'VERIFIED' } }),
      prisma.exercise.findFirst({ where: { conceptKey: primaryConcept, status: 'VERIFIED' } }),
      prisma.exercise.findFirst({ where: { conceptKey: primaryConcept, status: 'VERIFIED' }, skip: 1 }),
      prisma.exercise.findFirst({ where: { difficulty: { gte: 3 }, status: 'VERIFIED' } }),
      prisma.exercise.findFirst({ where: { difficulty: 2, status: 'VERIFIED' } }),
    ]);

    const tasks = [
      {
        id: 'task-warmup',
        title: '5-Minute Tactical Warmup',
        type: 'warmup',
        exercise: warmupEx,
      },
      {
        id: 'task-weakness-1',
        title: `${primaryConcept.replace(/_/g, ' ')} Drill 1`,
        type: 'weakness',
        exercise: weaknessEx1 || warmupEx,
      },
      {
        id: 'task-weakness-2',
        title: `${primaryConcept.replace(/_/g, ' ')} Drill 2`,
        type: 'weakness',
        exercise: weaknessEx2 || weaknessEx1 || warmupEx,
      },
      {
        id: 'task-challenge',
        title: 'Tactical Challenge',
        type: 'challenge',
        exercise: challengeEx || warmupEx,
      },
      {
        id: 'task-review',
        title: 'Spaced Review',
        type: 'review',
        exercise: reviewEx || warmupEx,
      },
    ];

    return {
      date: new Date().toISOString().split('T')[0],
      tasks,
      totalXp: 180,
      estimatedMinutes: 12,
    };
  }
}
