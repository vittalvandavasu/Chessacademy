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

export async function runConcurrencySecurityTests() {
  console.log('\n--- SUITE 5: CONCURRENCY & RACE CONDITION STRESS TESTS ---');
  serverCtx = await startTestServer();

  try {
    // Register a fresh test student for the concurrency test
    const concStudentEmail = `conc.student.${Date.now()}@example.com`;
    const regRes = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: concStudentEmail,
        password: 'Password123!',
        fullName: 'Concurrency Test Student',
      }),
    });
    const token = regRes.data.token;
    const userId = regRes.data.user.id;

    // Create a unique test exercise
    const exercise = await prisma.exercise.create({
      data: {
        id: `conc-exercise-${Date.now()}`,
        conceptKey: 'BACK_RANK_MATE',
        exerciseType: 'FIND_THE_CHECKMATE',
        difficulty: 1,
        fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
        targetMoves: JSON.stringify(['Rd8#', 'd1d8']),
        conceptHint: 'Back rank weakness',
        areaHint: '8th rank',
        pieceHint: 'Rook',
        moveHint: 'Rd8#',
        explanation: 'Back rank mate',
        xp: 25,
        status: 'VERIFIED',
      },
    });

    const initialProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const initialXp = initialProfile!.totalXp;

    console.log(`  Dispatching 100 simultaneous concurrent solve attempts for exercise ${exercise.id}...`);

    // Dispatch 100 concurrent requests in parallel bursts
    const TOTAL_REQUESTS = 100;
    const BURST_SIZE = 10;
    const responses: any[] = [];

    for (let i = 0; i < TOTAL_REQUESTS; i += BURST_SIZE) {
      const burst = Array.from({ length: BURST_SIZE }).map(() =>
        serverCtx.request(
          `/exercises/${exercise.id}/attempt`,
          {
            method: 'POST',
            body: JSON.stringify({
              from: 'd1',
              to: 'd8',
              promotion: 'q',
              hintsUsed: 0,
              timeTakenMs: 1500,
            }),
          },
          token
        )
      );
      const burstResults = await Promise.all(burst);
      responses.push(...burstResults);
      console.log(`    Batch ${i / BURST_SIZE + 1}/${TOTAL_REQUESTS / BURST_SIZE} completed (${responses.length}/100)...`);
    }

    // Analyze results
    assert(responses.length === TOTAL_REQUESTS, 'All 100 concurrent requests received responses');

    // Count how many responses received reward XP > 0 and isRewardEligible = true
    const eligibleCount = responses.filter(
      (r) => r.status === 200 && r.data.gamification?.isRewardEligible === true && r.data.gamification?.xpAwarded > 0
    ).length;

    const zeroRewardCount = responses.filter(
      (r) => r.status === 200 && r.data.gamification?.isRewardEligible === false && r.data.gamification?.xpAwarded === 0
    ).length;

    console.log(`    Eligible reward responses: ${eligibleCount}`);
    console.log(`    Zero-reward anti-farming responses: ${zeroRewardCount}`);

    // VERIFICATION: Exactly ONE request must receive the eligible XP reward!
    assert(eligibleCount === 1, `Exactly ONE first-completion reward awarded (expected: 1, actual: ${eligibleCount})`);
    assert(
      zeroRewardCount === TOTAL_REQUESTS - 1,
      `All other ${TOTAL_REQUESTS - 1} concurrent requests received 0 XP and were marked NOT reward eligible`
    );

    // Verify RewardRecord in database has exactly 1 record
    const rewardRecords = await prisma.rewardRecord.findMany({
      where: { userId, exerciseId: exercise.id },
    });
    assert(rewardRecords.length === 1, 'Database contains exactly 1 unique RewardRecord');

    // Verify UserProfile totalXp was incremented by exactly the exercise XP (25 XP)
    const finalProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const xpDifference = finalProfile!.totalXp - initialXp;
    assert(
      xpDifference === 25,
      `UserProfile totalXp incremented by exactly 25 XP (expected: 25, actual: ${xpDifference})`
    );

    // Verify all attempts were recorded for pedagogical practice
    const attempts = await prisma.exerciseAttempt.findMany({
      where: { userId, exerciseId: exercise.id },
    });
    assert(
      attempts.length === TOTAL_REQUESTS,
      `All ${TOTAL_REQUESTS} legitimate practice attempts were recorded in ExerciseAttempt table`
    );
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('concurrencySecurity.test.ts')) {
  runConcurrencySecurityTests()
    .then((res) => {
      console.log(`\nCONCURRENCY SECURITY RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
