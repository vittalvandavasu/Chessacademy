import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
});

export const MagicLinkRequestSchema = z.object({
  email: z.string().email(),
});

export const MagicLinkVerifySchema = z.object({
  token: z.string().min(16),
});

export const StartSessionSchema = z.object({
  exerciseId: z.string(),
});

export const ExerciseAttemptSchema = z.object({
  from: z.string().regex(/^[a-h][1-8]$/, 'Invalid source square'),
  to: z.string().regex(/^[a-h][1-8]$/, 'Invalid destination square'),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional().default('q'),
  stepIndex: z.number().int().nonnegative().default(0),
  sessionId: z.string().optional(),
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

// SECURE MIGRATION: Accepts ONLY non-competitive completed lesson IDs.
// Competitive attributes (totalXp, learningRating, streak) are NEVER accepted from client.
export const MigrationPayloadSchema = z.object({
  completedLessons: z.array(z.string()).default([]),
});
