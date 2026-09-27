import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthService, toSafeUser } from '../services/authService';
import { ChessEvaluationService } from '../services/chessEvaluationService';
import { GamificationService } from '../services/gamificationService';
import { AdaptiveService } from '../services/adaptiveService';
import { PuzzleVerificationService } from '../services/puzzleVerificationService';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { validateBody } from '../middleware/validateMiddleware';
import {
  RegisterSchema,
  LoginSchema,
  MagicLinkRequestSchema,
  MagicLinkVerifySchema,
  ExerciseAttemptSchema,
  CreateClassroomSchema,
  JoinClassroomSchema,
  CreateAssignmentSchema,
  CreateExerciseSchema,
  MigrationPayloadSchema,
  UpdateUserRoleSchema,
} from '../validators/schemas';

export const apiRouter = Router();

// Helper to set HTTP-only cookie
function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

/**
 * Public User Registration
 * PRIORITY 1: NEVER accepts role from client. Always creates as 'STUDENT'.
 * PRIORITY 2: Never leaks passwordHash in response (uses toSafeUser).
 */
apiRouter.post('/auth/register', validateBody(RegisterSchema), async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = await AuthService.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: 'STUDENT', // Hardcoded server-side: public signups are ALWAYS STUDENT
        profile: {
          create: {
            learningRating: 1000,
            totalXp: 0,
            level: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
          },
        },
      },
      include: { profile: true },
    });

    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: 'STUDENT',
    });

    setAuthCookie(res, token);
    return res.status(201).json({ user: toSafeUser(user), token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * User Login
 * PRIORITY 2: Never returns passwordHash (uses toSafeUser).
 * Mitigates timing side-channel attacks for non-existent emails.
 */
apiRouter.post('/auth/login', validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      // Execute constant-time dummy compare to prevent timing side-channel enumeration
      await AuthService.compareWithDummy(password);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await AuthService.comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    setAuthCookie(res, token);
    return res.json({ user: toSafeUser(user), token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Request Magic Link
 * PRIORITY 4: Real cryptographically secure magic link generator.
 * If email infrastructure is not configured, returns 501 NOT IMPLEMENTED.
 * Never issues a JWT directly.
 */
apiRouter.post('/auth/magic-link', validateBody(MagicLinkRequestSchema), async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email delivery is configured in the environment
    const isEmailConfigured =
      process.env.EMAIL_PROVIDER_CONFIGURED === 'true' ||
      (process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_MAGIC_LINK === 'true');

    if (!isEmailConfigured) {
      return res.status(501).json({
        error: 'Email delivery infrastructure is not configured. Magic-link authentication is disabled.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent account enumeration, but do nothing
      return res.json({
        message: 'If an account exists with that email, a secure sign-in link has been sent.',
      });
    }

    // Generate cryptographically random token, store SHA-256 hash in DB with 15-min expiration
    const rawToken = await AuthService.createMagicLinkToken(user.id);

    // In test environment, provide token in response for automated testing
    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_MAGIC_LINK === 'true') {
      return res.json({
        message: 'Magic link generated for testing.',
        testToken: rawToken,
      });
    }

    return res.json({
      message: 'If an account exists with that email, a secure sign-in link has been sent.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Verify Magic Link Token
 * Validates token hash, checks expiration, marks token as used (one-time use), and issues session.
 */
apiRouter.post('/auth/magic-link/verify', validateBody(MagicLinkVerifySchema), async (req, res) => {
  try {
    const { token } = req.body;
    const result = await AuthService.verifyAndConsumeMagicLinkToken(token);

    if (!result.success || !result.user) {
      return res.status(401).json({ error: result.error || 'Invalid or expired magic link.' });
    }

    const sessionToken = AuthService.signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role as any,
    });

    setAuthCookie(res, sessionToken);
    return res.json({ user: toSafeUser(result.user), token: sessionToken });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Google OAuth Endpoint
 * PRIORITY 3: Real Google OAuth verification only.
 * Rejects arbitrary client-supplied identities if Google OAuth is not configured.
 */
apiRouter.post('/auth/google', async (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({
      error: 'Google OAuth is not configured in this environment.',
    });
  }

  return res.status(501).json({
    error: 'Google OAuth token verification requires backend OAuth credentials.',
  });
});

/**
 * Development Demo Switch
 * PRIORITY 0: STRICTLY disabled in production and disabled unless ALLOW_DEV_DEMO=true.
 */
apiRouter.post('/auth/demo-switch', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEV_DEMO !== 'true') {
    return res.status(403).json({
      error: 'Demo switch is disabled in this environment. It is forbidden in production.',
    });
  }

  const role = req.body.role;
  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const user = await AuthService.getOrCreateDemoUser(role);
  const token = AuthService.signToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  setAuthCookie(res, token);
  return res.json({ user: toSafeUser(user), token, switchedToRole: role });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ message: 'Signed out successfully.' });
});

apiRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: toSafeUser(user) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin User Role Promotion
 * PRIORITY 1: Only authenticated ADMIN may promote or reassign user roles.
 */
apiRouter.patch(
  '/admin/users/:id/role',
  authenticate,
  requireRole('ADMIN'),
  validateBody(UpdateUserRoleSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        include: { profile: true },
      });

      return res.json({ user: toSafeUser(updated) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 2. CURRICULUM & LESSON ROUTES
// ==========================================

apiRouter.get('/paths', async (_req, res) => {
  try {
    const paths = await prisma.learningPath.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        modules: {
          orderBy: { displayOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { displayOrder: 'asc' },
              include: {
                exercises: {
                  where: { status: 'VERIFIED' },
                  take: 5,
                },
              },
            },
          },
        },
      },
    });
    return res.json({ paths });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/lessons/:id', async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        exercises: {
          where: { status: 'VERIFIED' },
        },
        discussions: {
          include: { author: { select: { fullName: true, role: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    return res.json({ lesson });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/lessons/:id/complete', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const lessonId = req.params.id;

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    // Check if already completed to prevent XP replay farming
    if (existingProgress && existingProgress.isCompleted) {
      return res.json({
        message: 'Lesson already completed. Practice recorded.',
        xpAwarded: 0,
        isCompleted: true,
      });
    }

    const xpReward = lesson.xpReward || 50;
    await prisma.$transaction([
      prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: {
          userId,
          lessonId,
          isCompleted: true,
          completedAt: new Date(),
          xpAwarded: xpReward,
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          xpAwarded: xpReward,
        },
      }),
      prisma.userProfile.update({
        where: { userId },
        data: {
          totalXp: { increment: xpReward },
        },
      }),
    ]);

    return res.json({
      message: 'Lesson completed successfully.',
      xpAwarded: xpReward,
      isCompleted: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SERVER-AUTHORITATIVE EXERCISE ATTEMPTS & HINT SESSIONS
// ==========================================

/**
 * PRIORITY 7: Authoritative Exercise Session Tracking to prevent Hint Spoofing.
 */
apiRouter.post('/exercises/:id/session', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const exerciseId = req.params.id;

    const session = await prisma.exerciseSession.create({
      data: {
        userId,
        exerciseId,
      },
    });

    return res.status(201).json({ sessionId: session.id, hintsRequested: 0 });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Request Hint
 * PRIORITY 7: The server records hint usage authoritatively on the session.
 */
apiRouter.post('/exercises/:id/hint', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const exerciseId = req.params.id;
    const { sessionId } = req.body;

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    let hintsCount = 1;
    if (sessionId) {
      const session = await prisma.exerciseSession.findUnique({ where: { id: sessionId } });
      if (session && session.userId === userId) {
        hintsCount = Math.min(4, session.hintsRequested + 1);
        await prisma.exerciseSession.update({
          where: { id: sessionId },
          data: { hintsRequested: hintsCount },
        });
      }
    }

    let hintContent = exercise.conceptHint;
    if (hintsCount === 2) hintContent = exercise.areaHint;
    else if (hintsCount === 3) hintContent = exercise.pieceHint;
    else if (hintsCount === 4) hintContent = exercise.moveHint;

    return res.json({
      hintsRequested: hintsCount,
      hint: hintContent,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Submit Exercise Attempt
 * PRIORITY 6: Evaluates move and applies atomic Gamification transaction.
 * PRIORITY 7: Uses authoritative session hint count if sessionId provided.
 */
apiRouter.post(
  '/exercises/:id/attempt',
  optionalAuthenticate,
  validateBody(ExerciseAttemptSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.userId;
      const exerciseId = req.params.id;
      const { from, to, promotion, stepIndex, sessionId, timeTakenMs } = req.body;

      // 1. Authoritative hint resolution
      let authoritativeHints = req.body.hintsUsed;
      if (sessionId && userId) {
        const session = await prisma.exerciseSession.findUnique({ where: { id: sessionId } });
        if (session && session.userId === userId) {
          authoritativeHints = Math.max(authoritativeHints, session.hintsRequested);
        }
      }

      // 2. Headless Chess.js Server Validation
      const evalResult = await ChessEvaluationService.evaluateAttempt(exerciseId, {
        from,
        to,
        promotion,
        stepIndex,
      });

      if (!evalResult.isLegal) {
        return res.status(400).json({
          isLegal: false,
          isSuccess: false,
          explanation: evalResult.explanation,
        });
      }

      // 3. Server-Authoritative Gamification & Atomic DB Transaction (if authenticated)
      let gamificationResult = null;
      if (userId) {
        gamificationResult = await GamificationService.processAttemptTransaction({
          userId,
          exerciseId,
          isSuccess: evalResult.isSuccess,
          hintsUsed: authoritativeHints,
          timeTakenMs,
          playedSan: evalResult.playedSan || `${from}${to}`,
        });
      } else {
        const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
        gamificationResult = {
          xpAwarded: evalResult.isSuccess ? (exercise?.xp || 25) : 0,
          ratingDelta: evalResult.isSuccess ? 10 : 0,
          newRating: 1000,
          newTotalXp: evalResult.isSuccess ? (exercise?.xp || 25) : 0,
          newStreak: 1,
          isRewardEligible: true,
          unlockedAchievements: [],
        };
      }

      return res.json({
        ...evalResult,
        gamification: gamificationResult,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 4. MASTERY, PROGRESS & DAILY PRACTICE
// ==========================================

apiRouter.get('/mastery', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await AdaptiveService.getUserMastery(req.user!.userId);
    return res.json({ masteryList: list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/daily-practice', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const session = await AdaptiveService.getPersonalizedDailyPractice(req.user!.userId);
    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/progress', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [profile, completedLessons, attemptsCount] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.lessonProgress.findMany({ where: { userId, isCompleted: true } }),
      prisma.exerciseAttempt.count({ where: { userId } }),
    ]);

    return res.json({
      profile,
      completedLessons: completedLessons.map((l) => l.lessonId),
      totalAttemptsCount: attemptsCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CLASSROOM & TEACHER ROUTES
// ==========================================

apiRouter.get('/classrooms', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole === 'TEACHER') {
      const classrooms = await prisma.classroom.findMany({
        where: { teacherId: userId },
        include: {
          members: { include: { student: { select: { id: true, fullName: true, email: true, profile: true } } } },
          assignments: true,
        },
      });
      return res.json({ classrooms });
    } else {
      const memberships = await prisma.classroomMember.findMany({
        where: { studentId: userId },
        include: { classroom: { include: { assignments: true } } },
      });
      return res.json({ classrooms: memberships.map((m) => m.classroom) });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post(
  '/classrooms',
  authenticate,
  requireRole('TEACHER', 'ADMIN'),
  validateBody(CreateClassroomSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const teacherId = req.user!.userId;
      const { name } = req.body;
      const joinCode = `CHESS-${Math.floor(1000 + Math.random() * 9000)}`;

      const classroom = await prisma.classroom.create({
        data: {
          teacherId,
          name,
          joinCode,
        },
      });

      return res.status(201).json({ classroom });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

apiRouter.post(
  ['/classrooms/join', '/classrooms/:id/join'],
  authenticate,
  validateBody(JoinClassroomSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.user!.userId;
      const { joinCode } = req.body;

      const classroom = await prisma.classroom.findUnique({
        where: { joinCode },
      });

      if (!classroom) {
        return res.status(404).json({ error: 'Classroom with this code does not exist.' });
      }

      await prisma.classroomMember.upsert({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId } },
        create: { classroomId: classroom.id, studentId },
        update: {},
      });

      return res.json({ message: 'Successfully joined classroom.', classroom });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Teacher Classroom Analytics
 * PRIORITY 8: FIX TEACHER IDOR.
 * Verifies that the authenticated teacher actually owns this classroom, or caller is ADMIN.
 */
apiRouter.get(
  '/teacher/classrooms/:id/analytics',
  authenticate,
  requireRole('TEACHER', 'ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });

      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found.' });
      }

      // Authorization Check: Must be classroom owner or system ADMIN
      if (req.user!.role !== 'ADMIN' && classroom.teacherId !== req.user!.userId) {
        return res.status(403).json({
          error: 'Access denied. You do not own this classroom.',
        });
      }

      const members = await prisma.classroomMember.findMany({
        where: { classroomId },
        include: {
          student: {
            include: {
              profile: true,
              conceptMastery: true,
              lessonProgress: true,
            },
          },
        },
      });

      const conceptStats: Record<string, { total: number; sumMastery: number; lowCount: number }> = {};

      members.forEach((m) => {
        m.student.conceptMastery.forEach((cm) => {
          if (!conceptStats[cm.conceptKey]) {
            conceptStats[cm.conceptKey] = { total: 0, sumMastery: 0, lowCount: 0 };
          }
          conceptStats[cm.conceptKey].total += 1;
          conceptStats[cm.conceptKey].sumMastery += cm.masteryPercentage;
          if (cm.masteryPercentage < 50) {
            conceptStats[cm.conceptKey].lowCount += 1;
          }
        });
      });

      const conceptWeaknesses = Object.entries(conceptStats).map(([key, stat]) => ({
        conceptKey: key,
        avgMastery: Math.round(stat.sumMastery / stat.total),
        strugglingPercentage: Math.round((stat.lowCount / stat.total) * 100),
      }));

      return res.json({
        totalStudents: members.length,
        conceptWeaknesses,
        students: members.map((m) => ({
          id: m.student.id,
          name: m.student.fullName,
          rating: m.student.profile?.learningRating || 1000,
          xp: m.student.profile?.totalXp || 0,
          lessonsCompleted: m.student.lessonProgress.filter((l) => l.isCompleted).length,
        })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 6. ADMIN CMS & PUZZLE VERIFICATION PIPELINE
// ==========================================

apiRouter.get(
  '/admin/exercises',
  authenticate,
  requireRole('ADMIN'),
  async (_req, res) => {
    try {
      const exercises = await prisma.exercise.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ exercises });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

apiRouter.post(
  '/admin/exercises',
  authenticate,
  requireRole('ADMIN'),
  validateBody(CreateExerciseSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        conceptKey,
        exerciseType,
        difficulty,
        fen,
        targetMoves,
        conceptHint,
        areaHint,
        pieceHint,
        moveHint,
        explanation,
        xp,
      } = req.body;

      const verification = PuzzleVerificationService.verifyExercise({
        fen,
        targetMoves,
        conceptKey,
        exerciseType,
        difficulty,
      });

      const exercise = await prisma.exercise.create({
        data: {
          id: `admin-ex-${Date.now()}`,
          conceptKey,
          exerciseType,
          difficulty,
          fen,
          targetMoves: JSON.stringify(targetMoves),
          conceptHint,
          areaHint,
          pieceHint,
          moveHint,
          explanation,
          xp,
          status: verification.status,
        },
      });

      return res.status(201).json({
        exercise,
        verification,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 7. SECURE PROGRESS MIGRATION
// ==========================================

/**
 * PRIORITY 5: REMOVE /api/migrate GAMIFICATION BACKDOOR
 * Only allows a one-time import of non-competitive completed lesson IDs.
 * Strictly prevents self-awarding of XP, rating, or streaks.
 * Idempotent: repeated calls are rejected.
 */
apiRouter.post(
  '/migrate',
  authenticate,
  validateBody(MigrationPayloadSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { completedLessons } = req.body;

      const profile = await prisma.userProfile.findUnique({ where: { userId } });
      if (!profile) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      if (profile.isMigrated) {
        return res.status(400).json({
          error: 'User account has already been migrated. Repeated migrations are rejected.',
          migrated: false,
        });
      }

      // Import non-competitive lesson completion IDs with 0 XP (unverified historical record)
      if (completedLessons && Array.isArray(completedLessons)) {
        for (const lessonId of completedLessons) {
          await prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: { userId, lessonId, isCompleted: true, xpAwarded: 0 },
            update: { isCompleted: true },
          });
        }
      }

      // Mark account as migrated once and for all. Never touch totalXp or learningRating.
      await prisma.userProfile.update({
        where: { userId },
        data: {
          isMigrated: true,
        },
      });

      return res.json({
        message: 'Completed lessons imported successfully. Competitive statistics remain server-authoritative.',
        migrated: true,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);
