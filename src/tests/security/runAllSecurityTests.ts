import { seedDatabase } from '../../server/db/seed';
import { runAuthSecurityTests } from './authSecurity.test';
import { runRbacSecurityTests } from './rbacSecurity.test';
import { runGamificationSecurityTests } from './gamificationSecurity.test';
import { runMigrationSecurityTests } from './migrationSecurity.test';
import { runConcurrencySecurityTests } from './concurrencySecurity.test';
import { runDataIsolationTests } from './dataIsolation.test';

async function main() {
  console.log('====================================================');
  console.log('  CHESSCADET HOSTILE SECURITY & ISOLATION TEST MATRIX');
  console.log('====================================================');

  await seedDatabase();

  let totalPassed = 0;
  let totalFailed = 0;

  const suites = [
    { name: 'Auth & Credential Security', fn: runAuthSecurityTests },
    { name: 'Role-Based Access Control (RBAC)', fn: runRbacSecurityTests },
    { name: 'Server-Authoritative Gamification', fn: runGamificationSecurityTests },
    { name: 'Migration & Backdoor Prevention', fn: runMigrationSecurityTests },
    { name: 'Concurrency & Race Conditions (100 Requests)', fn: runConcurrencySecurityTests },
    { name: 'Multi-Tenant Data Isolation', fn: runDataIsolationTests },
  ];

  for (const suite of suites) {
    try {
      const res = await suite.fn();
      totalPassed += res.passed;
      totalFailed += res.failed;
    } catch (err) {
      console.error(`Suite ${suite.name} crashed:`, err);
      totalFailed++;
    }
  }

  console.log('\n====================================================');
  console.log(`  FINAL VERIFICATION SCORECARD: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
