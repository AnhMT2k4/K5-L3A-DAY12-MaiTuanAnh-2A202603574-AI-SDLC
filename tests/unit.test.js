import assert from 'assert';
import { GameSimulation } from '../src/core/simulation.js';
import { PRNG } from '../src/core/prng.js';
import { DEFAULT_TUNING } from '../src/core/constants.js';

console.log('--- Running Unit Tests (Phase 3 - Contract v1.2: Đèn cạn dầu) ---');

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
  assert.strictEqual(sim.player.dash_timer, 12);
  assert(Math.abs(sim.player.vel[2]) > 13.0, `Dash vel Z should be ~14 m/s but got ${sim.player.vel[2]}`);
  assert(Math.abs(sim.player.dash_cd - 1.5) < 1e-6, `dash_cd should be 1.5 but got ${sim.player.dash_cd}`);
  console.log('✓ Dash mechanics passed');
}

// 3. Wind Charm (Bùa Gió)
{
  const sim = new GameSimulation({
    seed: 1,
    night: 2,
    scenario: {
      player: { pos: [35, 0, 0] },
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
      player: { pos: [20, 0, 18] },
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

  while (sim.tick < 10) {
    sim.step();
  }
  assert.strictEqual(sim.sim_tick, 0, 'sim_tick still 0');

  const evResume = sim.step();
  assert(evResume.some(e => e.name === 'resumed'));
  assert.strictEqual(sim.state, 'playing');
  console.log('✓ Pause and Resume passed');
}

// 8. Phase 3: No early win when all lanterns lit & Capacity growth
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 24.0], carried: 10, flames: 3 },
      time_left_s: 200,
      lanterns: [
        { id: 'L1', pos: [0, 0, 25.0], lit: false, deposited: 0 },
        { id: 'L2', pos: [50, 0, 0], lit: true, fuel: 100 },
        { id: 'L3', pos: [50, 0, 50], lit: true, fuel: 100 },
        { id: 'L4', pos: [-50, 0, 0], lit: true, fuel: 100 },
        { id: 'L5', pos: [0, 0, -50], lit: true, fuel: 100 }
      ],
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  const events = sim.step();
  // Phase 3: Lighting all lanterns does NOT end the game early
  assert.strictEqual(sim.state, 'playing', 'Game must keep playing until dawn even if all lanterns are lit');
  const litEv = events.find(e => e.name === 'lantern_lit');
  assert(litEv, 'Should emit lantern_lit');
  assert.strictEqual(litEv.data.relight, false, 'First time lighting should have relight=false');
  // Score: 10 motes * 5 (+50) + first light (+100) = 150
  assert.strictEqual(sim.score, 150);
  // Capacity: 10 + 2 * 1 = 12
  assert.strictEqual(sim.player.capacity, 12, 'Capacity should increase to 12 after successful light');
  console.log('✓ No early win & Capacity growth passed');
}

// 9. Phase 3: Fuel decay & lantern_out event
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      lanterns: [
        { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 0.05 } // 0.05 fuel = 3 units, decays in 3 ticks
      ],
      random_motes: false,
      random_shades: false
    }
  });

  // Tick 0: fuel reduces by 1 unit (from 3 to 2)
  sim.step();
  assert.strictEqual(sim.lanterns[0].lit, true);

  // Tick 1: fuel reduces to 1 unit
  sim.step();
  assert.strictEqual(sim.lanterns[0].lit, true);

  // Tick 2: fuel reduces to 0 -> lantern_out
  const events = sim.step();
  const outEv = events.find(e => e.name === 'lantern_out');
  assert(outEv, 'Should emit lantern_out when fuel reaches 0');
  assert.strictEqual(sim.lanterns[0].lit, false);
  assert.strictEqual(sim.lanterns[0].ever_lit, true);
  console.log('✓ Fuel decay & lantern_out passed');
}

// 10. Phase 3: Refuel (châm dầu)
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 24.0], carried: 3 },
      lanterns: [
        { id: 'L1', pos: [0, 0, 25.0], lit: true, fuel: 82.0 } // needs 2 motes to reach 100
      ],
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  const events = sim.step();
  const refuelEv = events.find(e => e.name === 'refuel');
  assert(refuelEv, 'Should emit refuel event');
  assert.strictEqual(refuelEv.data.amount, 2, 'Should use min(carried=3, ceil((100-82)/10)=2) = 2 motes');
  assert.strictEqual(refuelEv.data.fuel, 100.0, 'Fuel should reach 100.0');
  assert.strictEqual(sim.player.carried, 1, 'Player carried should be 3 - 2 = 1');
  assert.strictEqual(sim.score, 10, 'Score should be +5 * 2 = 10');
  console.log('✓ Refuel (châm dầu) passed');
}

// 11. Phase 3: Relight with 5 motes & relight: true
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 24.0], carried: 5 },
      lanterns: [
        { id: 'L1', pos: [0, 0, 25.0], lit: false, ever_lit: true, deposited: 0 }
      ],
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  const events = sim.step();
  const litEv = events.find(e => e.name === 'lantern_lit');
  assert(litEv, 'Should emit lantern_lit on relight');
  assert.strictEqual(litEv.data.relight, true, 'relight must be true');
  assert.strictEqual(sim.lanterns[0].lit, true);
  assert.strictEqual(sim.lanterns[0].relit_count, 1);
  // Score: 5 motes * 5 (+25) + relight (+40) = 65
  assert.strictEqual(sim.score, 65);
  console.log('✓ Relight with 5 motes passed');
}

// 12. Phase 3: Shade drain state & Pulse +15
{
  const sim = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 10.0], carried: 3 }, // player outside 6m from shade at L1
      lanterns: [
        { id: 'L1', pos: [0, 0, 0], lit: true, fuel: 25.0 } // low fuel < 30
      ],
      shades: [
        { id: 'S1', pos: [0, 0, 1.0], state: 'drain', target_lantern_id: 'L1' }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  // Step 60 ticks to verify fuel_drain event
  let drained = false;
  for (let i = 0; i < 60; i++) {
    const evs = sim.step();
    if (evs.some(e => e.name === 'fuel_drain')) {
      drained = true;
    }
  }
  assert(drained, 'Should emit fuel_drain event within 60 ticks of continuous draining');

  // Pulse shade while in drain: player moves into pulse range and pulses
  sim.player.pos = [0, 0, 3.0]; // 3D dist <= 5m
  sim.player.carried = 3;
  sim.player.pulse_cd = 0;
  const oldScore = sim.score;
  const pulseEvs = sim.step({ pulse: true });
  assert(pulseEvs.some(e => e.name === 'pulse'));
  assert.strictEqual(sim.shades[0].state, 'stunned');
  assert.strictEqual(sim.score - oldScore, 15, 'Pulse on draining shade must award +15 points');
  console.log('✓ Shade drain & Pulse +15 passed');
}

// 13. Phase 3: Dawn win (dawn_survived) & Dawn lose (dawn)
{
  // 13a. Win at dawn: 3/5 lanterns lit on Night 1
  const simWin = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { flames: 3 },
      time_left_s: 0.016, // will hit 0 next tick
      lanterns: [
        { id: 'L1', pos: [0, 0, 25], lit: true, fuel: 100 },
        { id: 'L2', pos: [23.8, 0, 7.7], lit: true, fuel: 50 },
        { id: 'L3', pos: [14.7, 0, -20.2], lit: true, fuel: 80 },
        { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, fuel: 0 },
        { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, fuel: 0 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  const evWin = simWin.step();
  assert.strictEqual(simWin.state, 'won');
  const winEv = evWin.find(e => e.name === 'game_over');
  assert(winEv);
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'dawn_survived');
  // Dawn bonus:
  // L1: 50 + floor(100 - 1/60) = 50 + 99 = 149
  // L2: 50 + floor(50 - 1/60) = 50 + 49 = 99
  // L3: 50 + floor(80 - 1/60) = 50 + 79 = 129
  // Flames: 3 * 50 = 150
  // Total = 149 + 99 + 129 + 150 = 527
  assert.strictEqual(simWin.score, 527);

  // 13b. Lose at dawn: only 2/5 lanterns lit on Night 1 (< ceil(0.6 * 5) = 3)
  const simLose = new GameSimulation({
    seed: 1,
    night: 1,
    scenario: {
      player: { flames: 3 },
      time_left_s: 0.016,
      lanterns: [
        { id: 'L1', pos: [0, 0, 25], lit: true, fuel: 100 },
        { id: 'L2', pos: [23.8, 0, 7.7], lit: true, fuel: 50 },
        { id: 'L3', pos: [14.7, 0, -20.2], lit: false, fuel: 0 },
        { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, fuel: 0 },
        { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, fuel: 0 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  const evLose = simLose.step();
  assert.strictEqual(simLose.state, 'lost');
  const loseEv = evLose.find(e => e.name === 'game_over');
  assert(loseEv);
  assert.strictEqual(loseEv.data.result, 'lost');
  assert.strictEqual(loseEv.data.reason, 'dawn');

  console.log('✓ Dawn win (dawn_survived) & Dawn lose passed');
}

console.log('ALL PHASE 3 UNIT TESTS PASSED!\n');
