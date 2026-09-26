import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).default('STUDENT'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const MagicLinkSchema = z.object({
  email: z.string().email(),
});

export const GoogleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z.string().email(),
  fullName: z.string(),
  googleId: z.string(),
  avatarUrl: z.string().optional(),
});

export const DemoSwitchSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
});

export const ExerciseAttemptSchema = z.object({
  from: z.string().regex(/^[a-h][1-8]$/, 'Invalid source square'),
  to: z.string().regex(/^[a-h][1-8]$/, 'Invalid destination square'),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional().default('q'),
  stepIndex: z.number().int().nonnegative().default(0),
  hintsUsed: z.number().int().min(0).max(4).default(0),
  timeTakenMs: z.number().int().nonnegative().default(1000),
});

export const CreateClassroomSchema = z.object({
  name: z.string().min(3).max(100),
});

export const JoinClassroomSchema = z.object({
  joinCode: z.string().min(4).max(16),
});

export const CreateAssignmentSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().min(3),
  conceptKey: z.string().optional(),
  targetExerciseCount: z.number().int().min(1).max(50),
  dueDate: z.string(),
});

export const CreateExerciseSchema = z.object({
  conceptKey: z.string(),
  exerciseType: z.string(),
  difficulty: z.number().int().min(1).max(5),
  fen: z.string(),
  targetMoves: z.array(z.string()).min(1),
  conceptHint: z.string(),
  areaHint: z.string(),
  pieceHint: z.string(),
  moveHint: z.string(),
  explanation: z.string(),
  xp: z.number().int().min(5).max(100).default(20),
});

export const MigrationPayloadSchema = z.object({
  totalXp: z.number().int().nonnegative().optional(),
  learningRating: z.number().int().min(400).max(2800).optional(),
  completedLessons: z.array(z.string()).optional(),
  puzzlesSolved: z.number().int().nonnegative().optional(),
  currentStreakDays: z.number().int().nonnegative().optional(),
});
