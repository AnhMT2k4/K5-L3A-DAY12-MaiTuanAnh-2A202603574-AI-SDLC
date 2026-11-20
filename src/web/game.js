import * as THREE from './vendor/three.module.js';
import { GameSimulation } from './core/simulation.js';
import { MAPS, PALETTE, COLORBLIND_PALETTE, DEFAULT_TUNING } from './core/constants.js';
import { sound } from './audio.js';

console.log('🏮 Initializing Đảo Đèn Lồng 3D Web Engine (Phase 3 - Contract v1.2: Đèn cạn dầu)...');

// Colorblind state
let isColorblind = localStorage.getItem('colorblind_mode') === 'true';
function getActivePalette() {
  return isColorblind ? COLORBLIND_PALETTE : PALETTE;
}

// DOM elements
const canvas = document.getElementById('game-canvas');
const flamesEl = document.getElementById('flames-container');
const carriedEl = document.getElementById('carried-display');
const lanternsEl = document.getElementById('lanterns-display');
const timeEl = document.getElementById('time-display');
const scoreEl = document.getElementById('score-display');
const windCard = document.getElementById('wind-card');
const windDisplay = document.getElementById('wind-display');
const promptEl = document.getElementById('prompt-banner');

// Skill Cooldowns
const dashBadge = document.getElementById('dash-badge');
const dashCdVal = document.getElementById('dash-cd-val');
const pulseBadge = document.getElementById('pulse-badge');
const pulseCdVal = document.getElementById('pulse-cd-val');
const charmIndicator = document.getElementById('charm-indicator');
const charmTimerVal = document.getElementById('charm-timer-val');

// Modals & Controls
const pauseModal = document.getElementById('pause-modal');
const btnResume = document.getElementById('btn-resume');
const btnPauseRestart = document.getElementById('btn-pause-restart');
const btnPauseToggle = document.getElementById('btn-pause-toggle');
const btnColorblindToggle = document.getElementById('btn-colorblind-toggle');

const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const finalScoreEl = document.getElementById('final-score');
const btnRestart = document.getElementById('btn-restart');
const btnNextNight = document.getElementById('btn-next-night');
const nightButtons = document.querySelectorAll('.btn-night');

// Sync Colorblind mode on document
function applyColorblindClass() {
  if (isColorblind) {
    document.body.classList.add('colorblind');
    btnColorblindToggle.textContent = '👁️ Bảng màu dễ phân biệt: Bật';
    btnColorblindToggle.classList.add('active');
  } else {
    document.body.classList.remove('colorblind');
    btnColorblindToggle.textContent = '👁️ Bảng màu dễ phân biệt: Tắt';
    btnColorblindToggle.classList.remove('active');
  }
}
applyColorblindClass();

btnColorblindToggle.addEventListener('click', () => {
  isColorblind = !isColorblind;
  localStorage.setItem('colorblind_mode', isColorblind ? 'true' : 'false');
  applyColorblindClass();
  // Refresh shade colors
  for (const [id, mesh] of shadeMeshes.entries()) {
    const s = sim.shades.find(item => item.id === id);
    if (s && mesh) {
      const pal = getActivePalette();
      if (s.state === 'stunned') {
        mesh.orb.material.color.set(pal.shadeStunned);
      } else {
        mesh.orb.material.color.set(pal.shadeBody);
      }
      mesh.orb.material.emissive.set(pal.shadeBorder);
      mesh.eye1.material.color.set(pal.shadeBorder);
      mesh.eye2.material.color.set(pal.shadeBorder);
    }
  }
});

// Setup Canvas & Renderer
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (e) {
  console.warn('WebGL with antialias failed, falling back:', e);
  renderer = new THREE.WebGLRenderer({ canvas });
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

try {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
} catch (e) {
  console.warn('Shadow map disabled:', e);
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.nightSky);
scene.fog = new THREE.FogExp2(PALETTE.fog, 0.007);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Global Lighting
const hemiLight = new THREE.HemisphereLight(0x7090d0, 0x1a2e1d, 1.4);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0x4a5b88, 0.15);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xa5c4f5, 1.6);
moonLight.position.set(40, 80, -30);
moonLight.castShadow = true;
scene.add(moonLight);

// Environment: Sea of Clouds below
const cloudGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
const cloudMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(PALETTE.seaOfClouds),
  transparent: true,
  opacity: 0.85
});
const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
cloudMesh.rotation.x = -Math.PI / 2;
cloudMesh.position.y = -2.5;
scene.add(cloudMesh);

// Player 3D Character: Mây
const playerGroup = new THREE.Group();

const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.55;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

const scarfGeo = new THREE.TorusGeometry(0.38, 0.1, 8, 20);
const scarfMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.mayScarfAndCharm), roughness: 0.5 });
const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
scarfMesh.rotation.x = Math.PI / 2;
scarfMesh.position.y = 1.1;
playerGroup.add(scarfMesh);

const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.5 });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.35;
headMesh.castShadow = true;
playerGroup.add(headMesh);

const hatGeo = new THREE.ConeGeometry(0.8, 0.35, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.7 });
const hatMesh = new THREE.Mesh(hatGeo, hatMat);
hatMesh.position.y = 1.62;
hatMesh.castShadow = true;
playerGroup.add(hatMesh);

const smallLanternGroup = new THREE.Group();
smallLanternGroup.position.set(0.42, 1.25, 0.42);

const smallLanternGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8);
const smallLanternMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.litLantern) });
const smallLanternMesh = new THREE.Mesh(smallLanternGeo, smallLanternMat);
smallLanternGroup.add(smallLanternMesh);

const playerPointLight = new THREE.PointLight(new THREE.Color(PALETTE.litLantern), 3.0, 12);
playerPointLight.castShadow = true;
smallLanternGroup.add(playerPointLight);

playerGroup.add(smallLanternGroup);
scene.add(playerGroup);

// Pulse visual wave mesh
const pulseGeo = new THREE.RingGeometry(0.1, 0.4, 32);
const pulseMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(PALETTE.litLantern),
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0
});
const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
pulseRing.rotation.x = -Math.PI / 2;
scene.add(pulseRing);
let pulseAnim = 0;

// Dash visual trail
const dashAuraGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 16, 1, true);
const dashAuraMat = new THREE.MeshBasicMaterial({
  color: 0x67e8f9,
  transparent: true,
  opacity: 0,
  side: THREE.DoubleSide
});
const dashAuraMesh = new THREE.Mesh(dashAuraGeo, dashAuraMat);
dashAuraMesh.position.y = 0.7;
playerGroup.add(dashAuraMesh);

// Current Game State
let currentNight = 1;
let sim = new GameSimulation({ seed: Date.now(), night: currentNight });

let terrainObjects = [];
const lanternMeshes = new Map();
const moteMeshes = new Map();
const shadeMeshes = new Map();
const drifterMeshes = new Map();
const charmMeshes = new Map();
const jumpPadMeshes = new Map();

// Build Terrain for Night
function buildTerrain(night) {
  for (const obj of terrainObjects) scene.remove(obj);
  terrainObjects = [];

  const grassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.grass),
    roughness: 0.85,
    metalness: 0.05
  });

  const cliffMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.fog),
    roughness: 0.95
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.wood),
    roughness: 0.8
  });

  if (night === 1) {
    const islandGeo = new THREE.CylinderGeometry(40, 42, 3, 64);
    const islandMesh = new THREE.Mesh(islandGeo, grassMat);
    islandMesh.position.y = -1.5;
    islandMesh.receiveShadow = true;
    scene.add(islandMesh);
    terrainObjects.push(islandMesh);

    const pierGeo = new THREE.BoxGeometry(8, 0.6, 16);
    const pierMesh = new THREE.Mesh(pierGeo, woodMat);
    pierMesh.position.set(0, -0.3, 44);
    pierMesh.receiveShadow = true;
    scene.add(pierMesh);
    terrainObjects.push(pierMesh);

  } else if (night === 2) {
    const islandAGeo = new THREE.CylinderGeometry(28, 30, 3, 48);
    const islandAMesh = new THREE.Mesh(islandAGeo, grassMat);
    islandAMesh.position.set(0, -1.5, 0);
    islandAMesh.receiveShadow = true;
    scene.add(islandAMesh);
    terrainObjects.push(islandAMesh);

    const islandBGeo = new THREE.CylinderGeometry(28, 30, 3, 48);
    const islandBMesh = new THREE.Mesh(islandBGeo, grassMat);
    islandBMesh.position.set(70, -1.5, 0);
    islandBMesh.receiveShadow = true;
    scene.add(islandBMesh);
    terrainObjects.push(islandBMesh);

    const bridgeGeo = new THREE.BoxGeometry(18, 0.5, 4);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, woodMat);
    bridgeMesh.position.set(35, -0.25, 0);
    bridgeMesh.receiveShadow = true;
    scene.add(bridgeMesh);
    terrainObjects.push(bridgeMesh);

  } else if (night === 3) {
    const baseGeo = new THREE.CylinderGeometry(45, 47, 3, 64);
    const baseMesh = new THREE.Mesh(baseGeo, grassMat);
    baseMesh.position.y = -1.5;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    terrainObjects.push(baseMesh);

    const tier1Geo = new THREE.CylinderGeometry(22, 23, 3, 48);
    const tier1Mesh = new THREE.Mesh(tier1Geo, grassMat);
    tier1Mesh.position.set(0, 1.5, 8);
    tier1Mesh.receiveShadow = true;
    scene.add(tier1Mesh);
    terrainObjects.push(tier1Mesh);

    const tier2Geo = new THREE.CylinderGeometry(8, 9, 3, 32);
    const tier2Mesh = new THREE.Mesh(tier2Geo, grassMat);
    tier2Mesh.position.set(0, 4.5, 0);
    tier2Mesh.receiveShadow = true;
    scene.add(tier2Mesh);
    terrainObjects.push(tier2Mesh);

    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 6, 0);

    const tBaseGeo = new THREE.BoxGeometry(3.5, 1, 3.5);
    const tBaseMesh = new THREE.Mesh(tBaseGeo, woodMat);
    towerGroup.add(tBaseMesh);

    const tPillarGeo = new THREE.CylinderGeometry(0.2, 0.25, 6, 8);
    for (const [px, pz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      const pMesh = new THREE.Mesh(tPillarGeo, woodMat);
      pMesh.position.set(px, 3, pz);
      towerGroup.add(pMesh);
    }

    const tRoofGeo = new THREE.ConeGeometry(3.2, 1.4, 4);
    const tRoofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const tRoofMesh = new THREE.Mesh(tRoofGeo, tRoofMat);
    tRoofMesh.position.y = 6.7;
    tRoofMesh.rotation.y = Math.PI / 4;
    towerGroup.add(tRoofMesh);

    const bellGeo = new THREE.CylinderGeometry(0.7, 1.0, 1.6, 16);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.3 });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.y = 3.6;
    towerGroup.add(bellMesh);

    scene.add(towerGroup);
    terrainObjects.push(towerGroup);
  }
}

// Build 3D Big Lanterns with 3D Fuel Bar (Phase 3)
function initLanternsVisual() {
  for (const item of lanternMeshes.values()) {
    scene.remove(item.group);
  }
  lanternMeshes.clear();

  sim.lanterns.forEach(l => {
    const lGroup = new THREE.Group();
    lGroup.position.set(l.pos[0], l.pos[1], l.pos[2]);

    // Stone base pedestal
    const baseGeo = new THREE.CylinderGeometry(0.9, 1.2, 0.7, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.35;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    lGroup.add(baseMesh);

    // Wooden pillar
    const poleGeo = new THREE.CylinderGeometry(0.25, 0.3, 2.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.y = 1.7;
    poleMesh.castShadow = true;
    lGroup.add(poleMesh);

    // Lantern chamber
    const chamberGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.1, 6);
    const chamberMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE.unlitLantern),
      roughness: 0.4,
      transparent: true,
      opacity: 0.9
    });
    const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
    chamberMesh.position.y = 3.3;
    lGroup.add(chamberMesh);

    // Pagoda roof
    const roofGeo = new THREE.ConeGeometry(1.1, 0.5, 6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = 4.1;
    roofMesh.castShadow = true;
    lGroup.add(roofMesh);

    // Point light for lit state
    const pLight = new THREE.PointLight(new THREE.Color(PALETTE.litLantern), 0, 22);
    pLight.position.set(0, 3.3, 0);
    lGroup.add(pLight);

    // 3D Fuel Bar above the lantern
    const barGroup = new THREE.Group();
    barGroup.position.set(0, 4.8, 0);

    const barBgGeo = new THREE.BoxGeometry(1.4, 0.18, 0.18);
    const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const barBgMesh = new THREE.Mesh(barBgGeo, barBgMat);
    barGroup.add(barBgMesh);

    const barFillGeo = new THREE.BoxGeometry(1.36, 0.14, 0.2);
    const barFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const barFillMesh = new THREE.Mesh(barFillGeo, barFillMat);
    barGroup.add(barFillMesh);

    barGroup.visible = false;
    lGroup.add(barGroup);

    scene.add(lGroup);
    lanternMeshes.set(l.id, {
      group: lGroup,
      light: pLight,
      chamber: chamberMesh,
      barGroup,
      barFill: barFillMesh,
      barFillMat
    });
  });
}

// Build 3D Jump Pads
function initJumpPadsVisual() {
  for (const padMesh of jumpPadMeshes.values()) {
    scene.remove(padMesh);
  }
  jumpPadMeshes.clear();

  sim.jumpPads.forEach(pad => {
    const padGroup = new THREE.Group();
    padGroup.position.set(pad.pos[0], pad.pos[1] + 0.05, pad.pos[2]);

    const rimGeo = new THREE.CylinderGeometry(pad.radius, pad.radius + 0.2, 0.15, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4, metalness: 0.2 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    padGroup.add(rimMesh);

    const runeGeo = new THREE.CircleGeometry(pad.radius * 0.85, 24);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.y = 0.08;
    padGroup.add(runeMesh);

    const padLight = new THREE.PointLight(0x34d399, 1.5, 6);
    padLight.position.y = 0.5;
    padGroup.add(padLight);

    scene.add(padGroup);
    jumpPadMeshes.set(pad.id, padGroup);
  });
}

// Build 3D Charms
function initCharmsVisual() {
  for (const charmMesh of charmMeshes.values()) {
    scene.remove(charmMesh);
  }
  charmMeshes.clear();

  sim.charms.forEach(c => {
    const group = new THREE.Group();
    group.position.set(c.pos[0], c.pos[1] + 1.2, c.pos[2]);

    const leafGeo = new THREE.OctahedronGeometry(0.45, 0);
    const leafMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE.mayScarfAndCharm),
      emissive: new THREE.Color(PALETTE.goldBorderScore),
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    group.add(leafMesh);

    const cLight = new THREE.PointLight(new THREE.Color(PALETTE.goldBorderScore), 1.8, 5);
    group.add(cLight);

    scene.add(group);
    charmMeshes.set(c.id, group);
  });
}

// Start Night function
function startNight(nightNumber) {
  currentNight = nightNumber;
  nightButtons.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.night, 10) === currentNight);
  });

  for (const mesh of moteMeshes.values()) scene.remove(mesh);
  moteMeshes.clear();
  for (const mesh of shadeMeshes.values()) scene.remove(mesh.group);
  shadeMeshes.clear();
  for (const mesh of drifterMeshes.values()) scene.remove(mesh);
  drifterMeshes.clear();

  sim = new GameSimulation({ seed: Date.now(), night: currentNight });

  buildTerrain(currentNight);
  initLanternsVisual();
  initJumpPadsVisual();
  initCharmsVisual();

  windCard.classList.toggle('hidden', currentNight !== 3);
  gameModal.classList.add('hidden');
  pauseModal.classList.add('hidden');
}

// Input tracking
const keys = {};
let camYaw = 0;
let camPitch = 0.35;
let isMouseDown = false;
let mouseX = 0, mouseY = 0;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'KeyE', 'KeyF', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'ShiftLeft', 'ShiftRight', 'KeyP', 'Escape'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    togglePause();
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

function togglePause() {
  if (sim.state === 'playing') {
    sim.isPaused = true;
    sim.state = 'paused';
    pauseModal.classList.remove('hidden');
  } else if (sim.state === 'paused') {
    sim.isPaused = false;
    sim.state = 'playing';
    pauseModal.classList.add('hidden');
  }
}

btnPauseToggle.addEventListener('click', togglePause);
btnResume.addEventListener('click', togglePause);
btnPauseRestart.addEventListener('click', () => {
  pauseModal.classList.add('hidden');
  startNight(currentNight);
});

btnRestart.addEventListener('click', () => {
  gameModal.classList.add('hidden');
  startNight(currentNight);
});

btnNextNight.addEventListener('click', () => {
  gameModal.classList.add('hidden');
  const next = currentNight < 3 ? currentNight + 1 : 1;
  startNight(next);
});

nightButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const n = parseInt(btn.dataset.night, 10);
    startNight(n);
  });
});

// Update Motes Meshes
function updateMotesVisual() {
  for (const m of sim.motes) {
    let mesh = moteMeshes.get(m.id);
    if (!mesh && m.active) {
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.25, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.moteCore) });
      const orb = new THREE.Mesh(geo, mat);
      group.add(orb);

      const mLight = new THREE.PointLight(new THREE.Color(PALETTE.moteHalo), 1.2, 4);
      group.add(mLight);

      group.position.set(m.pos[0], m.pos[1] + 0.6, m.pos[2]);
      scene.add(group);
      mesh = group;
      moteMeshes.set(m.id, mesh);
    }
    if (mesh) {
      if (!m.active) {
        scene.remove(mesh);
        moteMeshes.delete(m.id);
      } else {
        mesh.position.y = m.pos[1] + 0.6 + Math.sin(Date.now() * 0.005 + m.pos[0] * 2) * 0.15;
      }
    }
  }
}

// Update Shades Meshes
function updateShadesVisual(nowSec) {
  const pal = getActivePalette();

  for (const s of sim.shades) {
    let item = shadeMeshes.get(s.id);
    if (!item) {
      const group = new THREE.Group();

      const geo = new THREE.SphereGeometry(0.7, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pal.shadeBody),
        roughness: 0.2,
        emissive: new THREE.Color(pal.shadeBorder),
        emissiveIntensity: 0.3
      });
      const orb = new THREE.Mesh(geo, mat);
      orb.position.y = 0.85;
      group.add(orb);

      const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.shadeBorder) });
      const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
      eye1.position.set(0.24, 0.95, 0.6);
      const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
      eye2.position.set(-0.24, 0.95, 0.6);
      group.add(eye1);
      group.add(eye2);

      // Drain beam / aura
      const drainGeo = new THREE.CylinderGeometry(0.1, 0.4, 2.0, 8);
      const drainMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const drainMesh = new THREE.Mesh(drainGeo, drainMat);
      drainMesh.rotation.x = Math.PI / 2;
      drainMesh.position.set(0, 0.8, 1.0);
      group.add(drainMesh);

      scene.add(group);
      item = { group, orb, eye1, eye2, drainMesh };
      shadeMeshes.set(s.id, item);
    }

    item.group.position.set(s.pos[0], s.pos[1], s.pos[2]);

    if (s.state === 'stunned') {
      item.orb.material.color.set(new THREE.Color(pal.shadeStunned));
      item.drainMesh.material.opacity = 0;
    } else if (s.state === 'drain') {
      item.orb.material.color.set(new THREE.Color(pal.shadeBody));
      // Show drain beam pulsing
      item.drainMesh.material.opacity = 0.5 + Math.sin(nowSec * 8) * 0.3;
    } else {
      item.orb.material.color.set(new THREE.Color(pal.shadeBody));
      item.drainMesh.material.opacity = 0;
    }
  }
}

// Update Drifters Meshes
function updateDriftersVisual() {
  for (const d of sim.drifters) {
    let mesh = drifterMeshes.get(d.id);
    if (!mesh) {
      const group = new THREE.Group();
      const bodyGeo = new THREE.ConeGeometry(0.4, 1.4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.drifter),
        transparent: true,
        opacity: 0.85,
        roughness: 0.2
      });
      const cone = new THREE.Mesh(bodyGeo, bodyMat);
      cone.rotation.x = Math.PI;
      group.add(cone);

      const light = new THREE.PointLight(0xa5f3fc, 1.0, 5);
      group.add(light);

      scene.add(group);
      mesh = group;
      drifterMeshes.set(d.id, mesh);
    }
    mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
    mesh.rotation.y = d.wander_angle || 0;
  }

  for (const [id, mesh] of drifterMeshes.entries()) {
    if (!sim.drifters.some(d => d.id === id)) {
      scene.remove(mesh);
      drifterMeshes.delete(id);
    }
  }
}

// Update Charms Visual
function updateCharmsVisual() {
  for (const c of sim.charms) {
    const mesh = charmMeshes.get(c.id);
    if (mesh) {
      mesh.visible = c.available;
      if (c.available) {
        mesh.rotation.y += 0.03;
        mesh.position.y = c.pos[1] + 1.2 + Math.sin(Date.now() * 0.004) * 0.15;
      }
    }
  }
}

// Update Lanterns Visual & Fuel Bar (Phase 3)
function updateLanternsVisual(nowSec) {
  let litCount = 0;

  for (const l of sim.lanterns) {
    const item = lanternMeshes.get(l.id);
    if (item) {
      const fuelVal = l.fuel_units / 60.0;
      if (l.lit) {
        litCount++;
        item.chamber.scale.set(1.0, 1.0, 1.0);
        item.barGroup.visible = true;

        // Billboarding fuel bar towards camera
        item.barGroup.quaternion.copy(camera.quaternion);

        // Scale fill bar
        const fillScale = Math.max(0.01, Math.min(1.0, fuelVal / 100.0));
        item.barFill.scale.set(fillScale, 1, 1);
        item.barFill.position.x = -(1.0 - fillScale) * 0.68;

        // Check fuel < 30 (nhấp nháy chậm 1 Hz)
        if (fuelVal < 30.0) {
          const blink = (Math.sin(nowSec * Math.PI * 2) > 0);
          item.barFillMat.color.set(blink ? 0xef4444 : 0x7f1d1d);
          item.light.intensity = blink ? 4.5 : 1.5;
          item.chamber.material.emissiveIntensity = blink ? 1.0 : 0.3;
        } else {
          item.barFillMat.color.set(0x22c55e);
          item.light.intensity = 4.5;
          item.chamber.material.emissiveIntensity = 1.0;
        }

        item.chamber.material.color.set(new THREE.Color(PALETTE.litLantern));
        item.chamber.material.emissive = new THREE.Color(PALETTE.litLantern);
      } else {
        // Đèn tắt: xẹp 20% (scale y: 0.8), fuel bar tắt
        item.chamber.scale.set(1.0, 0.8, 1.0);
        item.barGroup.visible = false;
        item.light.intensity = 0;
        item.chamber.material.color.set(new THREE.Color(PALETTE.unlitLantern));
        item.chamber.material.emissive = new THREE.Color(0x000000);
      }
    }
  }

  // Ambient light formula
  ambientLight.intensity = 0.15 + 0.55 * (litCount / sim.lanterns.length);
}

// Start first night
startNight(1);

// Game Loop
let lastTime = performance.now();
function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  const nowSec = currentTime / 1000;

  if (sim.state === 'playing') {
    let moveX = 0;
    let moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX += 1;

    const isDash = Boolean(keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyQ']);
    const deg = (camYaw * 180 / Math.PI);
    const frameInput = {
      move: [moveX, moveZ],
      cam_yaw_deg: deg,
      jump: Boolean(keys['Space']),
      interact: Boolean(keys['KeyF'] || keys['Enter']),
      pulse: Boolean(keys['KeyE']),
      dash: isDash
    };

    const events = sim.step(frameInput);

    for (const ev of events) {
      if (ev.name === 'mote_picked') sound.playMotePickup();
      if (ev.name === 'deposit' || ev.name === 'refuel') sound.playDeposit();
      if (ev.name === 'lantern_lit') sound.playLanternLit();
      if (ev.name === 'player_hit') sound.playHit();
      if (ev.name === 'pulse') {
        sound.playPulse();
        pulseAnim = 1.0;
        pulseRing.position.set(sim.player.pos[0], sim.player.pos[1] + 0.05, sim.player.pos[2]);
      }
    }

    keys['KeyF'] = false;
    keys['KeyE'] = false;
    keys['Space'] = false;
    keys['Enter'] = false;
    keys['KeyQ'] = false;
    keys['ShiftLeft'] = false;
    keys['ShiftRight'] = false;
  }

  // Update visual entities
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);
  if (sim.currentInput.move[0] !== 0 || sim.currentInput.move[1] !== 0) {
    const targetRot = camYaw + Math.atan2(sim.currentInput.move[0], sim.currentInput.move[1]);
    playerGroup.rotation.y = targetRot;
  }

  // Dash effect
  if (sim.player.dash_timer > 0) {
    dashAuraMat.opacity = 0.8;
  } else {
    dashAuraMat.opacity = Math.max(0, dashAuraMat.opacity - delta * 5);
  }

  // Camera follow
  const camDist = 7.5;
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
  updateShadesVisual(nowSec);
  updateDriftersVisual();
  updateCharmsVisual();
  updateLanternsVisual(nowSec);

  // Update HUD
  const litCount = sim.lanterns.filter(l => l.lit).length;
  const reqLit = Math.ceil(sim.tuning.win_ratio * sim.lanterns.length);

  flamesEl.textContent = '🔥'.repeat(Math.max(0, sim.player.flames)) || '💀';
  carriedEl.textContent = `✨ ${sim.player.carried} / ${sim.player.capacity}`;
  lanternsEl.textContent = `🏮 ${litCount} / ${sim.lanterns.length} (Cần ≥ ${reqLit})`;
  timeEl.textContent = `⏱️ ${Math.ceil(sim.time_left_s)}s`;
  scoreEl.textContent = `⭐ ${sim.score}`;

  if (sim.time_left_s <= 30) {
    timeEl.classList.add('time-warning');
  } else {
    timeEl.classList.remove('time-warning');
  }

  // Wind display
  if (sim.wind_enabled) {
    if (sim.wind.active) {
      windDisplay.textContent = `💨 Mạnh (${sim.wind.dir_deg}°)`;
      windDisplay.style.color = '#38bdf8';
    } else {
      windDisplay.textContent = `💨 Yên`;
      windDisplay.style.color = '#F5F1E6';
    }
  }

  // Skill Badges Update
  if (sim.player.charm_timer > 0) {
    charmIndicator.classList.remove('hidden');
    charmTimerVal.textContent = `${sim.player.charm_timer.toFixed(1)}s`;
    dashCdVal.textContent = 'BÙA GIÓ';
    dashCdVal.className = 'badge-cd ready';
  } else {
    charmIndicator.classList.add('hidden');
    if (sim.player.dash_cd <= 0) {
      dashCdVal.textContent = 'SẴN SÀNG';
      dashCdVal.className = 'badge-cd ready';
    } else {
      dashCdVal.textContent = `${sim.player.dash_cd.toFixed(1)}s`;
      dashCdVal.className = 'badge-cd';
    }
  }

  if (sim.player.pulse_cd <= 0) {
    pulseCdVal.textContent = 'SẴN SÀNG';
    pulseCdVal.className = 'badge-cd ready';
  } else {
    pulseCdVal.textContent = `${sim.player.pulse_cd.toFixed(1)}s`;
    pulseCdVal.className = 'badge-cd';
  }

  // Check near lantern for prompt
  const nearLantern = sim.lanterns.find(
    l => Math.hypot(l.pos[0] - sim.player.pos[0], l.pos[2] - sim.player.pos[2]) <= sim.tuning.interact_radius
  );

  if (nearLantern) {
    if (!nearLantern.lit) {
      const cost = nearLantern.ever_lit ? sim.tuning.relight_cost : sim.tuning.lantern_cost;
      const typeStr = nearLantern.ever_lit ? 'thắp lại' : 'thắp';
      if (sim.player.carried > 0) {
        promptEl.classList.remove('hidden');
        promptEl.textContent = `Nhấn [F] để ${typeStr} Đèn Lồng (${nearLantern.deposited}/${cost})`;
      } else {
        promptEl.classList.remove('hidden');
        promptEl.textContent = `Đèn Lồng cần ${cost} đom đóm để ${typeStr} (${nearLantern.deposited}/${cost}). Hãy nhặt thêm đom đóm!`;
      }
    } else {
      // Lit lantern: châm dầu
      const currentFuel = nearLantern.fuel_units / 60.0;
      const neededMotes = Math.ceil((100.0 - currentFuel) / 10.0);
      if (neededMotes > 0 && sim.player.carried > 0) {
        promptEl.classList.remove('hidden');
        promptEl.textContent = `Nhấn [F] để châm dầu Đèn Lồng (Dầu: ${currentFuel.toFixed(1)}/100, cần ${neededMotes} đom đóm)`;
      } else if (neededMotes === 0) {
        promptEl.classList.add('hidden');
      } else {
        promptEl.classList.remove('hidden');
        promptEl.textContent = `Đèn Lồng đang có ${currentFuel.toFixed(1)}/100 dầu. Cần thêm đom đóm để châm dầu!`;
      }
    }
  } else {
    promptEl.classList.add('hidden');
  }

  // Game over modal
  if ((sim.state === 'won' || sim.state === 'lost') && gameModal.classList.contains('hidden')) {
    gameModal.classList.remove('hidden');
    finalScoreEl.textContent = sim.score;
    if (sim.state === 'won') {
      modalTitle.textContent = `CHIẾN THẮNG ĐÊM ${currentNight}!`;
      modalTitle.style.color = '#FFB347';
      modalDesc.textContent = `Bình minh đã lên! Bạn đã giữ được ${litCount}/${sim.lanterns.length} đèn sáng và xua tan sương đen vĩnh viễn!`;
      if (currentNight < 3) {
        btnNextNight.classList.remove('hidden');
      } else {
        btnNextNight.classList.add('hidden');
      }
    } else {
      modalTitle.textContent = 'THẤT BẠI!';
      modalTitle.style.color = '#FF5A5F';
      modalDesc.textContent = 'Ngọn lửa đã tàn hoặc hòn đảo không còn đủ đèn sáng khi bình minh ló rạng.';
      btnNextNight.classList.add('hidden');
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('✨ Starting Phase 3 Game Animation Loop...');
requestAnimationFrame(animate);
