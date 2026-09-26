import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthService } from '../services/authService';
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
  MagicLinkSchema,
  GoogleAuthSchema,
  DemoSwitchSchema,
  ExerciseAttemptSchema,
  CreateClassroomSchema,
  JoinClassroomSchema,
  CreateAssignmentSchema,
  CreateExerciseSchema,
  MigrationPayloadSchema,
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

apiRouter.post('/auth/register', validateBody(RegisterSchema), async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
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
        role,
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
      role: user.role as any,
    });

    setAuthCookie(res, token);
    return res.status(201).json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/login', validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
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
    return res.json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/magic-link', validateBody(MagicLinkSchema), async (req, res) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: email.split('@')[0],
          role: 'STUDENT',
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
    }

    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    setAuthCookie(res, token);
    return res.json({ user, token, message: 'Magic link authenticated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/google', validateBody(GoogleAuthSchema), async (req, res) => {
  try {
    const user = await AuthService.getOrCreateUserByGoogle(req.body);
    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    setAuthCookie(res, token);
    return res.json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/demo-switch', validateBody(DemoSwitchSchema), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await AuthService.getOrCreateDemoUser(role);
    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    setAuthCookie(res, token);
    return res.json({ user, token, switchedToRole: role });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
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

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

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

    // Award full completion XP atomically
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
// 3. SERVER-AUTHORITATIVE EXERCISE ATTEMPT
// ==========================================

apiRouter.post(
  '/exercises/:id/attempt',
  authenticate,
  validateBody(ExerciseAttemptSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const exerciseId = req.params.id;
      const { from, to, promotion, stepIndex, hintsUsed, timeTakenMs } = req.body;

      // 1. Headless Chess.js Server Validation
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

      // 2. Server-Authoritative Gamification & Atomic DB Transaction
      const gamificationResult = await GamificationService.processAttemptTransaction({
        userId,
        exerciseId,
        isSuccess: evalResult.isSuccess,
        hintsUsed,
        timeTakenMs,
        playedSan: evalResult.playedSan || `${from}${to}`,
      });

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
          members: { include: { student: { include: { profile: true } } } },
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
  '/classrooms/:id/join',
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

apiRouter.get(
  '/teacher/classrooms/:id/analytics',
  authenticate,
  requireRole('TEACHER', 'ADMIN'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
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

      // Compute aggregated concept weaknesses across students
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

      // Run verification pipeline
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

apiRouter.post(
  '/admin/exercises/:id/verify',
  authenticate,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const exercise = await prisma.exercise.findUnique({
        where: { id: req.params.id },
      });
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      const targetMoves = JSON.parse(exercise.targetMoves || '[]');
      const verification = PuzzleVerificationService.verifyExercise({
        fen: exercise.fen,
        targetMoves,
        conceptKey: exercise.conceptKey,
        exerciseType: exercise.exerciseType,
      });

      await prisma.exercise.update({
        where: { id: exercise.id },
        data: { status: verification.status },
      });

      return res.json({ verification });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ==========================================
// 7. LOCALSTORAGE PROGRESS MIGRATION
// ==========================================

apiRouter.post(
  '/migrate',
  authenticate,
  validateBody(MigrationPayloadSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { totalXp, learningRating, completedLessons, currentStreakDays } = req.body;

      const profile = await prisma.userProfile.findUnique({ where: { userId } });
      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Mark imported client data as MIGRATED, capping to realistic thresholds
      const safeXp = Math.min(10000, Math.max(profile.totalXp, totalXp || 0));
      const safeRating = Math.min(2000, Math.max(profile.learningRating, learningRating || 1200));

      await prisma.userProfile.update({
        where: { userId },
        data: {
          totalXp: safeXp,
          learningRating: safeRating,
          currentStreakDays: currentStreakDays || profile.currentStreakDays,
        },
      });

      if (completedLessons && Array.isArray(completedLessons)) {
        for (const lessonId of completedLessons) {
          await prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: { userId, lessonId, isCompleted: true, xpAwarded: 0 },
            update: { isCompleted: true },
          });
        }
      }

      return res.json({
        message: 'Client progress migrated into database account.',
        migrated: true,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);
