import { prisma } from '../db/prisma';

export interface GamificationAttemptReward {
  xpAwarded: number;
  ratingDelta: number;
  newRating: number;
  newTotalXp: number;
  newStreak: number;
  isRewardEligible: boolean;
  unlockedAchievements: string[];
}

export class GamificationService {
  /**
   * Evaluates attempt eligibility and commits XP, Rating, Streak, and Mastery in an atomic transaction
   */
  public static async processAttemptTransaction(params: {
    userId: string;
    exerciseId: string;
    isSuccess: boolean;
    hintsUsed: number;
    timeTakenMs: number;
    playedSan: string;
  }): Promise<GamificationAttemptReward> {
    const { userId, exerciseId, isSuccess, hintsUsed, timeTakenMs, playedSan } = params;

    // Load user profile & exercise details
    const [profile, exercise] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.exercise.findUnique({ where: { id: exerciseId } }),
    ]);

    if (!profile || !exercise) {
      throw new Error('User profile or exercise not found');
    }

    // Check prior attempts to determine REWARD-ELIGIBILITY
    const priorAttempts = await prisma.exerciseAttempt.findMany({
      where: { userId, exerciseId, isSuccess: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const isFirstTimeSuccess = priorAttempts.length === 0 && isSuccess;
    const todayStr = new Date().toISOString().split('T')[0];
    const isSameDayRepeat =
      priorAttempts.length > 0 &&
      priorAttempts[0].createdAt.toISOString().split('T')[0] === todayStr;

    // REWARD POLICY:
    // 1. First solve: Full exercise XP with hint deduction
    // 2. Repeat on future days (spaced repetition): Maintenance +5 XP
    // 3. Repeat on same day: 0 XP (anti-farming protection)
    let xpAwarded = 0;
    let isRewardEligible = false;

    if (isSuccess) {
      if (isFirstTimeSuccess) {
        isRewardEligible = true;
        // Hint penalty: -20% per hint, minimum 40% of base
        const penaltyMultiplier = Math.max(0.4, 1.0 - hintsUsed * 0.2);
        xpAwarded = Math.round(exercise.xp * penaltyMultiplier);
      } else if (!isSameDayRepeat) {
        // Spaced repetition review bonus
        isRewardEligible = true;
        xpAwarded = 5;
      } else {
        // Same-day practice: recorded for practice, 0 XP
        isRewardEligible = false;
        xpAwarded = 0;
      }
    }

    // EDUCATIONAL RATING CALCULATION (Server-Authoritative):
    // Expected rating gap formula
    const expectedDifficulty = 800 + exercise.difficulty * 150;
    const diffGap = (expectedDifficulty - profile.learningRating) / 400;
    const expectedProb = 1 / (1 + Math.pow(10, -diffGap));
    const kFactor = 24;

    let actualScore = isSuccess ? 1 : 0;
    if (isSuccess && hintsUsed > 0) {
      actualScore = Math.max(0.2, 1 - hintsUsed * 0.25);
    }

    let ratingDelta = 0;
    if (isFirstTimeSuccess || !isSuccess) {
      const rawDelta = Math.round(kFactor * (actualScore - expectedProb));
      ratingDelta = isSuccess ? Math.max(4, rawDelta) : Math.min(-3, rawDelta);
    } else {
      // Small maintenance delta for repeat practice
      ratingDelta = isSuccess ? 1 : -2;
    }

    const newRating = Math.max(400, Math.min(2800, profile.learningRating + ratingDelta));
    const newTotalXp = profile.totalXp + xpAwarded;
    const newLevel = Math.floor(newTotalXp / 600) + 1;

    // STREAK CALCULATION:
    let newStreak = profile.currentStreakDays;
    let longestStreak = profile.longestStreakDays;

    if (isSuccess && profile.lastActiveDate !== todayStr) {
      const lastActive = new Date(profile.lastActiveDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      longestStreak = Math.max(longestStreak, newStreak);
    }

    const unlockedAchievements: string[] = [];

    // EXECUTE ATOMIC DATABASE TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Record Attempt
      await tx.exerciseAttempt.create({
        data: {
          userId,
          exerciseId,
          isSuccess,
          hintsUsed,
          timeTakenMs,
          playedSan,
          ratingDelta,
          xpAwarded,
          isRewardEligible,
        },
      });

      // 2. Update User Profile
      await tx.userProfile.update({
        where: { userId },
        data: {
          learningRating: newRating,
          totalXp: newTotalXp,
          level: newLevel,
          currentStreakDays: newStreak,
          longestStreakDays: longestStreak,
          lastActiveDate: todayStr,
          totalPracticeMinutes: profile.totalPracticeMinutes + Math.max(1, Math.round(timeTakenMs / 60000)),
        },
      });

      // 3. Update Concept Mastery
      const existingMastery = await tx.conceptMastery.findUnique({
        where: {
          userId_conceptKey: {
            userId,
            conceptKey: exercise.conceptKey,
          },
        },
      });

      let masteryPct = existingMastery?.masteryPercentage ?? 50;
      let totalAtt = (existingMastery?.totalAttempts ?? 0) + 1;
      let succAtt = (existingMastery?.successfulAttempts ?? 0) + (isSuccess ? 1 : 0);
      let errors = existingMastery?.recentErrors ?? 0;

      if (isSuccess) {
        if (hintsUsed === 0) {
          masteryPct = Math.min(100, masteryPct + 7);
          errors = Math.max(0, errors - 1);
        } else {
          masteryPct = Math.min(100, masteryPct + Math.max(1, 4 - hintsUsed));
        }
      } else {
        masteryPct = Math.max(10, masteryPct - 6);
        errors += 1;
      }

      await tx.conceptMastery.upsert({
        where: {
          userId_conceptKey: {
            userId,
            conceptKey: exercise.conceptKey,
          },
        },
        create: {
          userId,
          conceptKey: exercise.conceptKey,
          masteryPercentage: masteryPct,
          totalAttempts: 1,
          successfulAttempts: isSuccess ? 1 : 0,
          recentErrors: isSuccess ? 0 : 1,
          averageResponseTimeSeconds: timeTakenMs / 1000,
        },
        update: {
          masteryPercentage: masteryPct,
          totalAttempts: totalAtt,
          successfulAttempts: succAtt,
          recentErrors: errors,
          lastPracticedAt: new Date(),
        },
      });

      // 4. Check & Award Badges
      if (newStreak >= 7) {
        const streakBadge = await tx.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: 'seven-day-streak' } },
        });
        if (!streakBadge || !streakBadge.isUnlocked) {
          await tx.userAchievement.upsert({
            where: { userId_achievementId: { userId, achievementId: 'seven-day-streak' } },
            create: { userId, achievementId: 'seven-day-streak', isUnlocked: true, progress: 100, unlockedAt: new Date() },
            update: { isUnlocked: true, progress: 100, unlockedAt: new Date() },
          });
          unlockedAchievements.push('7-Day Scholar Streak');
        }
      }
    });

    return {
      xpAwarded,
      ratingDelta,
      newRating,
      newTotalXp,
      newStreak,
      isRewardEligible,
      unlockedAchievements,
    };
  }
}
