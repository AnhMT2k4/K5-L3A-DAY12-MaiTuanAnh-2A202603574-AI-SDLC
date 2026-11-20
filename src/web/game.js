import * as THREE from './vendor/three.module.js';
import { GameSimulation } from '../core/simulation.js';
import { ISLAND_RADIUS } from '../core/constants.js';
import { sound } from './audio.js';

// DOM elements
const canvas = document.getElementById('game-canvas');
const flamesEl = document.getElementById('flames-container');
const carriedEl = document.getElementById('carried-display');
const lanternsEl = document.getElementById('lanterns-display');
const timeEl = document.getElementById('time-display');
const scoreEl = document.getElementById('score-display');
const promptEl = document.getElementById('prompt-banner');
const modalEl = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const finalScoreEl = document.getElementById('final-score');
const btnRestart = document.getElementById('btn-restart');

// Three.js setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060714);
scene.fog = new THREE.FogExp2(0x0a0c20, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Lighting
const ambientLight = new THREE.AmbientLight(0x242845, 1.2);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x6b8cce, 1.0);
moonLight.position.set(40, 60, -40);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
scene.add(moonLight);

// Environment: Sea of Clouds
const cloudGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
const cloudMat = new THREE.MeshBasicMaterial({
  color: 0x121630,
  transparent: true,
  opacity: 0.8
});
const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
cloudMesh.rotation.x = -Math.PI / 2;
cloudMesh.position.y = -3.0;
scene.add(cloudMesh);

// Island Mesh
const islandGeo = new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 4, 3, 48);
const islandMat = new THREE.MeshStandardMaterial({
  color: 0x1d3326,
  roughness: 0.85,
  metalness: 0.1
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandMesh.position.y = -1.5;
islandMesh.receiveShadow = true;
scene.add(islandMesh);

// Pier
const pierGeo = new THREE.BoxGeometry(8, 0.8, 18);
const pierMat = new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 0.9 });
const pierMesh = new THREE.Mesh(pierGeo, pierMat);
pierMesh.position.set(0, -0.4, ISLAND_RADIUS + 4);
pierMesh.receiveShadow = true;
scene.add(pierMesh);

// Player 3D Representation (Mây with Nón Lá and small lantern)
const playerGroup = new THREE.Group();

// Body
const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.55;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

// Head
const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.6 });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.35;
headMesh.castShadow = true;
playerGroup.add(headMesh);

// Nón Lá (Conical Hat)
const hatGeo = new THREE.ConeGeometry(0.75, 0.35, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
const hatMesh = new THREE.Mesh(hatGeo, hatMat);
hatMesh.position.y = 1.6;
hatMesh.castShadow = true;
playerGroup.add(hatMesh);

// Small Lantern hanging from hat
const smallLanternGeo = new THREE.BoxGeometry(0.18, 0.25, 0.18);
const smallLanternMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
const smallLanternMesh = new THREE.Mesh(smallLanternGeo, smallLanternMat);
smallLanternMesh.position.set(0.35, 1.25, 0.35);
playerGroup.add(smallLanternMesh);

const playerPointLight = new THREE.PointLight(0xffaa22, 1.5, 6);
playerPointLight.position.set(0.35, 1.25, 0.35);
playerGroup.add(playerPointLight);

scene.add(playerGroup);

// Game Simulation instance
let sim = new GameSimulation({ seed: Date.now() });

// 3D Objects Maps
const lanternMeshes = new Map();
const moteMeshes = new Map();
const shadeMeshes = new Map();

// Build 5 Big Lanterns in 3D
sim.lanterns.forEach(l => {
  const lGroup = new THREE.Group();
  lGroup.position.set(l.pos[0], l.pos[1], l.pos[2]);

  // Stone base
  const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.3;
  baseMesh.castShadow = true;
  lGroup.add(baseMesh);

  // Pillar
  const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const poleMesh = new THREE.Mesh(poleGeo, poleMat);
  poleMesh.position.y = 1.6;
  poleMesh.castShadow = true;
  lGroup.add(poleMesh);

  // Lantern chamber
  const chamberGeo = new THREE.CylinderGeometry(0.65, 0.5, 1.0, 6);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: 0x221105,
    roughness: 0.4,
    transparent: true,
    opacity: 0.85
  });
  const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
  chamberMesh.position.y = 3.2;
  lGroup.add(chamberMesh);

  // Lantern light source
  const pLight = new THREE.PointLight(0xff9900, 0, 15);
  pLight.position.set(0, 3.2, 0);
  lGroup.add(pLight);

  scene.add(lGroup);
  lanternMeshes.set(l.id, { group: lGroup, light: pLight, chamber: chamberMesh });
});

// Pulse visual wave mesh
const pulseGeo = new THREE.RingGeometry(0.1, 0.3, 32);
const pulseMat = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0
});
const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
pulseRing.rotation.x = -Math.PI / 2;
scene.add(pulseRing);
let pulseAnim = 0;

// Input tracking for visual game
const keys = {};
let camYaw = 0;
let camPitch = 0.35;
let isMouseDown = false;
let mouseX = 0, mouseY = 0;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'KeyE', 'KeyF', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

window.addEventListener('mousedown', e => {
  isMouseDown = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mouseup', () => isMouseDown = false);
window.addEventListener('mousemove', e => {
  if (isMouseDown) {
    const dx = e.clientX - mouseX;
    const dy = e.clientY - mouseY;
    camYaw -= dx * 0.005;
    camPitch = Math.max(0.1, Math.min(1.2, camPitch + dy * 0.005));
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

btnRestart.addEventListener('click', () => {
  modalEl.classList.add('hidden');
  sim = new GameSimulation({ seed: Date.now() });
});

// Update Motes Meshes
function updateMotesVisual() {
  for (const m of sim.motes) {
    let mesh = moteMeshes.get(m.id);
    if (!mesh && m.active) {
      const geo = new THREE.SphereGeometry(0.2, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(m.pos[0], 0.6, m.pos[2]);
      scene.add(mesh);
      moteMeshes.set(m.id, mesh);
    }
    if (mesh) {
      if (!m.active) {
        scene.remove(mesh);
        moteMeshes.delete(m.id);
      } else {
        mesh.position.y = 0.6 + Math.sin(Date.now() * 0.004 + m.pos[0]) * 0.15;
      }
    }
  }
}

// Update Shades Meshes
function updateShadesVisual() {
  for (const s of sim.shades) {
    let mesh = shadeMeshes.get(s.id);
    if (!mesh) {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.65, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x240046,
        roughness: 0.3,
        emissive: 0x10002b
      });
      const orb = new THREE.Mesh(geo, mat);
      orb.position.y = 0.8;
      group.add(orb);

      scene.add(group);
      mesh = group;
      shadeMeshes.set(s.id, mesh);
    }
    mesh.position.set(s.pos[0], 0, s.pos[2]);
    if (s.state === 'stunned') {
      mesh.children[0].material.color.setHex(0x5a189a);
    } else {
      mesh.children[0].material.color.setHex(0x10002b);
    }
  }
}

// Update Lanterns Visual
function updateLanternsVisual() {
  for (const l of sim.lanterns) {
    const item = lanternMeshes.get(l.id);
    if (item) {
      if (l.lit) {
        item.light.intensity = 3.5;
        item.chamber.material.color.setHex(0xffaa00);
        item.chamber.material.emissive = new THREE.Color(0xff8800);
      } else {
        item.light.intensity = 0;
        item.chamber.material.color.setHex(0x221105);
        item.chamber.material.emissive = new THREE.Color(0x000000);
      }
    }
  }
}

// Game Loop
let lastTime = performance.now();
function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  if (sim.state === 'playing') {
    // Collect keyboard inputs
    let moveX = 0;
    let moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;

    const deg = (camYaw * 180 / Math.PI);
    sim.currentInput.move = [moveX, moveZ];
    sim.currentInput.cam_yaw_deg = deg;
    sim.currentInput.jump = Boolean(keys['Space']);
    sim.currentInput.interact = Boolean(keys['KeyF'] || keys['Enter']);
    sim.currentInput.pulse = Boolean(keys['KeyE']);

    const events = sim.step();

    // Sound and visual effects for events
    for (const ev of events) {
      if (ev.name === 'mote_picked') sound.playMotePickup();
      if (ev.name === 'deposit') sound.playDeposit();
      if (ev.name === 'lantern_lit') sound.playLanternLit();
      if (ev.name === 'player_hit') sound.playHit();
      if (ev.name === 'pulse') {
        sound.playPulse();
        pulseAnim = 1.0;
        pulseRing.position.set(sim.player.pos[0], 0.05, sim.player.pos[2]);
      }
    }

    // Reset single-frame keys
    keys['KeyF'] = false;
    keys['KeyE'] = false;
    keys['Space'] = false;
    keys['Enter'] = false;
  }

  // Update visual entities
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);
  if (sim.currentInput.move[0] !== 0 || sim.currentInput.move[1] !== 0) {
    const targetRot = camYaw - Math.atan2(sim.currentInput.move[0], sim.currentInput.move[1]);
    playerGroup.rotation.y = targetRot;
  }

  // Camera follow
  const camDist = 7.0;
  const camHeight = Math.sin(camPitch) * camDist;
  const camHRadius = Math.cos(camPitch) * camDist;
  camera.position.x = sim.player.pos[0] - Math.sin(camYaw) * camHRadius;
  camera.position.z = sim.player.pos[2] - Math.cos(camYaw) * camHRadius;
  camera.position.y = sim.player.pos[1] + camHeight + 1.2;
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  // Pulse animation
  if (pulseAnim > 0) {
    pulseAnim -= delta * 2.5;
    const curR = (1.0 - pulseAnim) * sim.tuning.pulse_radius;
    pulseRing.scale.set(curR, curR, 1);
    pulseMat.opacity = pulseAnim;
  } else {
    pulseMat.opacity = 0;
  }

  updateMotesVisual();
  updateShadesVisual();
  updateLanternsVisual();

  // Update HUD
  flamesEl.textContent = '🔥'.repeat(Math.max(0, sim.player.flames)) || '💀';
  carriedEl.textContent = `✨ ${sim.player.carried} / ${sim.tuning.carry_capacity}`;
  lanternsEl.textContent = `🏮 ${sim.lanterns.filter(l => l.lit).length} / ${sim.lanterns.length}`;
  timeEl.textContent = `⏱️ ${Math.ceil(sim.time_left_s)}s`;
  scoreEl.textContent = `⭐ ${sim.score}`;

  // Check near unlit lantern for prompt
  const nearLantern = sim.lanterns.some(
    l => !l.lit && Math.hypot(l.pos[0] - sim.player.pos[0], l.pos[2] - sim.player.pos[2]) <= sim.tuning.interact_radius
  );
  if (nearLantern && sim.player.carried > 0) {
    promptEl.classList.remove('hidden');
  } else {
    promptEl.classList.add('hidden');
  }

  // Game over modal
  if (sim.state !== 'playing' && modalEl.classList.contains('hidden')) {
    modalEl.classList.remove('hidden');
    finalScoreEl.textContent = sim.score;
    if (sim.state === 'won') {
      modalTitle.textContent = 'CHIẾN THẮNG!';
      modalTitle.style.color = '#ffaa00';
      modalDesc.textContent = 'Bạn đã thắp sáng toàn bộ Đèn Lồng Lớn trên Đảo Bến, xua tan sương đen!';
    } else {
      modalTitle.textContent = 'THẤT BẠI!';
      modalTitle.style.color = '#ef4444';
      modalDesc.textContent = 'Ngọn lửa đã tàn hoặc bình minh đã lên trước khi đảo được thắp sáng.';
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
