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

export async function runMigrationSecurityTests() {
  console.log('\n--- SUITE 4: PROGRESS MIGRATION & BACKDOOR REMEDIATION TESTS ---');
  serverCtx = await startTestServer();

  try {
    // Create a fresh student for migration testing
    const migrationUserEmail = `mig.student.${Date.now()}@example.com`;
    const regRes = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: migrationUserEmail,
        password: 'Password123!',
        fullName: 'Migration Student',
      }),
    });
    const token = regRes.data.token;
    const userId = regRes.data.user.id;

    const initialProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const initialXp = initialProfile!.totalXp;
    const initialRating = initialProfile!.learningRating;

    // Get real lesson IDs from database to satisfy foreign keys
    const realLessons = await prisma.lesson.findMany({ take: 3 });
    const lessonIds = realLessons.map((l) => l.id);

    // TEST 1: Attempt to inject totalXp, learningRating, and currentStreakDays via /api/migrate
    // The updated MigrationPayloadSchema strictly strips or rejects competitive stats
    const hostileMigrationRes = await serverCtx.request(
      '/migrate',
      {
        method: 'POST',
        body: JSON.stringify({
          totalXp: 10000, // Hostile injection
          learningRating: 2500, // Hostile injection
          currentStreakDays: 365, // Hostile injection
          completedLessons: [lessonIds[0], lessonIds[1]],
        }),
      },
      token
    );

    assert(hostileMigrationRes.status === 200, 'Migration completed successfully for completed lessons');

    // TEST 2: Verify that totalXp, learningRating, and streak were NOT inflated
    const profileAfterMigration = await prisma.userProfile.findUnique({ where: { userId } });
    assert(
      profileAfterMigration!.totalXp === initialXp,
      `totalXp was NOT inflated (remains ${profileAfterMigration!.totalXp} instead of 10,000)`
    );
    assert(
      profileAfterMigration!.learningRating === initialRating,
      `learningRating was NOT inflated (remains ${profileAfterMigration!.learningRating} instead of 2,500)`
    );
    assert(
      profileAfterMigration!.isMigrated === true,
      'UserProfile.isMigrated is flagged as true'
    );

    // TEST 3: Imported lessons have 0 XP awarded (unverified historical record)
    const importedProgress = await prisma.lessonProgress.findMany({
      where: { userId },
    });
    assert(importedProgress.length === 2, 'Two lessons imported into LessonProgress');
    assert(
      importedProgress.every((lp) => lp.xpAwarded === 0),
      'All migrated lessons recorded with 0 XP to prevent retro-farming'
    );

    // TEST 4: Second migration attempt is REJECTED (Idempotent one-time policy)
    const secondMigrationRes = await serverCtx.request(
      '/migrate',
      {
        method: 'POST',
        body: JSON.stringify({
          completedLessons: [lessonIds[2] || lessonIds[0]],
        }),
      },
      token
    );

    assert(
      secondMigrationRes.status === 400,
      'Second migration call is rejected with 400 Bad Request (one-time policy enforced)'
    );
    assert(
      secondMigrationRes.data.error.includes('already been migrated'),
      'Error message clarifies account has already been migrated'
    );
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('migrationSecurity.test.ts')) {
  runMigrationSecurityTests()
    .then((res) => {
      console.log(`\nMIGRATION SECURITY RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
