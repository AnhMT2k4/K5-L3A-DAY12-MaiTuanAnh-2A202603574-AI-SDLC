import { DEFAULT_TUNING, DEFAULT_LANTERNS, ISLAND_RADIUS } from './constants.js';
import { PRNG } from './prng.js';

export class GameSimulation {
  constructor(options = {}) {
    const {
      seed = 12345,
      night = 1,
      tuning = {},
      scenario = null,
      inputs = { frames: [] }
    } = options;

    this.seed = seed;
    this.night = night;
    this.tuning = { ...DEFAULT_TUNING, ...tuning };
    if (tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...tuning.score };
    }

    this.prng = new PRNG(this.seed);
    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.score = 0;

    // Time setup
    this.total_duration_s = this.tuning.night1_duration_s;
    this.time_left_s = this.total_duration_s;

    // Player setup
    this.player = {
      pos: [0.0, 0.0, 0.0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_timer: 0.0,
      pulse_cooldown: 0.0,
      vel_y: 0.0
    };

    // Lanterns setup (L1..L5)
    this.lanterns = DEFAULT_LANTERNS.map(l => ({
      id: l.id,
      pos: [...l.pos],
      lit: l.lit,
      deposited: l.deposited
    }));

    // Motes setup
    this.motes = [];
    // Shades setup
    this.shades = [];

    // Inputs setup
    this.inputFrames = inputs.frames || [];
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false
    };
    this.prevInput = { ...this.currentInput };
    this.frameIndex = 0;

    // Apply scenario or defaults
    this.initEntities(scenario);
  }

  initEntities(scenario) {
    if (scenario) {
      if (scenario.time_left_s !== undefined) {
        this.total_duration_s = scenario.time_left_s;
        this.time_left_s = scenario.time_left_s;
      }

      if (scenario.player) {
        if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
        if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
        if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      }

      if (scenario.lanterns) {
        for (const update of scenario.lanterns) {
          const l = this.lanterns.find(item => item.id === update.id);
          if (l) {
            if (update.pos) l.pos = [...update.pos];
            if (update.lit !== undefined) l.lit = Boolean(update.lit);
            if (update.deposited !== undefined) l.deposited = update.deposited;
          } else {
            this.lanterns.push({
              id: update.id,
              pos: update.pos ? [...update.pos] : [0, 0, 0],
              lit: Boolean(update.lit),
              deposited: update.deposited || 0
            });
          }
        }
      }

      // Motes
      if (scenario.motes !== undefined) {
        this.motes = scenario.motes.map((m, idx) => {
          const pos = Array.isArray(m) ? m : m.pos;
          return {
            id: m.id || `M${idx + 1}`,
            pos: [pos[0], 0.0, pos[2]],
            active: true
          };
        });
      } else if (scenario.random_motes !== false) {
        this.spawnDefaultMotes();
      }

      // Shades
      if (scenario.shades !== undefined) {
        this.shades = scenario.shades.map((s, idx) => ({
          id: s.id || `S${idx + 1}`,
          pos: [...s.pos],
          state: s.state || 'chase',
          stun_timer: 0.0
        }));
      } else if (scenario.random_shades !== false) {
        this.spawnDefaultShades();
      }
    } else {
      this.spawnDefaultMotes();
      this.spawnDefaultShades();
    }
  }

  spawnDefaultMotes() {
    // 25 motes distributed across the island
    const count = 25;
    for (let i = 1; i <= count; i++) {
      const radius = this.prng.range(5, ISLAND_RADIUS - 5);
      const angle = this.prng.range(0, Math.PI * 2);
      this.motes.push({
        id: `M${i}`,
        pos: [
          Number((Math.cos(angle) * radius).toFixed(3)),
          0.0,
          Number((Math.sin(angle) * radius).toFixed(3))
        ],
        active: true
      });
    }
  }

  spawnDefaultShades() {
    // 3 initial shades
    const count = 3;
    for (let i = 1; i <= count; i++) {
      const radius = this.prng.range(20, ISLAND_RADIUS - 5);
      const angle = (i * (Math.PI * 2 / count)) + this.prng.range(-0.3, 0.3);
      this.shades.push({
        id: `S${i}`,
        pos: [
          Number((Math.cos(angle) * radius).toFixed(3)),
          0.0,
          Number((Math.sin(angle) * radius).toFixed(3))
        ],
        state: 'chase',
        stun_timer: 0.0
      });
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: Number(this.time_left_s.toFixed(1)),
      score: this.score,
      player: {
        pos: [
          Number(this.player.pos[0].toFixed(3)),
          Number(this.player.pos[1].toFixed(3)),
          Number(this.player.pos[2].toFixed(3))
        ],
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [
          Number(l.pos[0].toFixed(3)),
          Number(l.pos[1].toFixed(3)),
          Number(l.pos[2].toFixed(3))
        ],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map(s => ({
        id: s.id,
        pos: [
          Number(s.pos[0].toFixed(3)),
          Number(s.pos[1].toFixed(3)),
          Number(s.pos[2].toFixed(3))
        ],
        state: s.state
      })),
      motes_active: this.motes.filter(m => m.active).length
    };
  }

  step() {
    if (this.state !== 'playing') {
      return [];
    }

    const events = [];
    const dt = 1.0 / 60.0;
    const currentTick = this.tick;
    const nextTick = currentTick + 1;

    // 1. Ingest input frame if matching current tick
    this.prevInput = { ...this.currentInput };
    while (this.frameIndex < this.inputFrames.length && this.inputFrames[this.frameIndex].tick <= currentTick) {
      const frame = this.inputFrames[this.frameIndex];
      if (frame.tick === currentTick) {
        if (frame.move !== undefined) this.currentInput.move = [...frame.move];
        if (frame.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = frame.cam_yaw_deg;
        if (frame.jump !== undefined) this.currentInput.jump = Boolean(frame.jump);
        if (frame.interact !== undefined) this.currentInput.interact = Boolean(frame.interact);
        if (frame.pulse !== undefined) this.currentInput.pulse = Boolean(frame.pulse);
        if (frame.dash !== undefined) this.currentInput.dash = Boolean(frame.dash);
      }
      this.frameIndex++;
    }

    // Detect action triggers (false -> true)
    const triggerInteract = this.currentInput.interact && !this.prevInput.interact;
    const triggerPulse = this.currentInput.pulse && !this.prevInput.pulse;
    const triggerJump = this.currentInput.jump && !this.prevInput.jump;

    // 2. Update time
    this.time_left_s = Math.max(0.0, this.total_duration_s - nextTick * dt);

    // Update timers
    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer = Math.max(0, this.player.invuln_timer - dt);
    }
    if (this.player.pulse_cooldown > 0) {
      this.player.pulse_cooldown = Math.max(0, this.player.pulse_cooldown - dt);
    }

    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_timer -= dt;
        if (shade.stun_timer <= 0) {
          shade.state = 'chase';
          shade.stun_timer = 0;
        }
      }
    }

    // 3. Player movement
    const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180.0;
    const mx = this.currentInput.move[0];
    const mz = this.currentInput.move[1];

    let wx = mx * Math.cos(rad) + mz * Math.sin(rad);
    let wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
    const mLen = Math.hypot(wx, wz);
    if (mLen > 1.0) {
      wx /= mLen;
      wz /= mLen;
    }

    this.player.pos[0] += wx * this.tuning.player_speed * dt;
    this.player.pos[2] += wz * this.tuning.player_speed * dt;

    // Jump physics (visual / Y)
    if (triggerJump && this.player.pos[1] <= 0.001) {
      this.player.vel_y = 6.0;
    }
    if (this.player.pos[1] > 0 || this.player.vel_y > 0) {
      this.player.pos[1] += this.player.vel_y * dt;
      this.player.vel_y -= 18.0 * dt; // gravity
      if (this.player.pos[1] <= 0) {
        this.player.pos[1] = 0;
        this.player.vel_y = 0;
      }
    }

    // 4. Pulse action
    if (triggerPulse) {
      if (this.player.pulse_cooldown <= 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.player.pulse_cooldown = this.tuning.pulse_cooldown_s;

        const stunned_ids = [];
        for (const shade of this.shades) {
          const d = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
          if (d <= this.tuning.pulse_radius) {
            shade.state = 'stunned';
            shade.stun_timer = this.tuning.pulse_stun_s;
            stunned_ids.push(shade.id);
            this.score += this.tuning.score.per_stun;

            // Push outward
            let pdx = shade.pos[0] - this.player.pos[0];
            let pdz = shade.pos[2] - this.player.pos[2];
            let pd = Math.hypot(pdx, pdz);
            if (pd < 1e-4) {
              pdx = 1;
              pdz = 0;
              pd = 1;
            }
            shade.pos[0] += (pdx / pd) * this.tuning.pulse_push_m;
            shade.pos[2] += (pdz / pd) * this.tuning.pulse_push_m;
          }
        }

        events.push({
          type: 'event',
          tick: nextTick,
          name: 'pulse',
          data: { stunned_ids }
        });
      }
    }

    // 5. Interact action (deposit into lantern)
    if (triggerInteract && this.player.carried > 0) {
      let nearestLantern = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        if (!lantern.lit) {
          const d = Math.hypot(lantern.pos[0] - this.player.pos[0], lantern.pos[2] - this.player.pos[2]);
          if (d <= this.tuning.interact_radius && d < minDist) {
            minDist = d;
            nearestLantern = lantern;
          }
        }
      }

      if (nearestLantern) {
        const needed = this.tuning.lantern_cost - nearestLantern.deposited;
        const amount = Math.min(this.player.carried, needed);
        if (amount > 0) {
          this.player.carried -= amount;
          nearestLantern.deposited += amount;

          events.push({
            type: 'event',
            tick: nextTick,
            name: 'deposit',
            data: {
              lantern_id: nearestLantern.id,
              amount: amount,
              deposited: nearestLantern.deposited
            }
          });

          if (nearestLantern.deposited >= this.tuning.lantern_cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'lantern_lit',
              data: {
                lantern_id: nearestLantern.id
              }
            });

            // Check win condition
            if (this.lanterns.every(l => l.lit)) {
              this.state = 'won';
              const timeBonus = Math.max(0, Math.floor(this.time_left_s)) * this.tuning.score.per_second_left;
              const flameBonus = this.player.flames * this.tuning.score.per_flame_left;
              this.score += timeBonus + flameBonus;

              events.push({
                type: 'event',
                tick: nextTick,
                name: 'game_over',
                data: {
                  result: 'won',
                  reason: 'all_lit'
                }
              });

              this.tick = nextTick;
              this.sim_tick = nextTick;
              return events;
            }
          }
        }
      }
    }

    // 6. Mote collection
    for (const mote of this.motes) {
      if (mote.active && this.player.carried < this.tuning.carry_capacity) {
        const d = Math.hypot(mote.pos[0] - this.player.pos[0], mote.pos[2] - this.player.pos[2]);
        if (d <= this.tuning.pickup_radius) {
          mote.active = false;
          this.player.carried += 1;
          this.score += this.tuning.score.per_mote;

          events.push({
            type: 'event',
            tick: nextTick,
            name: 'mote_picked',
            data: { carried: this.player.carried }
          });
        }
      }
    }

    // 7. Shade movement
    for (const shade of this.shades) {
      if (shade.state === 'chase') {
        const dx = this.player.pos[0] - shade.pos[0];
        const dz = this.player.pos[2] - shade.pos[2];
        const dist = Math.hypot(dx, dz);
        if (dist > 1e-4) {
          const stepDist = this.tuning.shade_speed * dt;
          const nx = shade.pos[0] + (dx / dist) * stepDist;
          const nz = shade.pos[2] + (dz / dist) * stepDist;

          // Safe radius check around lit lanterns
          let blocked = false;
          for (const lantern of this.lanterns) {
            if (lantern.lit && this.tuning.safe_radius > 0) {
              const dLantern = Math.hypot(nx - lantern.pos[0], nz - lantern.pos[2]);
              if (dLantern < this.tuning.safe_radius) {
                blocked = true;
                break;
              }
            }
          }

          if (!blocked) {
            shade.pos[0] = nx;
            shade.pos[2] = nz;
          }
        }
      }
    }

    // 8. Collision: Shade touches player
    for (const shade of this.shades) {
      if (shade.state !== 'stunned' && this.player.invuln_timer <= 0) {
        // Check if shade is in safe zone of a lit lantern
        const inSafe = this.lanterns.some(
          l => l.lit && Math.hypot(shade.pos[0] - l.pos[0], shade.pos[2] - l.pos[2]) <= this.tuning.safe_radius
        );

        if (!inSafe) {
          const d = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
          if (d <= this.tuning.shade_hit_radius) {
            this.player.flames -= 1;
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropped;
            this.player.invuln_timer = this.tuning.invuln_s;

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'player_hit',
              data: {
                by: 'shade',
                flames: this.player.flames,
                dropped: dropped
              }
            });

            if (this.player.flames <= 0) {
              this.state = 'lost';
              events.push({
                type: 'event',
                tick: nextTick,
                name: 'game_over',
                data: {
                  result: 'lost',
                  reason: 'no_flames'
                }
              });

              this.tick = nextTick;
              this.sim_tick = nextTick;
              return events;
            }
          }
        }
      }
    }

    // 9. Time out check
    if (this.time_left_s <= 0.001) {
      this.state = 'lost';
      events.push({
        type: 'event',
        tick: nextTick,
        name: 'game_over',
        data: {
          result: 'lost',
          reason: 'dawn'
        }
      });
    }

    this.tick = nextTick;
    this.sim_tick = nextTick;
    return events;
  }
}
