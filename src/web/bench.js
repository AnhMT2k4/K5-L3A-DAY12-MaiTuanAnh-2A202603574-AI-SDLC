import * as THREE from './vendor/three.module.js';
import { PRNG } from './core/prng.js';
import { PALETTE } from './core/constants.js';

// Parse query parameters
const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '42', 10);
const durationSec = parseFloat(params.get('duration') || '30');

const statusEl = document.getElementById('bench-status');
const fpsEl = document.getElementById('bench-fps');
const canvas = document.getElementById('bench-canvas');

const startTimeProcess = performance.now();
let firstFrameTime = null;

// Setup Three.js WebGLRenderer (1280x720)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.nightSky);
scene.fog = new THREE.FogExp2(PALETTE.fog, 0.007);

const camera = new THREE.PerspectiveCamera(60, 1280 / 720, 0.1, 1000);

// Global Lighting (Full Night 1 Lighting)
const hemiLight = new THREE.HemisphereLight(0x7090d0, 0x1a2e1d, 1.4);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x4a5b88, 0.45);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xa5c4f5, 1.6);
moonLight.position.set(40, 80, -30);
moonLight.castShadow = true;
scene.add(moonLight);

// Island Terrain (Đêm 1: Đảo Bến)
const grassMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.grass), roughness: 0.85 });
const islandGeo = new THREE.CylinderGeometry(40, 42, 3, 64);
const islandMesh = new THREE.Mesh(islandGeo, grassMat);
islandMesh.position.y = -1.5;
islandMesh.receiveShadow = true;
scene.add(islandMesh);

// Sea of Clouds
const cloudGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
const cloudMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.seaOfClouds), transparent: true, opacity: 0.85 });
const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
cloudMesh.rotation.x = -Math.PI / 2;
cloudMesh.position.y = -2.5;
scene.add(cloudMesh);

// Mây Character at (0, 0, 0) - stands still
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, 0);

const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.55;
playerGroup.add(bodyMesh);

const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.5 });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.35;
playerGroup.add(headMesh);

const hatGeo = new THREE.ConeGeometry(0.8, 0.35, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.7 });
const hatMesh = new THREE.Mesh(hatGeo, hatMat);
hatMesh.position.y = 1.62;
playerGroup.add(hatMesh);

scene.add(playerGroup);

// 3 Lanterns L1-L3 lit with fuel 100
const lanternPositions = [
  [0.0, 0.0, 25.0],
  [23.8, 0.0, 7.7],
  [14.7, 0.0, -20.2]
];

lanternPositions.forEach((pos) => {
  const lGroup = new THREE.Group();
  lGroup.position.set(pos[0], pos[1], pos[2]);

  const baseGeo = new THREE.CylinderGeometry(0.9, 1.2, 0.7, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.35;
  lGroup.add(baseMesh);

  const chamberGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.1, 6);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.litLantern),
    emissive: new THREE.Color(PALETTE.litLantern),
    emissiveIntensity: 1.0
  });
  const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
  chamberMesh.position.y = 3.3;
  lGroup.add(chamberMesh);

  const pLight = new THREE.PointLight(new THREE.Color(PALETTE.litLantern), 4.5, 22);
  pLight.position.set(0, 3.3, 0);
  lGroup.add(pLight);

  scene.add(lGroup);
});

// Seed PRNG
const rng = new PRNG(seed);

// Sinh đúng 100 đom đóm rải đều
const motes = [];
for (let i = 0; i < 100; i++) {
  const r = Math.sqrt(rng.next()) * 36;
  const th = rng.next() * Math.PI * 2;
  const x = r * Math.cos(th);
  const z = r * Math.sin(th);

  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.25, 10, 10);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.moteCore) });
  group.add(new THREE.Mesh(geo, mat));

  const light = new THREE.PointLight(new THREE.Color(PALETTE.moteHalo), 0.8, 4);
  group.add(light);

  group.position.set(x, 0.6, z);
  scene.add(group);
  motes.push(group);
}

// Sinh đúng 200 Bóng Mực ở trạng thái wander rải đều
const shades = [];
for (let i = 0; i < 200; i++) {
  const r = Math.sqrt(rng.next()) * 38;
  const th = rng.next() * Math.PI * 2;
  const x = r * Math.cos(th);
  const z = r * Math.sin(th);

  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.65, 12, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.shadeBody),
    roughness: 0.3,
    emissive: new THREE.Color(PALETTE.shadeBorder),
    emissiveIntensity: 0.3
  });
  const orb = new THREE.Mesh(geo, mat);
  orb.position.y = 0.8;
  group.add(orb);

  group.position.set(x, 0, z);
  scene.add(group);

  shades.push({
    mesh: group,
    angle: rng.next() * Math.PI * 2,
    speed: 4.0
  });
}

// Benchmark Timing & Collection
const WARMUP_SEC = 3.0;
let phase = 'warmup'; // 'warmup' | 'measuring' | 'done'
let phaseStartTime = 0;
const frameDts = []; // in ms

function updateCamera(elapsedSec) {
  // Camera orbits (0,0,0), radius 30m, height 15m, looks at (0,0,0)
  // Starts at (30, 15, 0) at angle 0
  // CCW viewed from above: angle = elapsedSec * (2*pi / 15)
  const angle = (elapsedSec * (2 * Math.PI / 15.0));
  const cx = 30.0 * Math.cos(angle);
  const cz = 30.0 * Math.sin(angle);
  camera.position.set(cx, 15.0, cz);
  camera.lookAt(0, 0, 0);
}

let lastTimestamp = performance.now();

function benchLoop(currentTimestamp) {
  if (firstFrameTime === null) {
    firstFrameTime = currentTimestamp;
  }

  const dtMs = currentTimestamp - lastTimestamp;
  lastTimestamp = currentTimestamp;
  const dtSec = Math.min(0.1, dtMs / 1000);

  const totalRunSec = (currentTimestamp - firstFrameTime) / 1000;

  // Move shades in wander
  for (const s of shades) {
    s.angle += (rng.next() - 0.5) * 0.1;
    s.mesh.position.x += Math.cos(s.angle) * s.speed * dtSec;
    s.mesh.position.z += Math.sin(s.angle) * s.speed * dtSec;

    // Keep on island R <= 39
    const d = Math.hypot(s.mesh.position.x, s.mesh.position.z);
    if (d > 39) {
      s.mesh.position.x = (s.mesh.position.x / d) * 38.5;
      s.mesh.position.z = (s.mesh.position.z / d) * 38.5;
      s.angle += Math.PI;
    }
  }

  // Orbit camera
  updateCamera(totalRunSec);

  // Render frame
  renderer.render(scene, camera);

  // Benchmark state management
  if (phase === 'warmup') {
    statusEl.textContent = `Khởi động (Warmup): ${(WARMUP_SEC - totalRunSec).toFixed(1)}s`;
    fpsEl.textContent = `FPS hiện tại: ${(1000 / dtMs).toFixed(1)}`;

    if (totalRunSec >= WARMUP_SEC) {
      phase = 'measuring';
      phaseStartTime = performance.now();
    }
  } else if (phase === 'measuring') {
    frameDts.push(dtMs);
    const measuredSec = (currentTimestamp - phaseStartTime) / 1000;
    statusEl.textContent = `Đang đo hiệu năng: ${measuredSec.toFixed(1)}s / ${durationSec}s`;
    fpsEl.textContent = `Khung hình: ${frameDts.length} | FPS tức thời: ${(1000 / dtMs).toFixed(1)}`;

    if (measuredSec >= durationSec) {
      phase = 'done';
      finishBenchmark();
      return;
    }
  }

  requestAnimationFrame(benchLoop);
}

function finishBenchmark() {
  statusEl.textContent = 'Đã hoàn tất đo đạc! Đang xuất dữ liệu...';
  const N = frameDts.length;
  const sumDt = frameDts.reduce((a, b) => a + b, 0);
  const avgFps = Number((1000 * N / sumDt).toFixed(1));

  // Sort dt ascending
  const sortedDts = [...frameDts].sort((a, b) => a - b);

  // p1_low_fps: k = max(1, ceil(0.01 * N)); average of k largest dt values
  const k = Math.max(1, Math.ceil(0.01 * N));
  const largestK = sortedDts.slice(N - k);
  const avgLargestK = largestK.reduce((a, b) => a + b, 0) / k;
  const p1LowFps = Number((1000 / avgLargestK).toFixed(1));

  // frame_ms_p95: 95th percentile
  const p95Idx = Math.floor(0.95 * N);
  const frameMsP95 = Number((sortedDts[p95Idx]).toFixed(1));

  const loadMs = Math.round(firstFrameTime - startTimeProcess);

  // peak_mem_mb from performance.memory if supported
  let peakMemMb = null;
  if (window.performance && window.performance.memory) {
    peakMemMb = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
  }

  const result = {
    contract_version: '1.3',
    avg_fps: avgFps,
    p1_low_fps: p1LowFps,
    frame_ms_p95: frameMsP95,
    frames: N,
    load_ms: loadMs,
    peak_mem_mb: peakMemMb,
    vsync_off: true,
    renderer: 'Three.js r170 (WebGL)',
    os: navigator.userAgent
  };

  console.log('BENCHMARK RESULT:', result);
  statusEl.textContent = `Hoàn tất: Avg FPS = ${avgFps}, 1% Low = ${p1LowFps}`;

  // Send result back to CLI server
  fetch('/api/bench-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  }).then(() => {
    console.log('Result sent successfully');
    setTimeout(() => {
      window.close();
    }, 1500);
  }).catch(err => {
    console.error('Failed to post result:', err);
  });
}

requestAnimationFrame(benchLoop);
