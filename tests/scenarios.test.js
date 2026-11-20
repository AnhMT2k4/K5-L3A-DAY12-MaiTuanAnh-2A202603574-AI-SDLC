import { execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';

console.log('--- Running Scenarios Tests ---');

// 1. Run with scenario-basic and inputs-basic
{
  const outPath = 'tests/output/out-scenario-basic.jsonl';
  execSync(`node src/cli/headless.js --seed 42 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 250 --out ${outPath} --snapshot-every 50`, {
    stdio: 'pipe'
  });

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  assert(lines.length > 0, 'Output must not be empty');

  const snapshot0 = JSON.parse(lines[0]);
  assert.strictEqual(snapshot0.type, 'snapshot');
  assert.strictEqual(snapshot0.tick, 0);
  assert.strictEqual(snapshot0.motes_active, 1);
  assert.strictEqual(snapshot0.lanterns[0].id, 'L1');
  assert.strictEqual(snapshot0.shades[0].id, 'S1');

  const lastLine = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(lastLine.type, 'end');
  assert.strictEqual(lastLine.ticks, 250);
  console.log('✓ Scenario basic test passed');
}

// 2. Format Error test: invalid inputs must exit with code 2
{
  let exitedCode = null;
  try {
    execSync('node src/cli/headless.js --seed 42 --night 1 --inputs tests/fixtures/inputs-invalid.json --ticks 100 --out tests/output/out-invalid.jsonl', {
      stdio: 'pipe'
    });
  } catch (err) {
    exitedCode = err.status;
  }
  assert.strictEqual(exitedCode, 2, 'Invalid inputs format must exit with code 2');
  console.log('✓ Inputs format error validation (exit code 2) passed');
}

console.log('ALL SCENARIOS TESTS PASSED!\n');
