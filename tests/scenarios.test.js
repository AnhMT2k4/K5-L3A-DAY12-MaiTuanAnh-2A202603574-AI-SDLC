import { execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';

console.log('--- Running Scenarios Tests (Phase 3 - Contract v1.2) ---');

// 1. Night 1 Scenario
{
  const outPath = 'tests/output/out-night1.jsonl';
  execSync(`node src/cli/headless.js --seed 42 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 250 --out ${outPath} --snapshot-every 50`, {
    stdio: 'pipe'
  });

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  assert(lines.length > 0);

  const snapshot0 = JSON.parse(lines[0]);
  assert.strictEqual(snapshot0.type, 'snapshot');
  assert.strictEqual(snapshot0.night, 1);
  assert(snapshot0.wind !== undefined);
  assert(snapshot0.player.vel !== undefined);
  assert(snapshot0.player.grounded !== undefined);
  assert(snapshot0.player.capacity !== undefined, 'player.capacity must exist in Contract v1.2 snapshot');
  assert(snapshot0.lanterns[0].fuel !== undefined, 'lantern.fuel must exist in Contract v1.2 snapshot');
  assert(snapshot0.lanterns[0].ever_lit !== undefined, 'lantern.ever_lit must exist in Contract v1.2 snapshot');
  assert(snapshot0.lanterns[0].relit_count !== undefined, 'lantern.relit_count must exist in Contract v1.2 snapshot');
  assert(Array.isArray(snapshot0.motes));
  assert(Array.isArray(snapshot0.drifters));
  assert(Array.isArray(snapshot0.charms));

  const lastLine = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(lastLine.type, 'end');
  assert.strictEqual(lastLine.ticks, 250);
  console.log('✓ Night 1 basic scenario test passed');
}

// 2. Night 2 Scenario
{
  const outPath = 'tests/output/out-night2.jsonl';
  execSync(`node src/cli/headless.js --seed 42 --night 2 --scenario tests/fixtures/scenario-night2.json --ticks 100 --out ${outPath}`, {
    stdio: 'pipe'
  });

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const snapshot0 = JSON.parse(lines[0]);
  assert.strictEqual(snapshot0.night, 2);
  assert.strictEqual(snapshot0.drifters.length, 1);
  assert.strictEqual(snapshot0.charms.length, 1);
  console.log('✓ Night 2 scenario with Drifters and Charms passed');
}

// 3. Night 3 Scenario with Wind
{
  const outPath = 'tests/output/out-night3.jsonl';
  execSync(`node src/cli/headless.js --seed 42 --night 3 --scenario tests/fixtures/scenario-night3.json --ticks 150 --out ${outPath}`, {
    stdio: 'pipe'
  });

  const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
  const snapshot0 = JSON.parse(lines[0]);
  assert.strictEqual(snapshot0.night, 3);
  console.log('✓ Night 3 scenario with Wind passed');
}

// 4. Format error (exit code 2)
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
