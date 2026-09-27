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

export async function runAuthSecurityTests() {
  console.log('\n--- SUITE 1: AUTHENTICATION & CREDENTIAL SECURITY TESTS ---');
  serverCtx = await startTestServer();

  try {
    // TEST 1: Cannot register as ADMIN via public API
    const adminAttemptEmail = `hacker.admin.${Date.now()}@example.com`;
    const res1 = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: adminAttemptEmail,
        password: 'SecurePassword123!',
        fullName: 'Wannabe Admin',
        role: 'ADMIN', // Hostile role injection attempt
      }),
    });

    assert(res1.status === 201, 'Registration HTTP status is 201 Created');
    assert(res1.data.user.role === 'STUDENT', 'Public registration forces role=STUDENT despite role=ADMIN in payload');

    const dbUser1 = await prisma.user.findUnique({ where: { email: adminAttemptEmail } });
    assert(dbUser1?.role === 'STUDENT', 'Database confirms user role is strictly STUDENT');

    // TEST 2: Cannot register as TEACHER via public API
    const teacherAttemptEmail = `hacker.teacher.${Date.now()}@example.com`;
    const res2 = await serverCtx.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: teacherAttemptEmail,
        password: 'SecurePassword123!',
        fullName: 'Wannabe Coach',
        role: 'TEACHER', // Hostile role injection attempt
      }),
    });

    assert(res2.status === 201, 'Registration HTTP status is 201 Created');
    assert(res2.data.user.role === 'STUDENT', 'Public registration forces role=STUDENT despite role=TEACHER in payload');

    // TEST 3: Password hash NEVER appears in API response
    assert(res1.data.user.passwordHash === undefined, 'passwordHash is not present in registration response');

    const loginRes = await serverCtx.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: adminAttemptEmail,
        password: 'SecurePassword123!',
      }),
    });
    assert(loginRes.status === 200, 'Login HTTP status is 200 OK');
    assert(loginRes.data.user.passwordHash === undefined, 'passwordHash is not present in login response');

    const meRes = await serverCtx.request('/me', {}, loginRes.data.token);
    assert(meRes.status === 200, '/me HTTP status is 200 OK');
    assert(meRes.data.user.passwordHash === undefined, 'passwordHash is not present in /me response');

    // TEST 4: Fake Google identity rejected
    const fakeGoogleRes = await serverCtx.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        email: 'victim@google.com',
        fullName: 'Victim User',
        googleId: 'fake-google-id-12345',
      }),
    });
    assert(fakeGoogleRes.status === 501, 'Unconfigured/Fake Google OAuth identity rejected with 501 Not Implemented');

    // TEST 5: Magic-link without token rejected
    const emptyTokenRes = await serverCtx.request('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token: '' }),
    });
    assert(emptyTokenRes.status === 400 || emptyTokenRes.status === 401, 'Magic link verification without valid token is rejected');

    // TEST 6: Expired magic link rejected
    process.env.ENABLE_TEST_MAGIC_LINK = 'true';
    process.env.NODE_ENV = 'test';
    const testUser = await prisma.user.findFirst();
    const expiredToken = `expired_token_${Date.now()}_${Math.random()}`;
    const crypto = await import('crypto');
    const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');

    await prisma.magicLinkToken.create({
      data: {
        userId: testUser!.id,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
      },
    });

    const expiredRes = await serverCtx.request('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token: expiredToken }),
    });
    assert(expiredRes.status === 401, 'Expired magic link token is rejected with 401 Unauthorized');

    // TEST 7: Used magic link rejected (Replay Prevention)
    const validRawToken = await AuthService.createMagicLinkToken(testUser!.id);
    const firstUseRes = await serverCtx.request('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token: validRawToken }),
    });
    assert(firstUseRes.status === 200, 'First use of magic link succeeds with 200 OK');

    const secondUseRes = await serverCtx.request('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token: validRawToken }),
    });
    assert(secondUseRes.status === 401, 'Replay of consumed magic link token is rejected with 401 Unauthorized');

    // TEST 8: Demo switch disabled when ALLOW_DEV_DEMO is not true
    process.env.ALLOW_DEV_DEMO = 'false';
    const demoRes = await serverCtx.request('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    assert(demoRes.status === 403, 'Demo role switch is rejected with 403 Forbidden when disabled');
    process.env.ALLOW_DEV_DEMO = 'true'; // restore for dev/test
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('authSecurity.test.ts')) {
  runAuthSecurityTests()
    .then((res) => {
      console.log(`\nAUTH SECURITY RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
