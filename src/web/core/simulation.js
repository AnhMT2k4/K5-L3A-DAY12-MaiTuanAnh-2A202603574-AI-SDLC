import { DEFAULT_TUNING, MAPS } from './constants.js';
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
    this.night = parseInt(night, 10) || 1;
    this.mapConfig = MAPS[this.night] || MAPS[1];

    this.tuning = { ...DEFAULT_TUNING, ...tuning };
    if (tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...tuning.score };
    }

    this.prng = new PRNG(this.seed);
    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'paused' | 'won' | 'lost'
    this.isPaused = false;
    this.score = 0;

    // Time setup
    this.total_duration_s = this.tuning[`night${this.night}_duration_s`] || this.mapConfig.duration_s || 240;
    this.time_left_s = this.total_duration_s;

    // Wind setup (Night 3)
    this.wind_enabled = this.mapConfig.hasWind;
    this.wind = { active: false, dir_deg: 0.0 };
    this.wind_timer = 0; // cycles every 1800 ticks (30s)
    this.wind_dir_vector = [0, 0];

    // Player setup
    this.player = {
      pos: [...this.mapConfig.startPos],
      vel: [0.0, 0.0, 0.0],
      grounded: true,
      facing_yaw: 0.0, // radians, 0 is +Z
      flames: this.tuning.flames,
      carried: 0,
      successful_lights: 0,
      capacity: 10,
      invuln_timer: 0.0,
      dash_cd: 0.0,
      pulse_cd: 0.0,
      charm_timer: 0.0,
      dash_timer: 0,
      dash_dir: [0, 0],
      jump_pad_launched: false,
      fall_cooldown_ticks: 0
    };

    // Lanterns setup (fuel_units: integer 0..6000 where 60 units = 1.0 fuel)
    this.lanterns = this.mapConfig.lanterns.map(l => ({
      id: l.id,
      pos: [...l.pos],
      lit: Boolean(l.lit),
      deposited: l.deposited || 0,
      fuel_units: l.lit ? 6000 : 0,
      ever_lit: Boolean(l.lit || l.ever_lit),
      relit_count: l.relit_count || 0,
      push_ticks: 0
    }));

    // Motes setup
    this.motes = [];
    this.moteIdCounter = 1;

    // Shades setup
    this.shades = [];
    this.shadeIdCounter = 1;

    // Drifters setup
    this.drifters = [];
    this.drifterIdCounter = 1;
    this.random_drifters = this.mapConfig.hasDrifters;

    // Charms setup
    this.charms = (this.mapConfig.charms || []).map(c => ({
      id: c.id,
      pos: [...c.pos],
      available: true,
      respawn_s: 0.0
    }));

    // Jump pads setup
    this.jumpPads = this.mapConfig.jumpPads || [];

    // Inputs setup
    this.inputFrames = inputs.frames || [];
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };
    this.prevInput = { ...this.currentInput };
    this.frameIndex = 0;

    // Scenario flags
    this.random_motes = true;
    this.random_shades = true;

    // Initialize entities with scenario or defaults
    this.initEntities(scenario);
  }

  initEntities(scenario) {
    if (scenario) {
      if (scenario.time_left_s !== undefined) {
        this.total_duration_s = scenario.time_left_s;
        this.time_left_s = scenario.time_left_s;
      }
      if (scenario.random_drifters !== undefined) {
        this.random_drifters = Boolean(scenario.random_drifters);
      }
      if (scenario.wind_enabled !== undefined) {
        this.wind_enabled = Boolean(scenario.wind_enabled);
      }
      if (scenario.random_motes !== undefined) {
        this.random_motes = Boolean(scenario.random_motes);
      }
      if (scenario.random_shades !== undefined) {
        this.random_shades = Boolean(scenario.random_shades);
      }

      if (scenario.player) {
        if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
        if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
        if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
        if (scenario.player.successful_lights !== undefined) {
          this.player.successful_lights = scenario.player.successful_lights;
          this.player.capacity = Math.min(this.tuning.capacity_max, 10 + 2 * this.player.successful_lights);
        }
        if (scenario.player.invuln_ticks !== undefined) {
          this.player.invuln_timer = scenario.player.invuln_ticks / 60.0;
        }
        if (scenario.player.dash_cd_ticks !== undefined) {
          this.player.dash_cd = scenario.player.dash_cd_ticks / 60.0;
        }
        if (scenario.player.pulse_cd_ticks !== undefined) {
          this.player.pulse_cd = scenario.player.pulse_cd_ticks / 60.0;
        }
        if (scenario.player.charm_ticks !== undefined) {
          this.player.charm_timer = scenario.player.charm_ticks / 60.0;
        }
      }

      if (scenario.lanterns) {
        for (const update of scenario.lanterns) {
          const l = this.lanterns.find(item => item.id === update.id);
          const isLit = update.lit !== undefined ? Boolean(update.lit) : false;
          let fuelVal = 0;
          if (isLit) {
            fuelVal = update.fuel !== undefined ? update.fuel : 100;
          } else {
            fuelVal = update.fuel !== undefined ? update.fuel : 0;
          }

          if (l) {
            if (update.pos) l.pos = [...update.pos];
            l.lit = isLit;
            if (update.deposited !== undefined) l.deposited = update.deposited;
            l.fuel_units = Math.round(fuelVal * 60);
            if (update.ever_lit !== undefined) {
              l.ever_lit = Boolean(update.ever_lit);
            } else if (isLit) {
              l.ever_lit = true;
            }
            if (update.relit_count !== undefined) l.relit_count = update.relit_count;
          } else {
            this.lanterns.push({
              id: update.id,
              pos: update.pos ? [...update.pos] : [0, 0, 0],
              lit: isLit,
              deposited: update.deposited || 0,
              fuel_units: Math.round(fuelVal * 60),
              ever_lit: update.ever_lit !== undefined ? Boolean(update.ever_lit) : isLit,
              relit_count: update.relit_count || 0,
              push_ticks: 0
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
            pos: [pos[0], pos[1] !== undefined ? pos[1] : 0.0, pos[2]],
            active: true,
            kind: m.kind || 'random',
            ttl_s: m.ttl_s || null,
            dropped_tick: -1
          };
        });
        this.moteIdCounter = this.motes.length + 1;
      } else if (this.random_motes) {
        this.spawnInitialMotes();
      }

      // Shades
      if (scenario.shades !== undefined) {
        this.shades = scenario.shades.map((s, idx) => ({
          id: s.id || `S${idx + 1}`,
          pos: [...s.pos],
          state: s.state || 'chase', // spawning, wander, chase, recoil, stunned, drain
          state_ticks_left: s.state_ticks_left !== undefined ? s.state_ticks_left : 0,
          push_vec: [0, 0],
          safe_pushed: false,
          target_lantern_id: s.target_lantern_id || null,
          drain_ticks: 0
        }));
        this.shadeIdCounter = this.shades.length + 1;
      } else if (this.random_shades) {
        // Will spawn per schedule at tick 300
      }

      // Drifters
      if (scenario.drifters !== undefined) {
        this.drifters = scenario.drifters.map((d, idx) => ({
          id: d.id || `D${idx + 1}`,
          pos: [...d.pos],
          state: d.state || 'idle', // idle, chase, flee
          stolen: d.stolen || 0,
          flee_timer: d.flee_ticks || 0,
          wander_angle: this.prng.range(0, Math.PI * 2)
        }));
        this.drifterIdCounter = this.drifters.length + 1;
      }

      // Charms
      if (scenario.charms !== undefined) {
        this.charms = scenario.charms.map((c, idx) => ({
          id: c.id || `C${idx + 1}`,
          pos: c.pos ? [...c.pos] : (this.mapConfig.charms[idx] ? this.mapConfig.charms[idx].pos : [0, 0, 0]),
          available: c.available !== undefined ? Boolean(c.available) : true,
          respawn_s: c.respawn_ticks ? c.respawn_ticks / 60.0 : 0.0
        }));
      }
    } else {
      if (this.random_motes) {
        this.spawnInitialMotes();
      }
    }
  }

  spawnInitialMotes() {
    const spawnPoints = this.mapConfig.moteSpawnPoints;
    const indices = [];
    for (let i = 0; i < spawnPoints.length; i++) indices.push(i);

    // Shuffle using deterministic PRNG
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(this.prng.next() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const count = Math.min(20, spawnPoints.length);
    for (let i = 0; i < count; i++) {
      const pt = spawnPoints[indices[i]];
      this.motes.push({
        id: `M${this.moteIdCounter++}`,
        pos: [pt[0], pt[1] || 0.0, pt[2]],
        active: true,
        kind: 'random',
        ttl_s: null,
        dropped_tick: -1
      });
    }
  }

  getTerrainHeight(x, z) {
    if (this.night === 1) {
      const dist = Math.hypot(x, z);
      if (dist <= 40.0) return 0.0;
      return -999.0;
    } else if (this.night === 2) {
      const distA = Math.hypot(x, z);
      if (distA <= 28.0) return 0.0;
      const distB = Math.hypot(x - 70.0, z);
      if (distB <= 28.0) return 0.0;
      if (x >= 26.0 && x <= 44.0 && z >= -2.0 && z <= 2.0) return 0.0; // bridge
      return -999.0;
    } else if (this.night === 3) {
      const dist = Math.hypot(x, z);
      if (dist > 45.0) return -999.0;

      // Tier 2: R <= 8m
      if (dist <= 8.0) return 6.0;

      // Tier 1: R in [12, 24] and z > 0
      if (dist >= 12.0 && dist <= 24.0 && z > 0) return 3.0;

      // 2 Ramps at 30 deg and 150 deg, width 3m, R in [24, 30]
      const angle = (Math.atan2(z, x) * 180.0) / Math.PI;
      for (const rampAngle of [30, 150]) {
        let diff = Math.abs(angle - rampAngle);
        if (diff > 180) diff = 360 - diff;
        const radDiff = (diff * Math.PI) / 180.0;
        const perpDist = dist * Math.sin(radDiff);
        if (dist >= 24.0 && dist <= 30.0 && perpDist <= 1.5) {
          return 3.0 * ((30.0 - dist) / 6.0);
        }
      }

      // Tier 0:
      return 0.0;
    }
    return 0.0;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: Number(this.time_left_s.toFixed(1)),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: Number(this.wind.dir_deg.toFixed(1))
      },
      player: {
        pos: [
          Number(this.player.pos[0].toFixed(3)),
          Number(this.player.pos[1].toFixed(3)),
          Number(this.player.pos[2].toFixed(3))
        ],
        vel: [
          Number(this.player.vel[0].toFixed(3)),
          Number(this.player.vel[1].toFixed(3)),
          Number(this.player.vel[2].toFixed(3))
        ],
        grounded: this.player.grounded,
        invuln: this.player.invuln_timer > 0,
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: this.player.capacity,
        dash_cd_s: Number(this.player.dash_cd.toFixed(3)),
        pulse_cd_s: Number(this.player.pulse_cd.toFixed(3)),
        charm_s: Number(this.player.charm_timer.toFixed(3))
      },
      lanterns: this.lanterns.map(l => ({
        id: l.id,
        pos: [
          Number(l.pos[0].toFixed(3)),
          Number(l.pos[1].toFixed(3)),
          Number(l.pos[2].toFixed(3))
        ],
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? Number((l.fuel_units / 60.0).toFixed(1)) : 0,
        ever_lit: l.ever_lit,
        relit_count: l.relit_count
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
      motes: this.motes.filter(m => m.active).map(m => ({
        id: m.id,
        pos: [
          Number(m.pos[0].toFixed(3)),
          Number(m.pos[1].toFixed(3)),
          Number(m.pos[2].toFixed(3))
        ],
        kind: m.kind,
        ttl_s: m.ttl_s !== null ? Number(m.ttl_s.toFixed(3)) : null
      })),
      drifters: this.drifters.map(d => ({
        id: d.id,
        pos: [
          Number(d.pos[0].toFixed(3)),
          Number(d.pos[1].toFixed(3)),
          Number(d.pos[2].toFixed(3))
        ],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map(c => ({
        id: c.id,
        available: c.available,
        respawn_s: Number(c.respawn_s.toFixed(3))
      })),
      motes_active: this.motes.filter(m => m.active).length
    };
  }

  step(externalInput = null) {
    const events = [];
    const dt = 1.0 / 60.0;
    const currentTick = this.tick;
    const nextTick = currentTick + 1;

    // --- STEP 1: Đọc input & xử lý pause ---
    this.prevInput = { ...this.currentInput };

    if (externalInput) {
      if (externalInput.move !== undefined) this.currentInput.move = [...externalInput.move];
      if (externalInput.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = externalInput.cam_yaw_deg;
      if (externalInput.jump !== undefined) this.currentInput.jump = Boolean(externalInput.jump);
      if (externalInput.interact !== undefined) this.currentInput.interact = Boolean(externalInput.interact);
      if (externalInput.pulse !== undefined) this.currentInput.pulse = Boolean(externalInput.pulse);
      if (externalInput.dash !== undefined) this.currentInput.dash = Boolean(externalInput.dash);
      if (externalInput.pause !== undefined) this.currentInput.pause = Boolean(externalInput.pause);
    } else {
      // Buttons default to false on each tick unless explicitly specified in input frame
      this.currentInput.jump = false;
      this.currentInput.interact = false;
      this.currentInput.pulse = false;
      this.currentInput.dash = false;
      this.currentInput.pause = false;

      while (this.frameIndex < this.inputFrames.length && this.inputFrames[this.frameIndex].tick <= currentTick) {
        const frame = this.inputFrames[this.frameIndex];
        if (frame.tick === currentTick) {
          if (frame.move !== undefined) this.currentInput.move = [...frame.move];
          if (frame.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = frame.cam_yaw_deg;
          if (frame.jump !== undefined) this.currentInput.jump = Boolean(frame.jump);
          if (frame.interact !== undefined) this.currentInput.interact = Boolean(frame.interact);
          if (frame.pulse !== undefined) this.currentInput.pulse = Boolean(frame.pulse);
          if (frame.dash !== undefined) this.currentInput.dash = Boolean(frame.dash);
          if (frame.pause !== undefined) this.currentInput.pause = Boolean(frame.pause);
        }
        this.frameIndex++;
      }
    }

    const triggerPause = this.currentInput.pause && !this.prevInput.pause;
    if (triggerPause) {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.state = 'paused';
        events.push({ type: 'event', tick: nextTick, name: 'paused', data: {} });
        this.tick = nextTick;
        return events;
      } else {
        this.state = 'playing';
        events.push({ type: 'event', tick: nextTick, name: 'resumed', data: {} });
      }
    }

    if (this.isPaused) {
      this.tick = nextTick;
      return events;
    }

    if (this.state !== 'playing') {
      this.tick = nextTick;
      return events;
    }

    const nextSimTick = this.sim_tick + 1;

    const triggerInteract = this.currentInput.interact && !this.prevInput.interact;
    const triggerPulse = this.currentInput.pulse && !this.prevInput.pulse;
    const triggerJump = this.currentInput.jump && !this.prevInput.jump;
    const triggerDash = this.currentInput.dash && !this.prevInput.dash;

    // First tick night_start event
    if (currentTick === 0) {
      events.push({
        type: 'event',
        tick: nextTick,
        name: 'night_start',
        data: { night: this.night }
      });
    }

    // --- STEP 2: Giảm các bộ đếm & Nhiên liệu đèn ---
    this.time_left_s = Math.max(0.0, this.total_duration_s - nextSimTick * dt);

    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer = Math.max(0, this.player.invuln_timer - dt);
    }
    if (this.player.dash_cd > 0) {
      this.player.dash_cd = Math.max(0, this.player.dash_cd - dt);
    }
    if (this.player.pulse_cd > 0) {
      this.player.pulse_cd = Math.max(0, this.player.pulse_cd - dt);
    }
    if (this.player.charm_timer > 0) {
      this.player.charm_timer = Math.max(0, this.player.charm_timer - dt);
    }
    if (this.player.dash_timer > 0) {
      this.player.dash_timer--;
    }

    // Update charms respawn
    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_s -= dt;
        if (c.respawn_s <= 0) {
          c.available = true;
          c.respawn_s = 0.0;
        }
      }
    }

    // Update dropped motes TTL
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.active && m.kind === 'dropped' && m.ttl_s !== null) {
        m.ttl_s -= dt;
        if (m.ttl_s <= 0) {
          m.active = false;
        }
      }
    }

    // Update shades state timers
    for (const s of this.shades) {
      if (s.state === 'spawning') {
        s.state_ticks_left--;
        if (s.state_ticks_left <= 0) {
          s.state = 'wander';
        }
      } else if (s.state === 'recoil') {
        s.state_ticks_left--;
        if (s.state_ticks_left <= 0) {
          s.state = 'chase';
        }
      } else if (s.state === 'stunned') {
        s.state_ticks_left--;
        if (s.state_ticks_left <= 0) {
          // Contract v1.2: Hết choáng thì về wander
          s.state = 'wander';
          s.target_lantern_id = null;
        }
      }
    }

    // Update drifters flee timer
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      if (d.state === 'flee') {
        d.flee_timer--;
        if (d.flee_timer <= 0) {
          this.drifters.splice(i, 1);
        }
      }
    }

    // Update wind (Night 3)
    if (this.wind_enabled) {
      this.wind_timer = (this.wind_timer + 1) % 1800; // 30s cycle
      if (this.wind_timer === 0) {
        const deg = Math.floor(this.prng.next() * 360);
        this.wind.dir_deg = deg;
        const rad = (deg * Math.PI) / 180.0;
        this.wind_dir_vector = [Math.cos(rad), Math.sin(rad)];
      }
      this.wind.active = (this.wind_timer >= 120 && this.wind_timer < 420);
    }

    // 2.2 Trừ dầu đèn (Hao hụt 1/giây + Bóng Mực hút 5/giây) & Tắt đèn nếu hết dầu
    for (const l of this.lanterns) {
      if (l.lit) {
        let drainCount = 0;
        for (const s of this.shades) {
          if (s.state === 'drain' && s.target_lantern_id === l.id) {
            drainCount++;
          }
        }

        // Deduct fuel in 1/60th integer units
        l.fuel_units -= (1 + 5 * drainCount);

        if (l.fuel_units <= 0) {
          l.fuel_units = 0;
          l.lit = false;
          l.deposited = 0;
          l.ever_lit = true;

          events.push({
            type: 'event',
            tick: nextTick,
            name: 'lantern_out',
            data: { lantern_id: l.id }
          });

          // All shades draining this lantern switch to wander
          for (const s of this.shades) {
            if (s.state === 'drain' && s.target_lantern_id === l.id) {
              s.state = 'wander';
              s.target_lantern_id = null;
              s.drain_ticks = 0;
            }
          }
        }
      }
    }

    // --- STEP 3: Di chuyển Mây & Rơi khỏi đảo ---
    if (this.player.fall_cooldown_ticks > 0) {
      this.player.fall_cooldown_ticks--;
      if (this.player.fall_cooldown_ticks === 0) {
        // Respawn
        this.player.pos = [...this.mapConfig.startPos];
        this.player.vel = [0.0, 0.0, 0.0];
        this.player.grounded = true;
        this.player.invuln_timer = this.tuning.invuln_s;
      }
    } else {
      // 3.1 Jump pads detection
      for (const pad of this.jumpPads) {
        const dPad = Math.hypot(this.player.pos[0] - pad.pos[0], this.player.pos[2] - pad.pos[2]);
        if (dPad <= pad.radius && Math.abs(this.player.pos[1] - pad.pos[1]) <= 0.5 && this.player.grounded) {
          this.player.grounded = false;
          this.player.jump_pad_launched = true;
          this.player.vel[1] = pad.vel_y;

          let hdx, hdz;
          if (pad.target) {
            hdx = pad.target[0] - pad.pos[0];
            hdz = pad.target[2] - pad.pos[2];
          } else if (pad.targetDir) {
            hdx = pad.targetDir[0];
            hdz = pad.targetDir[2];
          }
          const hLen = Math.hypot(hdx, hdz) || 1.0;
          this.player.vel[0] = (hdx / hLen) * pad.speed_h;
          this.player.vel[2] = (hdz / hLen) * pad.speed_h;
        }
      }

      // 3.2 Dash action
      if (triggerDash) {
        const canDash = (this.player.charm_timer > 0 || this.player.dash_cd <= 0) && this.player.dash_timer <= 0;
        if (canDash) {
          events.push({ type: 'event', tick: nextTick, name: 'dash', data: {} });
          this.player.dash_timer = 12; // 0.2s = 12 ticks
          this.player.dash_cd = (this.player.charm_timer > 0 ? 0.0 : this.tuning.dash_cooldown_s);

          let mx = this.currentInput.move[0];
          let mz = this.currentInput.move[1];
          if (mx === 0 && mz === 0) {
            this.player.dash_dir = [Math.sin(this.player.facing_yaw), Math.cos(this.player.facing_yaw)];
          } else {
            const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180.0;
            let wx = mx * Math.cos(rad) + mz * Math.sin(rad);
            let wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
            const mLen = Math.hypot(wx, wz);
            this.player.dash_dir = [wx / mLen, wz / mLen];
          }
          this.player.vel[1] = 0.0;
        }
      }

      // 3.3 Movement calculation
      if (this.player.dash_timer > 0) {
        this.player.vel[0] = this.player.dash_dir[0] * this.tuning.dash_speed;
        this.player.vel[2] = this.player.dash_dir[1] * this.tuning.dash_speed;
        this.player.vel[1] = 0.0;
      } else if (this.player.jump_pad_launched) {
        this.player.vel[1] -= 20.0 * dt; // gravity
      } else {
        const speed = (this.player.charm_timer > 0 ? 7.2 : this.tuning.player_speed);
        const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180.0;
        let mx = this.currentInput.move[0];
        let mz = this.currentInput.move[1];

        let wx = mx * Math.cos(rad) + mz * Math.sin(rad);
        let wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
        const mLen = Math.hypot(wx, wz);
        if (mLen > 1.0) {
          wx /= mLen;
          wz /= mLen;
        }

        this.player.vel[0] = wx * speed;
        this.player.vel[2] = wz * speed;

        if (wx !== 0 || wz !== 0) {
          this.player.facing_yaw = Math.atan2(wx, wz);
        }

        // Jump (only when grounded)
        if (triggerJump && this.player.grounded) {
          this.player.vel[1] = 7.0;
          this.player.grounded = false;
        }

        if (!this.player.grounded) {
          this.player.vel[1] -= 20.0 * dt;
        }
      }

      // Wind push (Night 3)
      if (this.wind_enabled && this.wind.active) {
        this.player.vel[0] += this.wind_dir_vector[0] * 2.0;
        this.player.vel[2] += this.wind_dir_vector[1] * 2.0;
      }

      // Apply displacement
      let newX = this.player.pos[0] + this.player.vel[0] * dt;
      let newY = this.player.pos[1] + this.player.vel[1] * dt;
      let newZ = this.player.pos[2] + this.player.vel[2] * dt;

      // Bell tower obstacle collision on Night 3
      if (this.night === 3) {
        const bt = this.mapConfig.bellTower;
        const dBT = Math.hypot(newX - bt.center[0], newZ - bt.center[2]);
        if (dBT < bt.radius && newY >= 6.0 && newY <= 14.0) {
          const ang = Math.atan2(newZ - bt.center[2], newX - bt.center[0]);
          newX = bt.center[0] + Math.cos(ang) * bt.radius;
          newZ = bt.center[2] + Math.sin(ang) * bt.radius;
        }
      }

      // Check terrain elevation
      const floorY = this.getTerrainHeight(newX, newZ);
      if (newY <= floorY && floorY > -900) {
        newY = floorY;
        this.player.vel[1] = 0.0;
        this.player.grounded = true;
        this.player.jump_pad_launched = false;
      } else if (newY > floorY) {
        this.player.grounded = false;
      }

      this.player.pos = [newX, newY, newZ];

      // Fall off island check (Y < -10)
      if (this.player.pos[1] < -10.0) {
        this.player.flames -= 1;
        const lost = this.player.carried;
        this.player.carried = 0;
        this.player.fall_cooldown_ticks = 60;

        events.push({
          type: 'event',
          tick: nextTick,
          name: 'player_hit',
          data: {
            by: 'fall',
            flames: this.player.flames,
            dropped: 0,
            lost: lost
          }
        });

        if (this.player.flames <= 0) {
          this.state = 'lost';
          events.push({
            type: 'event',
            tick: nextTick,
            name: 'game_over',
            data: { result: 'lost', reason: 'no_flames' }
          });
          this.tick = nextTick;
          this.sim_tick = nextSimTick;
          return events;
        }
      }
    }

    // --- STEP 4: Nhặt đom đóm và bùa ---
    if (this.player.fall_cooldown_ticks === 0) {
      // 4.1 Bùa Gió (Charms)
      for (const charm of this.charms) {
        if (charm.available) {
          const dXZ = Math.hypot(charm.pos[0] - this.player.pos[0], charm.pos[2] - this.player.pos[2]);
          const dY = Math.abs(this.player.pos[1] - charm.pos[1]);
          if (dXZ <= 1.0 && dY <= 1.5) {
            charm.available = false;
            charm.respawn_s = 2700 / 60.0; // 45s
            this.player.charm_timer = 600 / 60.0; // 10s

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'charm_picked',
              data: {
                charm_id: charm.id,
                charm_ticks: 600
              }
            });
          }
        }
      }

      // 4.2 Đom đóm (Motes) - Tôn trọng sức chứa tăng dần
      for (const mote of this.motes) {
        if (mote.active && this.player.carried < this.player.capacity) {
          if (mote.kind === 'dropped' && mote.dropped_tick >= currentTick) {
            continue;
          }
          const dXZ = Math.hypot(mote.pos[0] - this.player.pos[0], mote.pos[2] - this.player.pos[2]);
          const dY = Math.abs(this.player.pos[1] - mote.pos[1]);
          if (dXZ <= this.tuning.pickup_radius && dY <= 1.5) {
            mote.active = false;
            this.player.carried += 1;

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'mote_picked',
              data: { carried: this.player.carried }
            });
          }
        }
      }
    }

    // --- STEP 5: Tương tác với đèn (Thắp mới, thắp lại, hoặc châm dầu) ---
    if (triggerInteract && this.player.carried > 0 && this.player.fall_cooldown_ticks === 0) {
      let candidate = null;
      let minDist = Infinity;

      for (const lantern of this.lanterns) {
        // Chỉ xét đèn nhận được: chưa sáng, hoặc sáng nhưng chưa đầy dầu (fuel < 100)
        let eligible = false;
        if (!lantern.lit) {
          eligible = true;
        } else if (lantern.lit && lantern.fuel_units < 6000) {
          const currentFuel = lantern.fuel_units / 60.0;
          const neededMotes = Math.ceil((100.0 - currentFuel) / 10.0);
          if (neededMotes > 0) eligible = true;
        }

        if (eligible) {
          const d = Math.hypot(lantern.pos[0] - this.player.pos[0], lantern.pos[2] - this.player.pos[2]);
          if (d <= this.tuning.interact_radius) {
            if (d < minDist || (Math.abs(d - minDist) < 1e-4 && lantern.id < candidate.id)) {
              minDist = d;
              candidate = lantern;
            }
          }
        }
      }

      if (candidate) {
        if (!candidate.lit) {
          // Thắp mới hoặc Thắp lại
          const cost = candidate.ever_lit ? this.tuning.relight_cost : this.tuning.lantern_cost;
          const needed = cost - candidate.deposited;
          const amount = Math.min(this.player.carried, needed);
          if (amount > 0) {
            this.player.carried -= amount;
            candidate.deposited += amount;
            this.score += amount * 5; // Ticket-03: +5 mỗi đom đóm nạp

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'deposit',
              data: {
                lantern_id: candidate.id,
                amount: amount,
                deposited: candidate.deposited
              }
            });

            if (candidate.deposited >= cost) {
              candidate.lit = true;
              candidate.fuel_units = 6000; // 100 fuel
              candidate.deposited = 0;
              this.player.successful_lights++;
              this.player.capacity = Math.min(this.tuning.capacity_max, 10 + 2 * this.player.successful_lights);

              const isRelight = candidate.ever_lit;
              if (isRelight) {
                candidate.relit_count++;
                this.score += 40; // Thắp lại: +40
              } else {
                candidate.ever_lit = true;
                this.score += 100; // Thắp lần đầu: +100
              }

              events.push({
                type: 'event',
                tick: nextTick,
                name: 'lantern_lit',
                data: {
                  lantern_id: candidate.id,
                  relight: isRelight
                }
              });

              // Push shades inside safe zone out to 6m border over 30 ticks
              for (const s of this.shades) {
                const dShade = Math.hypot(s.pos[0] - candidate.pos[0], s.pos[2] - candidate.pos[2]);
                if (dShade < this.tuning.safe_radius) {
                  s.safe_pushed = true;
                  s.push_ticks_left = 30;
                  let ang = Math.atan2(s.pos[2] - candidate.pos[2], s.pos[0] - candidate.pos[0]);
                  if (dShade === 0) ang = 0;
                  const targetX = candidate.pos[0] + Math.cos(ang) * this.tuning.safe_radius;
                  const targetZ = candidate.pos[2] + Math.sin(ang) * this.tuning.safe_radius;
                  s.push_vec = [(targetX - s.pos[0]) / 30.0, (targetZ - s.pos[2]) / 30.0];
                }
                // If draining this lantern, switch to wander
                if (s.state === 'drain' && s.target_lantern_id === candidate.id) {
                  s.state = 'wander';
                  s.target_lantern_id = null;
                  s.drain_ticks = 0;
                }
              }
            }
          }
        } else {
          // Châm dầu (Refuel) cho đèn đang sáng
          const currentFuel = candidate.fuel_units / 60.0;
          const neededMotes = Math.ceil((100.0 - currentFuel) / 10.0);
          const used = Math.min(this.player.carried, neededMotes);
          if (used > 0) {
            const oldFuel = currentFuel;
            this.player.carried -= used;
            candidate.fuel_units = Math.min(6000, candidate.fuel_units + used * 10 * 60);
            const newFuel = candidate.fuel_units / 60.0;
            this.score += used * 5; // +5 mỗi đom đóm nạp

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'refuel',
              data: {
                lantern_id: candidate.id,
                amount: used,
                fuel: Number(newFuel.toFixed(1))
              }
            });

            // Khi đèn được châm dầu lên >= 30: đẩy bóng mực trong vùng 6m ra ngoài
            if (oldFuel < 30.0 && newFuel >= 30.0) {
              for (const s of this.shades) {
                const dShade = Math.hypot(s.pos[0] - candidate.pos[0], s.pos[2] - candidate.pos[2]);
                if (dShade < this.tuning.safe_radius) {
                  s.safe_pushed = true;
                  s.push_ticks_left = 30;
                  let ang = Math.atan2(s.pos[2] - candidate.pos[2], s.pos[0] - candidate.pos[0]);
                  if (dShade === 0) ang = 0;
                  const targetX = candidate.pos[0] + Math.cos(ang) * this.tuning.safe_radius;
                  const targetZ = candidate.pos[2] + Math.sin(ang) * this.tuning.safe_radius;
                  s.push_vec = [(targetX - s.pos[0]) / 30.0, (targetZ - s.pos[2]) / 30.0];
                }
                if (s.state === 'drain' && s.target_lantern_id === candidate.id) {
                  s.state = 'wander';
                  s.target_lantern_id = null;
                  s.drain_ticks = 0;
                }
              }
            }
          }
        }
      }
    }

    // --- STEP 6: Cập nhật vùng an toàn ---
    // Safe radius = 6.0m cho các đèn sáng có fuel >= 30 (fuel_units >= 1800)

    // --- STEP 7: Tỏa Sáng (Pulse) ---
    if (triggerPulse && this.player.fall_cooldown_ticks === 0) {
      if (this.player.pulse_cd <= 0 && this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.player.pulse_cd = this.tuning.pulse_cooldown_s;

        const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
        const stunned_ids = [];

        // Check shades (3D distance <= 5m)
        for (const shade of this.shades) {
          const d3 = Math.hypot(
            shade.pos[0] - pulseCenter[0],
            shade.pos[1] - pulseCenter[1],
            shade.pos[2] - pulseCenter[2]
          );
          if (d3 <= this.tuning.pulse_radius) {
            const wasDraining = (shade.state === 'drain');
            shade.state = 'stunned';
            shade.state_ticks_left = 120;
            shade.push_ticks_left = 15;
            shade.target_lantern_id = null;
            shade.drain_ticks = 0;

            let pdx = shade.pos[0] - this.player.pos[0];
            let pdz = shade.pos[2] - this.player.pos[2];
            let pd = Math.hypot(pdx, pdz);
            if (pd < 1e-4) {
              pdx = 1.0;
              pdz = 0.0;
              pd = 1.0;
            }
            shade.push_vec = [(pdx / pd) * (this.tuning.pulse_push_m / 15.0), (pdz / pd) * (this.tuning.pulse_push_m / 15.0)];

            // Ticket-03: +5 mỗi con; +15 nếu trước đó đang drain
            this.score += wasDraining ? 15 : 5;
            stunned_ids.push(shade.id);
          }
        }

        // Check Drifters in range
        for (const d of this.drifters) {
          const dDist = Math.hypot(d.pos[0] - pulseCenter[0], d.pos[1] - pulseCenter[1], d.pos[2] - pulseCenter[2]);
          if (dDist <= this.tuning.pulse_radius) {
            if (d.state === 'chase') {
              d.state = 'flee';
              d.flee_timer = 240;
            } else if (d.state === 'flee' && d.stolen > 0) {
              const dropCount = d.stolen;
              for (let i = 0; i < dropCount; i++) {
                this.motes.push({
                  id: `M${this.moteIdCounter++}`,
                  pos: [d.pos[0], d.pos[1], d.pos[2]],
                  active: true,
                  kind: 'dropped',
                  ttl_s: 480 / 60.0,
                  dropped_tick: nextTick
                });
              }
              d.stolen = 0;
              d.flee_timer = 120;
              events.push({
                type: 'event',
                tick: nextTick,
                name: 'drifter_drop',
                data: { drifter_id: d.id, amount: dropCount }
              });
            }
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

    // --- STEP 8: Di chuyển Bóng Mực & Gió Lạc ---
    // 8.1 Drifters movement
    for (const d of this.drifters) {
      if (d.state === 'idle') {
        d.wander_angle += this.prng.range(-0.1, 0.1);
        d.pos[0] += Math.cos(d.wander_angle) * 2.0 * dt;
        d.pos[2] += Math.sin(d.wander_angle) * 2.0 * dt;

        const distP = Math.hypot(d.pos[0] - this.player.pos[0], d.pos[2] - this.player.pos[2]);
        if (this.player.carried >= 5 && distP <= 15.0) {
          d.state = 'chase';
        }
      } else if (d.state === 'chase') {
        const dx = this.player.pos[0] - d.pos[0];
        const dz = this.player.pos[2] - d.pos[2];
        const distP = Math.hypot(dx, dz);
        if (this.player.carried < 5 || distP > 15.0) {
          d.state = 'idle';
        } else if (distP > 1e-4) {
          d.pos[0] += (dx / distP) * 7.0 * dt;
          d.pos[2] += (dz / distP) * 7.0 * dt;
        }
      } else if (d.state === 'flee') {
        const dx = d.pos[0] - this.player.pos[0];
        const dz = d.pos[2] - this.player.pos[2];
        let distP = Math.hypot(dx, dz);
        if (distP < 1e-4) distP = 1.0;
        d.pos[0] += (dx / distP) * 7.0 * dt;
        d.pos[2] += (dz / distP) * 7.0 * dt;
      }
    }

    // 8.2 Shades movement & Drain AI
    const shadeSpd = this.mapConfig.shadeSpeed || this.tuning.shade_speed;
    for (const shade of this.shades) {
      if (shade.state === 'spawning') {
        // stationary
      } else if (shade.state === 'recoil') {
        const dx = shade.pos[0] - this.player.pos[0];
        const dz = shade.pos[2] - this.player.pos[2];
        let dist = Math.hypot(dx, dz);
        if (dist < 1e-4) dist = 1.0;
        shade.pos[0] += (dx / dist) * (2.0 / 60.0);
        shade.pos[2] += (dz / dist) * (2.0 / 60.0);
      } else if (shade.state === 'stunned') {
        if (shade.push_ticks_left > 0) {
          shade.push_ticks_left--;
          shade.pos[0] += shade.push_vec[0];
          shade.pos[2] += shade.push_vec[1];
        }
      } else if (shade.safe_pushed && shade.push_ticks_left > 0) {
        shade.push_ticks_left--;
        shade.pos[0] += shade.push_vec[0];
        shade.pos[2] += shade.push_vec[1];
        if (shade.push_ticks_left <= 0) shade.safe_pushed = false;
      } else if (shade.state === 'drain') {
        // Trạng thái hút dầu (drain)
        const targetLantern = this.lanterns.find(l => l.id === shade.target_lantern_id);
        const distXZ = targetLantern ? Math.hypot(shade.pos[0] - targetLantern.pos[0], shade.pos[2] - targetLantern.pos[2]) : 999;
        const distP = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);

        if (distP <= 6.0) {
          // Sang chase nếu Mây vào trong 6m
          shade.state = 'chase';
          shade.target_lantern_id = null;
          shade.drain_ticks = 0;
        } else if (!targetLantern || !targetLantern.lit || targetLantern.fuel_units >= 1800 || distXZ > 2.0) {
          // Sang wander nếu đèn tắt, fuel >= 30, hoặc cách đèn > 2m
          shade.state = 'wander';
          shade.target_lantern_id = null;
          shade.drain_ticks = 0;
        } else {
          // Đang hút: phát sự kiện fuel_drain mỗi 60 tick
          shade.drain_ticks = (shade.drain_ticks || 0) + 1;
          if (shade.drain_ticks % 60 === 0) {
            events.push({
              type: 'event',
              tick: nextTick,
              name: 'fuel_drain',
              data: {
                lantern_id: targetLantern.id,
                shade_id: shade.id,
                fuel: Number((targetLantern.fuel_units / 60.0).toFixed(1))
              }
            });
          }
        }
      } else if (shade.state === 'wander') {
        const distP = Math.hypot(this.player.pos[0] - shade.pos[0], this.player.pos[2] - shade.pos[2]);
        if (distP <= 12.0) {
          shade.state = 'chase';
        } else {
          // Tìm đèn yếu (lit, fuel < 30) gần nhất; không có thì tìm đèn tắt gần nhất
          let target = null;
          let minDist = Infinity;

          const weakLanterns = this.lanterns.filter(l => l.lit && l.fuel_units < 1800);
          if (weakLanterns.length > 0) {
            for (const l of weakLanterns) {
              const d = Math.hypot(l.pos[0] - shade.pos[0], l.pos[2] - shade.pos[2]);
              if (d < minDist || (Math.abs(d - minDist) < 1e-4 && l.id < target.id)) {
                minDist = d;
                target = l;
              }
            }
          } else {
            const unlitLanterns = this.lanterns.filter(l => !l.lit);
            for (const l of unlitLanterns) {
              const d = Math.hypot(l.pos[0] - shade.pos[0], l.pos[2] - shade.pos[2]);
              if (d < minDist || (Math.abs(d - minDist) < 1e-4 && l.id < target.id)) {
                minDist = d;
                target = l;
              }
            }
          }

          if (target) {
            const dx = target.pos[0] - shade.pos[0];
            const dz = target.pos[2] - shade.pos[2];
            const distT = Math.hypot(dx, dz);

            if (target.lit && target.fuel_units < 1800 && distT <= 2.0) {
              // Chuyển sang drain khi cách đèn yếu <= 2m
              shade.state = 'drain';
              shade.target_lantern_id = target.id;
              shade.drain_ticks = 0;
            } else if (distT > 1e-4) {
              let nx = shade.pos[0] + (dx / distT) * shadeSpd * 0.5 * dt;
              let nz = shade.pos[2] + (dz / distT) * shadeSpd * 0.5 * dt;

              // Check safe zone block (đèn có fuel >= 30)
              let blocked = false;
              for (const l of this.lanterns) {
                if (l.lit && l.fuel_units >= 1800) {
                  const dL = Math.hypot(nx - l.pos[0], nz - l.pos[2]);
                  if (dL < this.tuning.safe_radius) {
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
      } else if (shade.state === 'chase') {
        const dx = this.player.pos[0] - shade.pos[0];
        const dz = this.player.pos[2] - shade.pos[2];
        const dist = Math.hypot(dx, dz);

        if (dist > 18.0) {
          shade.state = 'wander';
        } else if (dist > 1e-4) {
          let nx = shade.pos[0] + (dx / dist) * shadeSpd * dt;
          let nz = shade.pos[2] + (dz / dist) * shadeSpd * dt;

          // Check safe zone block (đèn có fuel >= 30)
          let blocked = false;
          for (const l of this.lanterns) {
            if (l.lit && l.fuel_units >= 1800) {
              const dL = Math.hypot(nx - l.pos[0], nz - l.pos[2]);
              if (dL < this.tuning.safe_radius) {
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
      shade.pos[1] = this.getTerrainHeight(shade.pos[0], shade.pos[2]);
      if (shade.pos[1] < 0) shade.pos[1] = 0;
    }

    // --- STEP 9: Chạm (Collisions & Hits) ---
    if (this.player.fall_cooldown_ticks === 0) {
      // 9.1 Gió Lạc cướp trước
      for (const d of this.drifters) {
        if (d.state !== 'flee') {
          const dXZ = Math.hypot(d.pos[0] - this.player.pos[0], d.pos[2] - this.player.pos[2]);
          if (dXZ <= 1.2 && this.player.carried > 0) {
            const stealAmount = Math.min(3, this.player.carried);
            this.player.carried -= stealAmount;
            d.stolen += stealAmount;
            d.state = 'flee';
            d.flee_timer = 240;

            events.push({
              type: 'event',
              tick: nextTick,
              name: 'drifter_steal',
              data: {
                drifter_id: d.id,
                amount: stealAmount,
                carried: this.player.carried
              }
            });
          }
        }
      }

      // 9.2 Bóng Mực gây hit (xét theo id tăng dần: S1, S2...)
      // Tối đa 1 lần mất Ngọn Lửa mỗi tick!
      const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      for (const shade of sortedShades) {
        if (
          shade.state !== 'stunned' &&
          shade.state !== 'spawning' &&
          shade.state !== 'recoil' &&
          shade.state !== 'drain' &&
          !shade.safe_pushed
        ) {
          const inSafe = this.lanterns.some(
            l => l.lit && l.fuel_units >= 1800 && Math.hypot(shade.pos[0] - l.pos[0], shade.pos[2] - l.pos[2]) <= this.tuning.safe_radius
          );

          if (!inSafe) {
            const dXZ = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
            const dY = Math.abs(this.player.pos[1] - shade.pos[1]);

            if (dXZ <= this.tuning.shade_hit_radius && dY <= 1.5) {
              if (this.player.invuln_timer <= 0) {
                this.player.flames -= 1;
                const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
                this.player.carried -= dropped;

                for (let i = 0; i < dropped; i++) {
                  const r = this.prng.range(1.5, 2.5);
                  const a = (i * (Math.PI * 2 / dropped)) + this.prng.range(-0.2, 0.2);
                  this.motes.push({
                    id: `M${this.moteIdCounter++}`,
                    pos: [
                      Number((this.player.pos[0] + r * Math.cos(a)).toFixed(3)),
                      this.player.pos[1],
                      Number((this.player.pos[2] + r * Math.sin(a)).toFixed(3))
                    ],
                    active: true,
                    kind: 'dropped',
                    ttl_s: 480 / 60.0,
                    dropped_tick: nextTick
                  });
                }

                this.player.invuln_timer = this.tuning.invuln_s;
                shade.state = 'recoil';
                shade.state_ticks_left = 60;

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
                    data: { result: 'lost', reason: 'no_flames' }
                  });
                  this.tick = nextTick;
                  this.sim_tick = nextSimTick;
                  return events;
                }

                break;
              }
            }
          }
        }
      }
    }

    // --- STEP 10: Sinh thực thể theo lịch ---
    // 10.1 Sinh đom đóm
    if (this.random_motes && nextSimTick % 240 === 0) {
      const activeCount = this.motes.filter(m => m.active).length;
      if (activeCount < 30) {
        const spawnPoints = this.mapConfig.moteSpawnPoints;
        const occupied = new Set(
          this.motes.filter(m => m.active).map(m => `${m.pos[0].toFixed(1)},${m.pos[2].toFixed(1)}`)
        );
        const freePoints = spawnPoints.filter(p => !occupied.has(`${p[0].toFixed(1)},${p[2].toFixed(1)}`));
        if (freePoints.length > 0) {
          const pt = freePoints[Math.floor(this.prng.next() * freePoints.length)];
          this.motes.push({
            id: `M${this.moteIdCounter++}`,
            pos: [pt[0], pt[1] || 0.0, pt[2]],
            active: true,
            kind: 'random',
            ttl_s: null,
            dropped_tick: -1
          });
        }
      }
    }

    // 10.2 Sinh Bóng Mực
    if (this.random_shades) {
      const spawnInterval = this.mapConfig.shadeIntervalTicks || 480;
      let shouldSpawn = false;
      let spawnCount = 1;

      if (nextSimTick === 300) {
        shouldSpawn = true;
        spawnCount = 2;
      } else if (nextSimTick > 300 && (nextSimTick - 300) % spawnInterval === 0) {
        shouldSpawn = true;
        spawnCount = 1;
      }

      if (shouldSpawn && this.shades.length < (this.mapConfig.maxShades || 6)) {
        const pts = this.mapConfig.shadeSpawnPoints;
        const validPts = pts.filter(p => Math.hypot(p[0] - this.player.pos[0], p[2] - this.player.pos[2]) >= 15.0);

        for (let i = 0; i < spawnCount; i++) {
          if (this.shades.length >= (this.mapConfig.maxShades || 6)) break;
          const ptPool = validPts.length > 0 ? validPts : pts;
          const chosen = ptPool[Math.floor(this.prng.next() * ptPool.length)];
          const newId = `S${this.shadeIdCounter++}`;

          this.shades.push({
            id: newId,
            pos: [chosen[0], chosen[1] || 0.0, chosen[2]],
            state: 'spawning',
            state_ticks_left: 30,
            push_vec: [0, 0],
            safe_pushed: false,
            target_lantern_id: null,
            drain_ticks: 0
          });

          events.push({
            type: 'event',
            tick: nextTick,
            name: 'shade_spawned',
            data: { id: newId }
          });
        }
      }
    }

    // 10.3 Sinh Gió Lạc
    if (this.random_drifters && nextSimTick % 1200 === 0 && this.drifters.length < 2) {
      const pts = this.mapConfig.shadeSpawnPoints;
      const chosen = pts[Math.floor(this.prng.next() * pts.length)];
      const dId = `D${this.drifterIdCounter++}`;
      this.drifters.push({
        id: dId,
        pos: [chosen[0], 2.0, chosen[2]],
        state: 'idle',
        stolen: 0,
        flee_timer: 0,
        wander_angle: this.prng.range(0, Math.PI * 2)
      });
    }

    // --- STEP 11: Xét thắng / thua (Luật mới Contract v1.2) ---
    // Diễn ra sau mọi cập nhật của tick, kể cả tick bình minh: hết Ngọn Lửa luôn thua no_flames trước
    if (this.player.flames <= 0) {
      this.state = 'lost';
      events.push({
        type: 'event',
        tick: nextTick,
        name: 'game_over',
        data: { result: 'lost', reason: 'no_flames' }
      });
    } else if (this.time_left_s <= 0.001) {
      // Bình minh (Hết giờ)
      const litLanterns = this.lanterns.filter(l => l.lit);
      const reqLit = Math.ceil(this.tuning.win_ratio * this.lanterns.length);

      if (litLanterns.length >= reqLit) {
        this.state = 'won';
        let victoryBonus = 0;
        for (const l of litLanterns) {
          victoryBonus += 50 + Math.floor(l.fuel_units / 60.0);
        }
        victoryBonus += 50 * this.player.flames;
        this.score += victoryBonus;

        events.push({
          type: 'event',
          tick: nextTick,
          name: 'game_over',
          data: { result: 'won', reason: 'dawn_survived' }
        });
      } else {
        this.state = 'lost';
        events.push({
          type: 'event',
          tick: nextTick,
          name: 'game_over',
          data: { result: 'lost', reason: 'dawn' }
        });
      }
    }

    this.tick = nextTick;
    this.sim_tick = nextSimTick;
    return events;
  }
}
