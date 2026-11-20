export const DEFAULT_TUNING = {
  player_speed: 6.0,
  carry_capacity: 10,
  lantern_cost: 10,
  lantern_count_night1: 5,
  pickup_radius: 1.0,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  dash_speed: 14.0,
  dash_duration_s: 0.2, // 12 ticks
  dash_cooldown_s: 1.5, // 90 ticks
  flames: 3,
  invuln_s: 1.5, // 90 ticks
  hit_drop_ratio: 0.5,
  pulse_stun_s: 2.0, // 120 ticks
  pulse_push_m: 4.0, // over 15 ticks
  pulse_cooldown_s: 3.0,
  safe_radius: 6.0,
  shade_speed: 4.0,
  shade_hit_radius: 1.0,
  fall_enabled: true,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  relight_cost: 5,
  win_ratio: 0.6,
  drain_per_s: 5,
  low_fuel_threshold: 30,
  capacity_max: 20,
  score: {
    per_mote_deposited: 5,
    per_first_light: 100,
    per_relight: 40,
    per_stun: 5,
    per_stun_drain: 15,
    per_dawn_lit_lantern: 50,
    per_dawn_flame: 50
  }
};

// Standard Color Palette (Hex)
export const PALETTE = {
  nightSky: '#0E1430',
  fog: '#1B2350',
  grass: '#2F5D50',
  sand: '#C9B48A',
  wood: '#6B4A2F',
  seaOfClouds: '#12384A',
  litLantern: '#FFB347',
  lanternCore: '#FFE9B0',
  unlitLantern: '#5B5F6E',
  moteCore: '#FFF6C2',
  moteHalo: '#FFE58A',
  shadeBody: '#120A1A',
  shadeBorder: '#7A3CFF',
  shadeStunned: '#3A3450',
  mayTunic: '#E8E2D0',
  mayScarfAndCharm: '#C8102E',
  goldBorderScore: '#F2C14E',
  drifter: '#8FA3B8',
  dangerUI: '#FF5A5F',
  textUI: '#F5F1E6'
};

// Colorblind friendly palette (Ticket-03)
export const COLORBLIND_PALETTE = {
  ...PALETTE,
  shadeBorder: '#00B3FF',
  dangerUI: '#FFFFFF'
};

// --- MAP CONFIGURATIONS ---

// NIGHT 1: Đảo Bến
export const NIGHT1_CONFIG = {
  name: 'Đảo Bến',
  islandRadius: 40.0,
  duration_s: 240,
  startPos: [0.0, 0.0, 0.0],
  lanterns: [
    { id: 'L1', pos: [0.0, 0.0, 25.0], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L2', pos: [23.8, 0.0, 7.7], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L3', pos: [14.7, 0.0, -20.2], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L4', pos: [-14.7, 0.0, -20.2], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L5', pos: [-23.8, 0.0, 7.7], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 }
  ],
  moteSpawnPoints: (() => {
    const pts = [];
    // 8 points on R=12m (every 45°)
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 * Math.PI) / 180.0;
      pts.push([Number((12 * Math.cos(a)).toFixed(3)), 0.0, Number((12 * Math.sin(a)).toFixed(3))]);
    }
    // 16 points on R=33m (every 22.5°)
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5 * Math.PI) / 180.0;
      pts.push([Number((33 * Math.cos(a)).toFixed(3)), 0.0, Number((33 * Math.sin(a)).toFixed(3))]);
    }
    return pts;
  })(),
  shadeSpawnPoints: (() => {
    const pts = [];
    // 12 points on R=37m (15°, 45°, 75°, ...)
    for (let i = 0; i < 12; i++) {
      const a = ((15 + i * 30) * Math.PI) / 180.0;
      pts.push([Number((37 * Math.cos(a)).toFixed(3)), 0.0, Number((37 * Math.sin(a)).toFixed(3))]);
    }
    return pts;
  })(),
  maxShades: 6,
  shadeIntervalTicks: 480, // 8s
  charms: [],
  hasDrifters: false,
  hasWind: false
};

// NIGHT 2: Đảo Cau
export const NIGHT2_CONFIG = {
  name: 'Đảo Cau',
  islandA: { center: [0, 0, 0], radius: 28.0 },
  islandB: { center: [70, 0, 0], radius: 28.0 },
  bridge: { xMin: 26, xMax: 44, zMin: -2, zMax: 2 },
  duration_s: 270,
  startPos: [0.0, 0.0, 0.0],
  lanterns: [
    { id: 'L1', pos: [0, 0, 20], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L2', pos: [17, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L3', pos: [-17, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L4', pos: [70, 0, 20], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L5', pos: [87, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L6', pos: [53, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 }
  ],
  jumpPads: [
    { id: 'JP1', pos: [20, 0, 18], radius: 1.0, target: [70, 0, 0], vel_y: 14.0, speed_h: 24.0 },
    { id: 'JP2', pos: [50, 0, -18], radius: 1.0, target: [0, 0, 0], vel_y: 14.0, speed_h: 24.0 }
  ],
  moteSpawnPoints: (() => {
    const pts = [];
    const islands = [[0, 0, 0], [70, 0, 0]];
    for (const [cx, cy, cz] of islands) {
      // 4 points on R=10m (0, 90, 180, 270)
      for (let i = 0; i < 4; i++) {
        const a = (i * 90 * Math.PI) / 180.0;
        pts.push([Number((cx + 10 * Math.cos(a)).toFixed(3)), 0.0, Number((cz + 10 * Math.sin(a)).toFixed(3))]);
      }
      // 8 points on R=22m (every 45)
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 * Math.PI) / 180.0;
        pts.push([Number((cx + 22 * Math.cos(a)).toFixed(3)), 0.0, Number((cz + 22 * Math.sin(a)).toFixed(3))]);
      }
    }
    return pts;
  })(),
  shadeSpawnPoints: (() => {
    const pts = [];
    const islands = [[0, 0, 0], [70, 0, 0]];
    for (const [cx, cy, cz] of islands) {
      // 8 points on R=26m (22.5, 67.5, ...)
      for (let i = 0; i < 8; i++) {
        const a = ((22.5 + i * 45) * Math.PI) / 180.0;
        pts.push([Number((cx + 26 * Math.cos(a)).toFixed(3)), 0.0, Number((cz + 26 * Math.sin(a)).toFixed(3))]);
      }
    }
    return pts;
  })(),
  charms: [
    { id: 'C1', pos: [35, 0, 0] }
  ],
  maxShades: 8,
  shadeIntervalTicks: 420, // 7s
  hasDrifters: true,
  hasWind: false
};

// NIGHT 3: Đảo Chuông
export const NIGHT3_CONFIG = {
  name: 'Đảo Chuông',
  islandRadius: 45.0,
  duration_s: 300,
  startPos: [0.0, 0.0, 0.0],
  lanterns: [
    { id: 'L1', pos: [0, 6, 6], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L2', pos: [18, 3, 10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L3', pos: [-18, 3, 10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L4', pos: [35, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L5', pos: [-35, 0, -10], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L6', pos: [20, 0, -35], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 },
    { id: 'L7', pos: [-20, 0, -35], lit: false, deposited: 0, fuel: 0, ever_lit: false, relit_count: 0 }
  ],
  jumpPads: [
    { id: 'JP1', pos: [0, 3, 13], radius: 1.0, targetDir: [0, 0, -1], vel_y: 12.0, speed_h: 8.0 }
  ],
  bellTower: { center: [0, 6, 0], radius: 2.0, height: 8.0 },
  moteSpawnPoints: (() => {
    const pts = [];
    // Tier 0: 18 points on R=34m (every 20° from 0°)
    for (let i = 0; i < 18; i++) {
      const a = (i * 20 * Math.PI) / 180.0;
      pts.push([Number((34 * Math.cos(a)).toFixed(3)), 0.0, Number((34 * Math.sin(a)).toFixed(3))]);
    }
    // Tier 1: 8 points on R=18m (20°, 40°, ..., 160°)
    for (let i = 1; i <= 8; i++) {
      const a = (i * 20 * Math.PI) / 180.0;
      pts.push([Number((18 * Math.cos(a)).toFixed(3)), 3.0, Number((18 * Math.sin(a)).toFixed(3))]);
    }
    // Tier 2: 4 points on R=5m (45°, 135°, 225°, 315°)
    const t2Angles = [45, 135, 225, 315];
    for (const deg of t2Angles) {
      const a = (deg * Math.PI) / 180.0;
      pts.push([Number((5 * Math.cos(a)).toFixed(3)), 6.0, Number((5 * Math.sin(a)).toFixed(3))]);
    }
    return pts;
  })(),
  shadeSpawnPoints: (() => {
    const pts = [];
    // 16 points on R=43m (every 22.5°)
    for (let i = 0; i < 16; i++) {
      const a = (i * 22.5 * Math.PI) / 180.0;
      pts.push([Number((43 * Math.cos(a)).toFixed(3)), 0.0, Number((43 * Math.sin(a)).toFixed(3))]);
    }
    return pts;
  })(),
  charms: [
    { id: 'C1', pos: [30, 0, 25] },
    { id: 'C2', pos: [-30, 0, 25] }
  ],
  maxShades: 10,
  shadeIntervalTicks: 360, // 6s
  shadeSpeed: 4.5,
  hasDrifters: true,
  hasWind: true
};

export const MAPS = {
  1: NIGHT1_CONFIG,
  2: NIGHT2_CONFIG,
  3: NIGHT3_CONFIG
};
