#!/usr/bin/env node
/**
 * Soak Test Runner — Đảo Đèn Lồng (Test Contract v1.3)
 * Lệnh: node src/cli/soak.js --seed 7 --nights 10 --out soak.json
 */

import { spawnSync } from 'child_process';
import fs from 'fs';

// If --expose-gc is not enabled, re-launch with --expose-gc so memory measurement is clean
if (typeof global.gc !== 'function') {
  const result = spawnSync(process.execPath, ['--expose-gc', ...process.argv.slice(1)], {
    stdio: 'inherit'
  });
  process.exit(result.status ?? 0);
}

import { GameSimulation } from '../core/simulation.js';
import { PRNG } from '../core/prng.js';

// Parse command line arguments
const args = process.argv.slice(2);
let baseSeed = 7;
let totalNights = 10;
let outFile = 'soak.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seed' && args[i + 1] !== undefined) {
    baseSeed = parseInt(args[++i], 10);
  } else if (args[i] === '--nights' && args[i + 1] !== undefined) {
    totalNights = parseInt(args[++i], 10);
  } else if (args[i] === '--out' && args[i + 1] !== undefined) {
    outFile = args[++i];
  }
}

console.log(`\n==============================================`);
console.log(`🧪 BẮT ĐẦU SOAK TEST (${totalNights} ĐÊM LIÊN TIẾP)`);
console.log(`   Base Seed: ${baseSeed} | Output: ${outFile}`);
console.log(`==============================================\n`);

const startTime = Date.now();
const results = [];
let crashes = 0;
let memStartMb = null;

// Direction choices
const DIRECTIONS = [
  [0, 1],   // Up
  [0, -1],  // Down
  [-1, 0],  // Left
  [1, 0],   // Right
  [-1, 1],  // Up-Left
  [1, 1],   // Up-Right
  [-1, -1], // Down-Left
  [1, -1],  // Down-Right
  [0, 0]    // Stand still
];

for (let i = 0; i < totalNights; i++) {
  const nightNumber = (i % 3) + 1; // Đêm 1 -> 2 -> 3 xoay vòng
  const seed = baseSeed + i;
  console.log(`[Đêm ${i + 1}/${totalNights}] Bắt đầu Đêm ${nightNumber} (Seed: ${seed})...`);

  try {
    let sim = new GameSimulation({ seed, night: nightNumber });
    const rng = new PRNG(seed);

    if (i === 0) {
      if (global.gc) global.gc();
      // Memory RSS after first night loads
      memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    }

    let currentMove = [0, 0];
    const maxTicks = Math.round(sim.total_duration_s * 60) + 120; // safety ceiling

    while (sim.state === 'playing' && sim.tick < maxTicks) {
      // Mỗi 30 tick chọn lại hướng di chuyển
      if (sim.tick % 30 === 0) {
        const dirIdx = Math.floor(rng.next() * DIRECTIONS.length);
        currentMove = DIRECTIONS[dirIdx];
      }

      // Xác suất mỗi tick: 5% nhảy, 3% lướt, 2% tỏa sáng, 10% tương tác
      const doJump = rng.next() < 0.05;
      const doDash = rng.next() < 0.03;
      const doPulse = rng.next() < 0.02;
      const doInteract = rng.next() < 0.10;

      sim.step({
        move: currentMove,
        cam_yaw_deg: 0,
        jump: doJump,
        dash: doDash,
        pulse: doPulse,
        interact: doInteract
      });
    }

    const outcome = sim.state === 'won' ? 'won' : 'lost';
    results.push(outcome);
    console.log(`   -> Kết quả: ${outcome.toUpperCase()} tại tick ${sim.tick} (Điểm: ${sim.score})`);

    // Dereference to allow GC
    sim = null;
    if (global.gc) global.gc();

  } catch (err) {
    crashes++;
    results.push('crash');
    console.error(`   ❌ LỖI CRASH tại đêm ${i + 1}:`, err.message);
  }
}

// Memory RSS after last night resets
if (global.gc) global.gc();
const memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
const durationSec = Number(((Date.now() - startTime) / 1000).toFixed(1));

const soakOutput = {
  nights: totalNights,
  crashes: crashes,
  results: results,
  mem_start_mb: memStartMb || memEndMb,
  mem_end_mb: memEndMb,
  duration_s: durationSec
};

// Write output JSON
fs.writeFileSync(outFile, JSON.stringify(soakOutput, null, 2), 'utf-8');

console.log(`\n==============================================`);
console.log(`✅ SOAK TEST HOÀN TẤT`);
console.log(`   Số đêm chạy: ${soakOutput.nights}`);
console.log(`   Crashes:     ${soakOutput.crashes}`);
console.log(`   Kết quả:     [${soakOutput.results.join(', ')}]`);
console.log(`   Bộ nhớ:      ${soakOutput.mem_start_mb} MB -> ${soakOutput.mem_end_mb} MB (Tỉ lệ: ${(soakOutput.mem_end_mb / soakOutput.mem_start_mb).toFixed(2)}x)`);
console.log(`   Thời gian:   ${soakOutput.duration_s}s`);
console.log(`   Đã ghi vào:  ${outFile}`);
console.log(`==============================================\n`);

// Check pass thresholds
const memRatio = soakOutput.mem_end_mb / (soakOutput.mem_start_mb || 1);
if (crashes === 0 && memRatio <= 1.2) {
  console.log(`🎉 ĐẠT CHUẨN SOAK TEST (Crashes = 0, MemRatio <= 1.2)`);
  process.exit(0);
} else {
  console.error(`⚠️ CHƯA ĐẠT CHUẨN: crashes=${crashes}, memRatio=${memRatio.toFixed(2)}`);
  process.exit(1);
}
