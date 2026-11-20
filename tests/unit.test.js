import assert from 'assert';
import { GameSimulation } from '../src/core/simulation.js';
import { PRNG } from '../src/core/prng.js';
import { DEFAULT_TUNING } from '../src/core/constants.js';

console.log('--- Running Unit Tests (Phase 2 - Contract v1.1) ---');

// 1. PRNG determinism
{
  const p1 = new PRNG(999);
  const p2 = new PRNG(999);
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(p1.next(), p2.next(), `PRNG next() must match at iteration ${i}`);
  }
  console.log('✓ PRNG determinism passed');
}

// 2. Dash mechanics
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: { player: { pos: [0, 0, 0] }, random_motes: false, random_shades: false },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1], dash: true },
        { tick: 1, dash: false }
      ]
    }
  });

  const events = sim.step();
  const dashEv = events.find(e => e.name === 'dash');
  assert(dashEv, 'Should emit dash event');
  assert.strictEqual(sim.player.dash_timer, 12); // set to 12 this tick, decrement happens next tick
  // Dash velocity should be in movement direction (cam_yaw=0, move=[0,1] → +Z)
  // But dash vel is applied in Step 3.3 as dash_speed × dash_dir
  assert(Math.abs(sim.player.vel[2]) > 13.0, `Dash vel Z should be ~14 m/s but got ${sim.player.vel[2]}`);
  // dash_cd set to 1.5 in Step 3, decremented by dt in Step 2 of same tick (before assignment)
  // So after step: dash_cd = 1.5
  assert(Math.abs(sim.player.dash_cd - 1.5) < 1e-6, `dash_cd should be 1.5 but got ${sim.player.dash_cd}`);
  console.log('✓ Dash mechanics passed');
}

// 3. Wind Charm (Bùa Gió)
{
  const sim = new GameSimulation({
    seed: 1,
    night: 2,
    scenario: {
      player: { pos: [35, 0, 0] }, // at charm C1 location
      charms: [{ id: 'C1', pos: [35, 0, 0], available: true }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  const charmEv = events.find(e => e.name === 'charm_picked');
  assert(charmEv, 'Should emit charm_picked event');
  assert.strictEqual(charmEv.data.charm_id, 'C1');
  assert.strictEqual(charmEv.data.charm_ticks, 600);
  assert(Math.abs(sim.player.charm_timer - 10.0) < 1e-4, `charm_timer should be 10.0 but got ${sim.player.charm_timer}`);
  console.log('✓ Wind Charm pickup and activation passed');
}

// 4. Jump pad launch
{
  const sim = new GameSimulation({
    seed: 1,
    night: 2,
    scenario: {
      player: { pos: [20, 0, 18] }, // on Jump Pad 1
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.strictEqual(sim.player.jump_pad_launched, true);
  assert.strictEqual(sim.player.grounded, false);
  assert(sim.player.vel[1] > 13.0, 'Should launch upwards with vel_y ~14 m/s');
  assert(sim.player.vel[0] > 20.0, 'Should launch horizontally towards Island B');
  console.log('✓ Jump pad launch passed');
}

// 5. Fall off island (Y < -10)
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [50, -11, 0], flames: 3, carried: 5 },
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  const fallHit = events.find(e => e.name === 'player_hit' && e.data.by === 'fall');
  assert(fallHit, 'Should emit player_hit by fall');
  assert.strictEqual(fallHit.data.lost, 5, 'Should lose all 5 carried motes');
  assert.strictEqual(fallHit.data.flames, 2, 'Should decrease flame by 1');
  assert.strictEqual(sim.player.fall_cooldown_ticks, 60);
  console.log('✓ Fall off island (Y < -10) passed');
}

// 6. Gió Lạc (Drifter) steal and drop
{
  const sim = new GameSimulation({
    seed: 1,
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 7 },
      drifters: [{ id: 'D1', pos: [0, 0, 0.5], state: 'chase', stolen: 0 }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  const stealEv = events.find(e => e.name === 'drifter_steal');
  assert(stealEv, 'Drifter should steal motes');
  assert.strictEqual(stealEv.data.amount, 3);
  assert.strictEqual(stealEv.data.carried, 4);
  assert.strictEqual(sim.drifters[0].state, 'flee');
  assert.strictEqual(sim.drifters[0].stolen, 3);
  console.log('✓ Drifter steal passed');
}

// 7. Pause and Resume
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    inputs: {
      frames: [
        { tick: 0, pause: true },
        { tick: 10, pause: true }
      ]
    }
  });

  const ev1 = sim.step();
  assert(ev1.some(e => e.name === 'paused'));
  assert.strictEqual(sim.state, 'paused');
  assert.strictEqual(sim.sim_tick, 0, 'sim_tick should not increment while paused');

  // Step while paused
  while (sim.tick < 10) {
    sim.step();
  }
  assert.strictEqual(sim.sim_tick, 0, 'sim_tick still 0');

  // Resume at tick 10
  const evResume = sim.step();
  assert(evResume.some(e => e.name === 'resumed'));
  assert.strictEqual(sim.state, 'playing');
  console.log('✓ Pause and Resume passed');
}

// 8. Win Condition and Scoring
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 24.0], carried: 10, flames: 3 },
      time_left_s: 200,
      lanterns: [
        { id: 'L1', pos: [0, 0, 25.0], lit: false, deposited: 0 },
        { id: 'L2', pos: [50, 0, 0], lit: true, deposited: 10 },
        { id: 'L3', pos: [50, 0, 50], lit: true, deposited: 10 },
        { id: 'L4', pos: [-50, 0, 0], lit: true, deposited: 10 },
        { id: 'L5', pos: [0, 0, -50], lit: true, deposited: 10 }
      ],
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  const events = sim.step();
  assert.strictEqual(sim.state, 'won');
  const winEv = events.find(e => e.name === 'game_over' && e.data.result === 'won');
  assert(winEv);
  // Score: deposit 10 motes (+100) + lit lantern (+100) + time bonus floor(199.98s)*2 (+398) + flames 3*50 (+150) = 748
  assert.strictEqual(sim.score, 748);
  console.log('✓ Win condition and scoring passed');
}

console.log('ALL PHASE 2 UNIT TESTS PASSED!\n');
