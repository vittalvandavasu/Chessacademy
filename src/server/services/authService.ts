import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'chesscadet-production-secret-key-2026';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

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

  public static async getOrCreateUserByGoogle(googleData: {
    email: string;
    fullName: string;
    googleId: string;
    avatarUrl?: string;
  }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleData.googleId }, { email: googleData.email }],
      },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleData.email,
          fullName: googleData.fullName,
          googleId: googleData.googleId,
          avatarUrl: googleData.avatarUrl,
          role: 'STUDENT',
          profile: {
            create: {
              learningRating: 1200,
              totalXp: 0,
              level: 1,
              currentStreakDays: 1,
              longestStreakDays: 1,
              lastActiveDate: new Date().toISOString().split('T')[0],
              chessExperience: 'I play casually',
              onboardingCompleted: true,
            },
          },
        },
        include: { profile: true },
      });
    }

    return user;
  }

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
