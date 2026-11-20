import assert from 'assert';
import { GameSimulation } from '../src/core/simulation.js';
import { PRNG } from '../src/core/prng.js';
import { DEFAULT_TUNING } from '../src/core/constants.js';

console.log('--- Running Unit Tests ---');

// 1. PRNG determinism
{
  const p1 = new PRNG(999);
  const p2 = new PRNG(999);
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(p1.next(), p2.next(), `PRNG next() must match at iteration ${i}`);
  }
  console.log('✓ PRNG determinism passed');
}

// 2. Player movement with cam_yaw_deg
{
  // Test forward move [0, 1] with yaw 0 (moves +Z)
  const sim = new GameSimulation({
    seed: 1,
    scenario: { player: { pos: [0, 0, 0] }, random_motes: false, random_shades: false },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1], cam_yaw_deg: 0 }
      ]
    }
  });

  sim.step();
  assert.strictEqual(sim.player.pos[0], 0);
  assert(Math.abs(sim.player.pos[2] - (DEFAULT_TUNING.player_speed / 60)) < 1e-5);
  console.log('✓ Player movement (yaw 0) passed');

  // Test forward move [0, 1] with yaw 90 (moves +X)
  const sim2 = new GameSimulation({
    seed: 1,
    scenario: { player: { pos: [0, 0, 0] }, random_motes: false, random_shades: false },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1], cam_yaw_deg: 90 }
      ]
    }
  });

  sim2.step();
  assert(Math.abs(sim2.player.pos[0] - (DEFAULT_TUNING.player_speed / 60)) < 1e-5);
  assert(Math.abs(sim2.player.pos[2]) < 1e-5);
  console.log('✓ Player movement (yaw 90) passed');
}

// 3. Mote pickup and carry capacity
{
  const sim = new GameSimulation({
    seed: 1,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0 },
      random_motes: false,
      random_shades: false,
      motes: [
        [0, 0, 1.0], // within pickup_radius 1.5
        [0, 0, 1.2],
        [0, 0, 1.3],
        [0, 0, 1.4],
        [0, 0, 1.45],
        [0, 0, 1.48] // 6th mote, should exceed capacity 5
      ]
    }
  });

  const events = sim.step();
  assert.strictEqual(sim.player.carried, 5, 'Should carry at most capacity (5)');
  assert.strictEqual(sim.score, 5 * DEFAULT_TUNING.score.per_mote);
  const motePickedEvents = events.filter(e => e.name === 'mote_picked');
  assert.strictEqual(motePickedEvents.length, 5);
  console.log('✓ Mote pickup and carry capacity passed');
}

// 4. Deposit into lantern and lantern_lit
{
  const sim = new GameSimulation({
    seed: 1,
    scenario: {
      player: { pos: [0, 0, 0], carried: 5 },
      random_motes: false,
      random_shades: false,
      lanterns: [
        { id: 'L1', pos: [0, 0, 2.0], deposited: 0, lit: false }
      ]
    },
    inputs: {
      frames: [
        { tick: 0, interact: true }
      ]
    }
  });

  const events = sim.step();
  const depEvent = events.find(e => e.name === 'deposit');
  const litEvent = events.find(e => e.name === 'lantern_lit');
  assert(depEvent, 'Should emit deposit event');
  assert.strictEqual(depEvent.data.amount, 5);
  assert(litEvent, 'Should emit lantern_lit event');
  assert.strictEqual(sim.lanterns.find(l => l.id === 'L1').lit, true);
  assert.strictEqual(sim.player.carried, 0);
  console.log('✓ Deposit and lantern_lit passed');
}

// 5. Pulse action (stuns and pushes shades)
{
  const sim = new GameSimulation({
    seed: 1,
    scenario: {
      player: { pos: [0, 0, 0], carried: 2 },
      random_motes: false,
      random_shades: false,
      shades: [
        { id: 'S1', pos: [0, 0, 3.0] } // within pulse_radius 5.0
      ]
    },
    inputs: {
      frames: [
        { tick: 0, pulse: true }
      ]
    }
  });

  const events = sim.step();
  const pulseEvent = events.find(e => e.name === 'pulse');
  assert(pulseEvent, 'Should emit pulse event');
  assert.deepStrictEqual(pulseEvent.data.stunned_ids, ['S1']);
  assert.strictEqual(sim.shades[0].state, 'stunned');
  assert.strictEqual(sim.player.carried, 2 - DEFAULT_TUNING.pulse_cost);
  assert(sim.shades[0].pos[2] > 3.0, 'Shade should be pushed outward');
  console.log('✓ Pulse action passed');
}

// 6. Shade damage to player
{
  const sim = new GameSimulation({
    seed: 1,
    scenario: {
      player: { pos: [0, 0, 0], flames: 3, carried: 4 },
      random_motes: false,
      random_shades: false,
      shades: [
        { id: 'S1', pos: [0, 0, 0.5] } // within shade_hit_radius 1.0
      ]
    }
  });

  const events = sim.step();
  const hitEvent = events.find(e => e.name === 'player_hit');
  assert(hitEvent, 'Should emit player_hit event');
  assert.strictEqual(sim.player.flames, 2);
  assert.strictEqual(hitEvent.data.dropped, 2); // 4 * 0.5 = 2
  assert.strictEqual(sim.player.carried, 2);
  console.log('✓ Shade damage and hit_drop_ratio passed');
}

// 7. Win condition (all lanterns lit)
{
  const sim = new GameSimulation({
    seed: 1,
    scenario: {
      player: { pos: [0, 0, 0], carried: 5 },
      random_motes: false,
      random_shades: false,
      lanterns: [
        { id: 'L1', pos: [0, 0, 2.0], deposited: 0, lit: false },
        { id: 'L2', pos: [50, 0, 0], deposited: 5, lit: true },
        { id: 'L3', pos: [50, 0, 50], deposited: 5, lit: true },
        { id: 'L4', pos: [-50, 0, 0], deposited: 5, lit: true },
        { id: 'L5', pos: [0, 0, -50], deposited: 5, lit: true }
      ]
    },
    inputs: {
      frames: [
        { tick: 0, interact: true }
      ]
    }
  });

  const events = sim.step();
  const winEvent = events.find(e => e.name === 'game_over' && e.data.result === 'won');
  assert(winEvent, 'Should emit game_over won event');
  assert.strictEqual(sim.state, 'won');
  console.log('✓ Win condition passed');
}

console.log('ALL UNIT TESTS PASSED!\n');
