import { execSync } from 'child_process';

console.log('====================================');
console.log(' RUNNING ALL VERIFICATION TEST SUITES (PHASE 2 - CONTRACT v1.1)');
console.log('====================================\n');

try {
  execSync('node tests/unit.test.js', { stdio: 'inherit' });
  execSync('node tests/scenarios.test.js', { stdio: 'inherit' });
  execSync('node tests/determinism.test.js', { stdio: 'inherit' });
  execSync('node tests/perf.test.js', { stdio: 'inherit' });
  console.log('====================================');
  console.log(' ALL SUITES PASSED SUCCESSFULLY (100%)');
  console.log('====================================');
  process.exit(0);
} catch (err) {
  console.error('Test execution failed:', err.message);
  process.exit(1);
}
