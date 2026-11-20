import { GameSimulation } from '../src/core/simulation.js';
import assert from 'assert';

console.log('--- Running Performance Test (21,600 ticks) ---');

const start = performance.now();
const sim = new GameSimulation({
  seed: 99999,
  night: 1
});

// Run up to 21,600 ticks or game end
const TARGET_TICKS = 21600;
let ticksRun = 0;
while (ticksRun < TARGET_TICKS && sim.state === 'playing') {
  sim.step();
  ticksRun++;
}

const elapsedSec = (performance.now() - start) / 1000.0;
console.log(`✓ Completed ${ticksRun} ticks in ${elapsedSec.toFixed(2)}s`);
assert(elapsedSec <= 30.0, `Must finish in <= 30 seconds (took ${elapsedSec.toFixed(2)}s)`);

console.log('PERFORMANCE TEST PASSED!\n');
