import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'chesscadet-production-secret-key-2026';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: any;
}

/**
 * Explicit Response DTO to prevent passwordHash from leaking into JSON responses.
 */
export function toSafeUser(user: any): SafeUser {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

// Pre-computed dummy hash to prevent timing attacks when an email does not exist
const DUMMY_HASH = '$2a$10$wT8B9ZzV5U.gVp8d2w/hEu8d8bM0uW9p6z6f9G2e3F4h5j6k7l8m9';

export class AuthService {
  public static signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  public static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static async compareWithDummy(password: string): Promise<boolean> {
    return bcrypt.compare(password, DUMMY_HASH);
  }

  /**
   * Cryptographically secure Magic Link Token generator.
   * Stores SHA-256 hash in database with 15-minute expiration and one-time use flag.
   */
  public static async createMagicLinkToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.magicLinkToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Validates raw token, ensures it is not expired and not previously used, marks used atomically.
   */
  public static async verifyAndConsumeMagicLinkToken(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return prisma.$transaction(async (tx) => {
      const record = await tx.magicLinkToken.findUnique({
        where: { tokenHash },
        include: { user: { include: { profile: true } } },
      });

      if (!record) {
        return { success: false, error: 'Invalid or unknown magic-link token.' };
      }

      if (record.usedAt !== null) {
        return { success: false, error: 'Magic-link token has already been used.' };
      }

      if (new Date() > record.expiresAt) {
        return { success: false, error: 'Magic-link token has expired.' };
      }

      // Mark token as consumed
      await tx.magicLinkToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      return { success: true, user: record.user };
    });
  }

  /**
   * Seed demo user strictly for development/testing environments.
   */
  public static async getOrCreateDemoUser(role: 'STUDENT' | 'TEACHER' | 'ADMIN') {
    const demoEmail =
      role === 'ADMIN'
        ? 'admin@chesscadet.com'
        : role === 'TEACHER'
        ? 'teacher@chesscadet.com'
        : 'alex@chesscadet.com';

    const fullName =
      role === 'ADMIN'
        ? 'Master Architect (Admin)'
        : role === 'TEACHER'
        ? 'Grandmaster Sarah Chen (Coach)'
        : 'Alex Vance (Student)';

    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { profile: true },
    });

    if (!user) {
      const passwordHash = await this.hashPassword('chesscadet123');
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          fullName,
          passwordHash,
          role,
          avatarUrl:
            role === 'STUDENT'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
              : undefined,
          profile: {
            create: {
              learningRating: role === 'STUDENT' ? 1240 : 1850,
              totalXp: role === 'STUDENT' ? 4820 : 15000,
              level: role === 'STUDENT' ? 8 : 25,
              currentStreakDays: role === 'STUDENT' ? 7 : 45,
              longestStreakDays: role === 'STUDENT' ? 14 : 60,
              lastActiveDate: new Date().toISOString().split('T')[0],
              accuracyRate: role === 'STUDENT' ? 78.5 : 94.2,
              totalPracticeMinutes: role === 'STUDENT' ? 340 : 1200,
              chessExperience: 'I know basic tactics',
              onboardingCompleted: true,
            },
          },
        },
        include: { profile: true },
      });
    }

    return user;
  }
}
