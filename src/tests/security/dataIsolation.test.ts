import { startTestServer, TestServerContext } from './testHelper';
import { prisma } from '../../server/db/prisma';
import { AuthService } from '../../server/services/authService';
import { Chess } from 'chess.js';

let serverCtx: TestServerContext;
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

export async function runDataIsolationTests() {
  console.log('\n--- SUITE 6: MULTI-TENANT DATA ISOLATION TESTS ---');
  serverCtx = await startTestServer();

  try {
    // 1. Register User A
    const userAEmail = `student.a.${Date.now()}@example.com`;
    const regARes = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userAEmail,
        password: 'PasswordA123!',
        fullName: 'Student Alice',
      }),
    });
    const tokenA = regARes.data.token;
    const userAId = regARes.data.user.id;

    // 2. Register User B
    const userBEmail = `student.b.${Date.now()}@example.com`;
    const regBRes = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userBEmail,
        password: 'PasswordB123!',
        fullName: 'Student Bob',
      }),
    });
    const tokenB = regBRes.data.token;
    const userBId = regBRes.data.user.id;

    // Give User A some progress
    const lesson = await prisma.lesson.findFirst();
    await serverCtx.request(`/lessons/${lesson!.id}/complete`, { method: 'POST' }, tokenA);

    // TEST 1: User B querying /progress receives ONLY User B's progress, never User A's
    const progressBRes = await serverCtx.request('/progress', {}, tokenB);
    assert(progressBRes.status === 200, 'User B retrieves their own progress');
    assert(
      progressBRes.data.profile.userId === userBId,
      'Progress profile belongs strictly to authenticated User B'
    );
    assert(
      !progressBRes.data.completedLessons.includes(lesson!.id),
      "User B's completed lessons do NOT contain User A's completed lesson"
    );

    // TEST 2: User A querying /progress receives User A's progress
    const progressARes = await serverCtx.request('/progress', {}, tokenA);
    assert(progressARes.status === 200, 'User A retrieves their own progress');
    assert(
      progressARes.data.profile.userId === userAId,
      'Progress profile belongs strictly to authenticated User A'
    );
    assert(
      progressARes.data.completedLessons.includes(lesson!.id),
      "User A's completed lessons accurately contain their completed lesson"
    );

    // TEST 3: User B cannot submit attempts on behalf of User A by passing userId in body
    const exercise = await prisma.exercise.findFirst({ where: { status: 'VERIFIED' } });
    const targetMove = JSON.parse(exercise!.targetMoves)[0];
    const sim = new Chess(exercise!.fen);
    const moveObj = sim.move(targetMove);
    const attemptRes = await serverCtx.request(
      `/exercises/${exercise!.id}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify({
          from: moveObj!.from,
          to: moveObj!.to,
          userId: userAId, // Attempted impersonation
        }),
      },
      tokenB
    );

    // Verify attempt recorded in DB belongs to User B, NOT User A
    const latestAttempt = await prisma.exerciseAttempt.findFirst({
      where: { exerciseId: exercise!.id },
      orderBy: { createdAt: 'desc' },
    });

    assert(
      latestAttempt?.userId === userBId,
      'Authoritative engine attributed attempt to authenticated token owner (User B), ignoring client userId parameter'
    );

    // TEST 4: User B querying /me cannot receive User A's profile
    const meBRes = await serverCtx.request('/me', {}, tokenB);
    assert(meBRes.data.user.id === userBId, '/me accurately returns User B identity');
    assert(meBRes.data.user.email === userBEmail, '/me email matches User B email');
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('dataIsolation.test.ts')) {
  runDataIsolationTests()
    .then((res) => {
      console.log(`\nDATA ISOLATION RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
