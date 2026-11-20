import { execSync } from 'child_process';
import assert from 'assert';
import fs from 'fs';

console.log('--- Running Determinism Tests ---');

const out1 = 'tests/output/determinism-run1.jsonl';
const out2 = 'tests/output/determinism-run2.jsonl';

// Run 1
execSync(`node src/cli/headless.js --seed 12345 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 300 --out ${out1}`, {
  stdio: 'pipe'
});

// Run 2 (same seed, same scenario, same inputs)
execSync(`node src/cli/headless.js --seed 12345 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 300 --out ${out2}`, {
  stdio: 'pipe'
});

const content1 = fs.readFileSync(out1, 'utf-8');
const content2 = fs.readFileSync(out2, 'utf-8');

assert.strictEqual(content1, content2, 'Output must be 100% byte-for-byte identical between runs!');

console.log('✓ Determinism verified: 100% identical outputs for same seed and inputs');
console.log('ALL DETERMINISM TESTS PASSED!\n');
