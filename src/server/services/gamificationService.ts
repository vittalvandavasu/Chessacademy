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
   * Evaluates attempt eligibility and commits XP, Rating, Streak, Mastery, and Reward Records
   * entirely inside an atomic database transaction to prevent race condition farming and TOCTOU vulnerabilities.
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

    try {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Fetch user profile & exercise atomically inside transaction
          const [profile, exercise] = await Promise.all([
            tx.userProfile.findUnique({ where: { userId } }),
            tx.exercise.findUnique({ where: { id: exerciseId } }),
          ]);

          if (!profile || !exercise) {
            throw new Error('User profile or exercise not found in database');
          }

          // 2. Check prior reward records to determine true eligibility
          const todayStr = new Date().toISOString().split('T')[0];

          const [firstSolveReward, todayReward] = await Promise.all([
            tx.rewardRecord.findUnique({
              where: {
                userId_exerciseId_rewardType_rewardPeriod: {
                  userId,
                  exerciseId,
                  rewardType: 'FIRST_SOLVE',
                  rewardPeriod: 'LIFETIME',
                },
              },
            }),
            tx.rewardRecord.findUnique({
              where: {
                userId_exerciseId_rewardType_rewardPeriod: {
                  userId,
                  exerciseId,
                  rewardType: 'DAILY_REVIEW',
                  rewardPeriod: todayStr,
                },
              },
            }),
          ]);

          const isSameDayRepeat =
            (firstSolveReward && firstSolveReward.createdAt.toISOString().split('T')[0] === todayStr) ||
            todayReward !== null;

          let xpAwarded = 0;
          let isRewardEligible = false;
          let pendingRewardRecord: { rewardType: string; rewardPeriod: string; xp: number } | null = null;

          if (isSuccess) {
            if (!firstSolveReward) {
              // First time solving this exercise in account history
              isRewardEligible = true;
              const penaltyMultiplier = Math.max(0.4, 1.0 - hintsUsed * 0.2);
              xpAwarded = Math.round(exercise.xp * penaltyMultiplier);
              pendingRewardRecord = {
                rewardType: 'FIRST_SOLVE',
                rewardPeriod: 'LIFETIME',
                xp: xpAwarded,
              };
            } else if (!isSameDayRepeat) {
              // Spaced review on a subsequent day: awards maintenance XP
              isRewardEligible = true;
              xpAwarded = 5;
              pendingRewardRecord = {
                rewardType: 'DAILY_REVIEW',
                rewardPeriod: todayStr,
                xp: xpAwarded,
              };
            } else {
              // Already solved today: legitimate practice recorded, but zero XP farming
              isRewardEligible = false;
              xpAwarded = 0;
            }
          }

          // 3. Calculate Server-Authoritative Educational Rating Delta
          const expectedDifficulty = 800 + exercise.difficulty * 150;
          const diffGap = (expectedDifficulty - profile.learningRating) / 400;
          const expectedProb = 1 / (1 + Math.pow(10, -diffGap));
          const kFactor = 24;

          let actualScore = isSuccess ? 1 : 0;
          if (isSuccess && hintsUsed > 0) {
            actualScore = Math.max(0.2, 1 - hintsUsed * 0.25);
          }

          let ratingDelta = 0;
          if (!firstSolveReward || !isSuccess) {
            const rawDelta = Math.round(kFactor * (actualScore - expectedProb));
            ratingDelta = isSuccess ? Math.max(4, rawDelta) : Math.min(-3, rawDelta);
          } else {
            ratingDelta = isSuccess ? 1 : -2;
          }

          const newRating = Math.max(400, Math.min(2800, profile.learningRating + ratingDelta));

          // 4. Calculate Streak
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

          // 5. Record Attempt
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

          // 6. Atomically Update User Profile with Atomic Increments
          const updatedProfile = await tx.userProfile.update({
            where: { userId },
            data: {
              learningRating: newRating,
              totalXp: { increment: xpAwarded },
              level: Math.floor((profile.totalXp + xpAwarded) / 600) + 1,
              currentStreakDays: newStreak,
              longestStreakDays: longestStreak,
              lastActiveDate: todayStr,
              totalPracticeMinutes: { increment: Math.max(1, Math.round(timeTakenMs / 60000)) },
            },
          });

          // 7. Update Concept Mastery
          const existingMastery = await tx.conceptMastery.findUnique({
            where: {
              userId_conceptKey: {
                userId,
                conceptKey: exercise.conceptKey,
              },
            },
          });

          let masteryPct = existingMastery?.masteryPercentage ?? 50;
          const totalAtt = (existingMastery?.totalAttempts ?? 0) + 1;
          const succAtt = (existingMastery?.successfulAttempts ?? 0) + (isSuccess ? 1 : 0);
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

          // 8. Atomically claim RewardRecord
          if (pendingRewardRecord) {
            await tx.rewardRecord.create({
              data: {
                userId,
                exerciseId,
                rewardType: pendingRewardRecord.rewardType,
                rewardPeriod: pendingRewardRecord.rewardPeriod,
                xpAwarded: pendingRewardRecord.xp,
              },
            });
          }

          // 9. Badges
          const unlockedAchievements: string[] = [];
          if (newStreak >= 7) {
            try {
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
            } catch {
              // Non-critical badge check
            }
          }

          return {
            xpAwarded,
            ratingDelta,
            newRating,
            newTotalXp: updatedProfile.totalXp,
            newStreak,
            isRewardEligible,
            unlockedAchievements,
          };
        },
        { timeout: 30000, maxWait: 30000 }
      );
    } catch (err: any) {
      // If a race collision occurred on RewardRecord unique constraint (P2002),
      // another concurrent request claimed the first solve. Record attempt with 0 XP.
      if (err.code === 'P2002' || err.message?.includes('Unique constraint failed')) {
        await prisma.exerciseAttempt.create({
          data: {
            userId,
            exerciseId,
            isSuccess,
            hintsUsed,
            timeTakenMs,
            playedSan,
            ratingDelta: 0,
            xpAwarded: 0,
            isRewardEligible: false,
          },
        });
        const profile = await prisma.userProfile.findUnique({ where: { userId } });
        return {
          xpAwarded: 0,
          ratingDelta: 0,
          newRating: profile?.learningRating || 1000,
          newTotalXp: profile?.totalXp || 0,
          newStreak: profile?.currentStreakDays || 0,
          isRewardEligible: false,
          unlockedAchievements: [],
        };
      }
      throw err;
    }
  }
}
