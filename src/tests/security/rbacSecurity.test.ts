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

export async function runRbacSecurityTests() {
  console.log('\n--- SUITE 2: ROLE-BASED ACCESS CONTROL (RBAC) HTTP TESTS ---');
  serverCtx = await startTestServer();

  try {
    // 1. Create Student, Teacher A, Teacher B, and Admin
    const studentUser = await AuthService.getOrCreateDemoUser('STUDENT');
    const teacherAUser = await AuthService.getOrCreateDemoUser('TEACHER');

    // Create Teacher B
    const teacherB = await prisma.user.upsert({
      where: { email: 'teacher.b@chesscadet.com' },
      create: {
        email: 'teacher.b@chesscadet.com',
        fullName: 'Coach Benjamin (Teacher B)',
        role: 'TEACHER',
        profile: { create: { learningRating: 1800, totalXp: 10000, lastActiveDate: '2026-09-26' } },
      },
      update: {},
    });

    const adminUser = await AuthService.getOrCreateDemoUser('ADMIN');

    // Sign tokens
    const studentToken = AuthService.signToken({ userId: studentUser.id, email: studentUser.email, role: 'STUDENT' });
    const teacherAToken = AuthService.signToken({ userId: teacherAUser.id, email: teacherAUser.email, role: 'TEACHER' });
    const teacherBToken = AuthService.signToken({ userId: teacherB.id, email: teacherB.email, role: 'TEACHER' });
    const adminToken = AuthService.signToken({ userId: adminUser.id, email: adminUser.email, role: 'ADMIN' });

    // Create Classroom owned by Teacher A
    const classroomA = await prisma.classroom.upsert({
      where: { joinCode: 'CLASS-A-TEST' },
      create: {
        id: 'class-a-id',
        teacherId: teacherAUser.id,
        name: 'Teacher A Classroom',
        joinCode: 'CLASS-A-TEST',
      },
      update: {},
    });

    // TEST 1: Unauthenticated request to protected route is rejected with 401
    const unauthRes = await serverCtx.request('/me');
    assert(unauthRes.status === 401, 'Unauthenticated request to /me is rejected with 401 Unauthorized');

    // TEST 2: Student cannot access Admin CMS exercises
    const studentAdminRes = await serverCtx.request('/admin/exercises', {}, studentToken);
    assert(studentAdminRes.status === 403, 'Student accessing /admin/exercises receives 403 Forbidden');

    // TEST 3: Student cannot promote user roles
    const studentPromoteRes = await serverCtx.request(
      `/admin/users/${studentUser.id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'ADMIN' }),
      },
      studentToken
    );
    assert(studentPromoteRes.status === 403, 'Student attempting to promote user role receives 403 Forbidden');

    // TEST 4: Student cannot create classroom
    const studentCreateClassRes = await serverCtx.request(
      '/classrooms',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Hacked Club' }),
      },
      studentToken
    );
    assert(studentCreateClassRes.status === 403, 'Student attempting to create classroom receives 403 Forbidden');

    // TEST 5: Student cannot access Teacher Classroom Analytics
    const studentAnalyticsRes = await serverCtx.request(
      `/teacher/classrooms/${classroomA.id}/analytics`,
      {},
      studentToken
    );
    assert(studentAnalyticsRes.status === 403, 'Student accessing /teacher/classrooms/:id/analytics receives 403 Forbidden');

    // TEST 6: Teacher A CAN access their own classroom analytics
    const teacherAAnalyticsRes = await serverCtx.request(
      `/teacher/classrooms/${classroomA.id}/analytics`,
      {},
      teacherAToken
    );
    assert(teacherAAnalyticsRes.status === 200, 'Teacher A accessing their own classroom analytics receives 200 OK');

    // TEST 7: Teacher B CANNOT access Teacher A's classroom analytics (IDOR Protection)
    const teacherBAnalyticsRes = await serverCtx.request(
      `/teacher/classrooms/${classroomA.id}/analytics`,
      {},
      teacherBToken
    );
    assert(teacherBAnalyticsRes.status === 403, 'Teacher B accessing Teacher A classroom receives 403 Forbidden (IDOR mitigated)');

    // TEST 8: Admin CAN access any classroom analytics
    const adminAnalyticsRes = await serverCtx.request(
      `/teacher/classrooms/${classroomA.id}/analytics`,
      {},
      adminToken
    );
    assert(adminAnalyticsRes.status === 200, 'Admin accessing any classroom analytics receives 200 OK');

    // TEST 9: Admin CAN promote user role
    const adminPromoteRes = await serverCtx.request(
      `/admin/users/${studentUser.id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role: 'TEACHER' }),
      },
      adminToken
    );
    assert(adminPromoteRes.status === 200, 'Admin promoting user role succeeds with 200 OK');
    assert(adminPromoteRes.data.user.role === 'TEACHER', 'Promoted user has role TEACHER');

    // Revert role back to STUDENT
    await prisma.user.update({ where: { id: studentUser.id }, data: { role: 'STUDENT' } });
  } finally {
    await serverCtx.close();
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('rbacSecurity.test.ts')) {
  runRbacSecurityTests()
    .then((res) => {
      console.log(`\nRBAC SECURITY RESULT: ${res.passed} passed, ${res.failed} failed`);
      if (res.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
