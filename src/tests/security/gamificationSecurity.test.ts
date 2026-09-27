import { startTestServer, TestServerContext } from './testHelper';
import { prisma } from '../../server/db/prisma';
import { AuthService } from '../../server/services/authService';

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

export async function runGamificationSecurityTests() {
  console.log('\n--- SUITE 3: SERVER-AUTHORITATIVE GAMIFICATION & ANTI-CHEAT TESTS ---');
  serverCtx = await startTestServer();

  try {
    const studentUser = await AuthService.getOrCreateDemoUser('STUDENT');
    const studentToken = AuthService.signToken({
      userId: studentUser.id,
      email: studentUser.email,
      role: 'STUDENT',
    });

    // Find verified exercise
    const exercise = await prisma.exercise.findFirst({
      where: { conceptKey: 'BACK_RANK_MATE', status: 'VERIFIED' },
    });
    assert(exercise !== null, `Found target exercise: ${exercise?.id}`);

    // Clean prior rewards for clean test state
    await prisma.rewardRecord.deleteMany({
      where: { userId: studentUser.id, exerciseId: exercise!.id },
    });
    await prisma.exerciseAttempt.deleteMany({
      where: { userId: studentUser.id, exerciseId: exercise!.id },
    });

    const initialProfile = await prisma.userProfile.findUnique({
      where: { userId: studentUser.id },
    });
    const startingXp = initialProfile!.totalXp;
    const startingRating = initialProfile!.learningRating;

    // TEST 1: Tampered attempt with hostile values (xp: 99999, rating: 3000, mastery: 100)
    // Server must ignore these fabricated fields
    const targetMoves = JSON.parse(exercise!.targetMoves);
    const correctTarget = targetMoves[0];
    let fromSq = 'd1';
    let toSq = 'd8';
    if (correctTarget.includes('e8')) {
      fromSq = 'e1';
      toSq = 'e8';
    }

    const tamperedRes = await serverCtx.request(
      `/exercises/${exercise!.id}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify({
          from: fromSq,
          to: toSq,
          promotion: 'q',
          xp: 999999, // Hostile injected value
          rating: 3000, // Hostile injected value
          mastery: 100, // Hostile injected value
          userId: 'other-user-uuid', // Hostile impersonation attempt
        }),
      },
      studentToken
    );

    assert(tamperedRes.status === 200, 'Attempt submitted successfully');
    assert(tamperedRes.data.isSuccess === true, 'Move evaluated as successful on authoritative chess engine');
    assert(tamperedRes.data.gamification.xpAwarded !== 999999, 'Server derived XP authoritatively, completely ignoring 999,999 XP injection');
    assert(tamperedRes.data.gamification.newRating !== 3000, 'Server derived rating authoritatively, completely ignoring 3000 rating injection');

    const profileAfter1 = await prisma.userProfile.findUnique({
      where: { userId: studentUser.id },
    });
    assert(
      profileAfter1!.totalXp === startingXp + tamperedRes.data.gamification.xpAwarded,
      'Database UserProfile totalXp matches calculated server XP reward'
    );

    // TEST 2: Illegal move rejected
    const illegalRes = await serverCtx.request(
      `/exercises/${exercise!.id}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify({
          from: 'a1',
          to: 'a6', // Illegal move
        }),
      },
      studentToken
    );
    assert(illegalRes.status === 400, 'Illegal chess move is rejected with 400 Bad Request');
    assert(illegalRes.data.isLegal === false, 'Engine reports isLegal: false');

    // TEST 3: Anti-Farming - Immediate repeat on same day awards 0 XP
    const repeatRes = await serverCtx.request(
      `/exercises/${exercise!.id}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify({
          from: fromSq,
          to: toSq,
        }),
      },
      studentToken
    );

    assert(repeatRes.status === 200, 'Repeat practice attempt recorded');
    assert(repeatRes.data.gamification.xpAwarded === 0, 'Immediate same-day replay awards 0 XP (anti-farming protection)');
    assert(repeatRes.data.gamification.isRewardEligible === false, 'Same-day replay is flagged NOT reward eligible');

    const profileAfterRepeat = await prisma.userProfile.findUnique({
      where: { userId: studentUser.id },
    });
    assert(
      profileAfterRepeat!.totalXp === profileAfter1!.totalXp,
      'UserProfile totalXp was NOT inflated by repeat practice attempt'
    );

    // TEST 4: Hint Spoofing Prevention via Authoritative Server Session
    // User starts a session, requests 3 hints from server, then attempts to submit hintsUsed: 0
    const sessionRes = await serverCtx.request(
      `/exercises/${exercise!.id}/session`,
      { method: 'POST' },
      studentToken
    );
    assert(sessionRes.status === 201, 'Authoritative exercise session created');
    const sessionId = sessionRes.data.sessionId;

    // Request hints from server
    await serverCtx.request(`/exercises/${exercise!.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId }) }, studentToken);
    await serverCtx.request(`/exercises/${exercise!.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId }) }, studentToken);
    const hint3 = await serverCtx.request(`/exercises/${exercise!.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId }) }, studentToken);
    assert(hint3.data.hintsRequested === 3, 'Server recorded 3 hints requested on session');

    // Create a new exercise for testing hint penalty
    const hintTestEx = await prisma.exercise.create({
      data: {
        id: `hint-test-ex-${Date.now()}`,
        conceptKey: 'BACK_RANK_MATE',
        exerciseType: 'FIND_THE_CHECKMATE',
        difficulty: 1,
        fen: exercise!.fen,
        targetMoves: exercise!.targetMoves,
        conceptHint: 'hint1',
        areaHint: 'hint2',
        pieceHint: 'hint3',
        moveHint: 'hint4',
        explanation: 'test',
        xp: 20,
        status: 'VERIFIED',
      },
    });

    const session2Res = await serverCtx.request(
      `/exercises/${hintTestEx.id}/session`,
      { method: 'POST' },
      studentToken
    );
    const session2Id = session2Res.data.sessionId;

    // Request 3 hints on session 2
    await serverCtx.request(`/exercises/${hintTestEx.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId: session2Id }) }, studentToken);
    await serverCtx.request(`/exercises/${hintTestEx.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId: session2Id }) }, studentToken);
    await serverCtx.request(`/exercises/${hintTestEx.id}/hint`, { method: 'POST', body: JSON.stringify({ sessionId: session2Id }) }, studentToken);

    // Hostile attempt: claims hintsUsed: 0 in payload despite asking server for 3 hints!
    const spoofAttemptRes = await serverCtx.request(
      `/exercises/${hintTestEx.id}/attempt`,
      {
        method: 'POST',
        body: JSON.stringify({
          from: fromSq,
          to: toSq,
          sessionId: session2Id,
          hintsUsed: 0, // Spoofed value!
        }),
      },
      studentToken
    );

    // Expected penalty: 20 XP * max(0.4, 1 - 3*0.2) = 20 * 0.4 = 8 XP.
    // If spoofing succeeded it would be 20 XP.
    assert(spoofAttemptRes.data.gamification.xpAwarded <= 8, 'Server enforced authoritative hint penalty (awarded 8 XP instead of 20 XP)');
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('gamificationSecurity.test.ts')) {
  runGamificationSecurityTests()
    .then((res) => {
      console.log(`\nGAMIFICATION SECURITY RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
