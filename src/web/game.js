import * as THREE from './vendor/three.module.js';
import { GameSimulation } from './core/simulation.js';
import { MAPS, PALETTE, DEFAULT_TUNING } from './core/constants.js';
import { sound } from './audio.js';

console.log('🏮 Initializing Đảo Đèn Lồng 3D Web Engine (Phase 2 - Test Contract v1.1)...');

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

const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const finalScoreEl = document.getElementById('final-score');
const btnRestart = document.getElementById('btn-restart');
const btnNextNight = document.getElementById('btn-next-night');
const nightButtons = document.querySelectorAll('.btn-night');

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

// Body (Áo dài tunic with standard colors)
const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.55;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

// Red Scarf (Khăn quàng đỏ)
const scarfGeo = new THREE.TorusGeometry(0.38, 0.1, 8, 20);
const scarfMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.mayScarfAndCharm), roughness: 0.5 });
const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
scarfMesh.rotation.x = Math.PI / 2;
scarfMesh.position.y = 1.1;
playerGroup.add(scarfMesh);

// Head
const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.5 });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.35;
headMesh.castShadow = true;
playerGroup.add(headMesh);

// Nón Lá (Conical Palm Leaf Hat)
const hatGeo = new THREE.ConeGeometry(0.8, 0.35, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.7 });
const hatMesh = new THREE.Mesh(hatGeo, hatMat);
hatMesh.position.y = 1.62;
hatMesh.castShadow = true;
playerGroup.add(hatMesh);

// Small Lantern hanging from the hat brim
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

// Pulse visual wave mesh (golden ring)
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

// Dash visual trail (speed aura)
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

// Current Game State & Island Meshes Container
let currentNight = 1;
let sim = new GameSimulation({ seed: Date.now(), night: currentNight });

let terrainObjects = [];
const lanternMeshes = new Map();
const moteMeshes = new Map();
const shadeMeshes = new Map();
const drifterMeshes = new Map();
const charmMeshes = new Map();
const jumpPadMeshes = new Map();

// Helper: Build Terrain for the selected Night
function buildTerrain(night) {
  // Clear previous terrain objects
  for (const obj of terrainObjects) {
    scene.remove(obj);
  }
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
    // Night 1: Đảo Bến (Round island R=40)
    const islandGeo = new THREE.CylinderGeometry(40, 42, 3, 64);
    const islandMesh = new THREE.Mesh(islandGeo, grassMat);
    islandMesh.position.y = -1.5;
    islandMesh.receiveShadow = true;
    scene.add(islandMesh);
    terrainObjects.push(islandMesh);

    // Pier
    const pierGeo = new THREE.BoxGeometry(8, 0.6, 16);
    const pierMesh = new THREE.Mesh(pierGeo, woodMat);
    pierMesh.position.set(0, -0.3, 44);
    pierMesh.receiveShadow = true;
    scene.add(pierMesh);
    terrainObjects.push(pierMesh);

  } else if (night === 2) {
    // Night 2: Đảo Cau (2 islands R=28 at x=0 and x=70, bridge at x=26..44)
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

    // Wooden Bridge connecting both islands
    const bridgeGeo = new THREE.BoxGeometry(18, 0.5, 4);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, woodMat);
    bridgeMesh.position.set(35, -0.25, 0);
    bridgeMesh.receiveShadow = true;
    scene.add(bridgeMesh);
    terrainObjects.push(bridgeMesh);

  } else if (night === 3) {
    // Night 3: Đảo Chuông (3 tiers: Tier 0 R=45, Tier 1 R=12..24 at Y=3, Tier 2 R=8 at Y=6)
    // Tier 0 base
    const baseGeo = new THREE.CylinderGeometry(45, 47, 3, 64);
    const baseMesh = new THREE.Mesh(baseGeo, grassMat);
    baseMesh.position.y = -1.5;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    terrainObjects.push(baseMesh);

    // Tier 1 plateau (annulus R=12..24 z>0 at Y=3)
    const tier1Geo = new THREE.CylinderGeometry(22, 23, 3, 48);
    const tier1Mesh = new THREE.Mesh(tier1Geo, grassMat);
    tier1Mesh.position.set(0, 1.5, 8);
    tier1Mesh.receiveShadow = true;
    scene.add(tier1Mesh);
    terrainObjects.push(tier1Mesh);

    // Tier 2 high disk (R=8 at Y=6)
    const tier2Geo = new THREE.CylinderGeometry(8, 9, 3, 32);
    const tier2Mesh = new THREE.Mesh(tier2Geo, grassMat);
    tier2Mesh.position.set(0, 4.5, 0);
    tier2Mesh.receiveShadow = true;
    scene.add(tier2Mesh);
    terrainObjects.push(tier2Mesh);

    // Bell Tower Pagoda at center of Tier 2
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

    // Great Bell
    const bellGeo = new THREE.CylinderGeometry(0.7, 1.0, 1.6, 16);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.3 });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.y = 3.6;
    towerGroup.add(bellMesh);

    scene.add(towerGroup);
    terrainObjects.push(towerGroup);
  }
}

// Build 3D Big Lanterns
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

    scene.add(lGroup);
    lanternMeshes.set(l.id, { group: lGroup, light: pLight, chamber: chamberMesh });
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

// Build 3D Charms (Bùa Gió)
function initCharmsVisual() {
  for (const charmMesh of charmMeshes.values()) {
    scene.remove(charmMesh);
  }
  charmMeshes.clear();

  sim.charms.forEach(c => {
    const group = new THREE.Group();
    group.position.set(c.pos[0], c.pos[1] + 1.2, c.pos[2]);

    // Floating red leaf with gold border
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

  // Clear dynamic entities
  for (const mesh of moteMeshes.values()) scene.remove(mesh);
  moteMeshes.clear();
  for (const mesh of shadeMeshes.values()) scene.remove(mesh);
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

// Input tracking for visual game
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
function updateShadesVisual() {
  for (const s of sim.shades) {
    let mesh = shadeMeshes.get(s.id);
    if (!mesh) {
      const group = new THREE.Group();

      // Shadow core orb
      const geo = new THREE.SphereGeometry(0.7, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(PALETTE.shadeBody),
        roughness: 0.2,
        emissive: new THREE.Color(PALETTE.shadeBorder),
        emissiveIntensity: 0.3
      });
      const orb = new THREE.Mesh(geo, mat);
      orb.position.y = 0.85;
      group.add(orb);

      // Glowing red-purple eyes
      const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
      eye1.position.set(0.24, 0.95, 0.6);
      const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
      eye2.position.set(-0.24, 0.95, 0.6);
      group.add(eye1);
      group.add(eye2);

      scene.add(group);
      mesh = group;
      shadeMeshes.set(s.id, mesh);
    }
    mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
    if (s.state === 'stunned') {
      mesh.children[0].material.color.set(new THREE.Color(PALETTE.shadeStunned));
    } else {
      mesh.children[0].material.color.set(new THREE.Color(PALETTE.shadeBody));
    }
  }
}

// Update Drifters (Gió Lạc) Meshes
function updateDriftersVisual() {
  for (const d of sim.drifters) {
    let mesh = drifterMeshes.get(d.id);
    if (!mesh) {
      const group = new THREE.Group();

      // Silk wraith body
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

  // Remove missing drifters
  for (const [id, mesh] of drifterMeshes.entries()) {
    if (!sim.drifters.some(d => d.id === id)) {
      scene.remove(mesh);
      drifterMeshes.delete(id);
    }
  }
}

// Update Charms (Bùa Gió) Visual
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

// Update Lanterns Visual & Ambient Light formula
function updateLanternsVisual() {
  let litCount = 0;
  for (const l of sim.lanterns) {
    const item = lanternMeshes.get(l.id);
    if (item) {
      if (l.lit) {
        litCount++;
        item.light.intensity = 4.5;
        item.chamber.material.color.set(new THREE.Color(PALETTE.litLantern));
        item.chamber.material.emissive = new THREE.Color(PALETTE.litLantern);
      } else {
        item.light.intensity = 0;
        item.chamber.material.color.set(new THREE.Color(PALETTE.unlitLantern));
        item.chamber.material.emissive = new THREE.Color(0x000000);
      }
    }
  }

  // Ambient light formula per spec: intensity = 0.15 + 0.55 * (litCount / totalCount)
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

  if (sim.state === 'playing') {
    // Collect keyboard inputs
    let moveX = 0;
    let moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX -= 1; // camera perspective
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

    // Sound and visual effects for events
    for (const ev of events) {
      if (ev.name === 'mote_picked') sound.playMotePickup();
      if (ev.name === 'deposit') sound.playDeposit();
      if (ev.name === 'lantern_lit') sound.playLanternLit();
      if (ev.name === 'player_hit') sound.playHit();
      if (ev.name === 'pulse') {
        sound.playPulse();
        pulseAnim = 1.0;
        pulseRing.position.set(sim.player.pos[0], sim.player.pos[1] + 0.05, sim.player.pos[2]);
      }
    }

    // Reset single-frame keys
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

  // Camera follow (Third-person view behind player)
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
  updateShadesVisual();
  updateDriftersVisual();
  updateCharmsVisual();
  updateLanternsVisual();

  // Update HUD
  flamesEl.textContent = '🔥'.repeat(Math.max(0, sim.player.flames)) || '💀';
  carriedEl.textContent = `✨ ${sim.player.carried} / ${sim.tuning.carry_capacity}`;
  lanternsEl.textContent = `🏮 ${sim.lanterns.filter(l => l.lit).length} / ${sim.lanterns.length}`;
  timeEl.textContent = `⏱️ ${Math.ceil(sim.time_left_s)}s`;
  scoreEl.textContent = `⭐ ${sim.score}`;

  if (sim.time_left_s <= 30) {
    timeEl.classList.add('time-warning');
  } else {
    timeEl.classList.remove('time-warning');
  }

  // Wind display for Night 3
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

  // Check near unlit lantern for prompt
  const nearLantern = sim.lanterns.find(
    l => !l.lit && Math.hypot(l.pos[0] - sim.player.pos[0], l.pos[2] - sim.player.pos[2]) <= sim.tuning.interact_radius
  );
  if (nearLantern && sim.player.carried > 0) {
    promptEl.classList.remove('hidden');
    promptEl.textContent = `Nhấn [F] để nạp ${sim.player.carried} đom đóm vào Đèn Lồng (${nearLantern.deposited}/${sim.tuning.lantern_cost})`;
  } else if (nearLantern && sim.player.carried === 0) {
    promptEl.classList.remove('hidden');
    promptEl.textContent = `Đèn Lồng cần 10 đom đóm (${nearLantern.deposited}/10). Hãy nhặt thêm đom đóm!`;
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
      modalDesc.textContent = `Bạn đã thắp sáng toàn bộ Đèn Lồng Lớn trên ${sim.mapConfig.name}, xua tan sương đen!`;
      if (currentNight < 3) {
        btnNextNight.classList.remove('hidden');
      } else {
        btnNextNight.classList.add('hidden');
      }
    } else {
      modalTitle.textContent = 'THẤT BẠI!';
      modalTitle.style.color = '#FF5A5F';
      modalDesc.textContent = 'Ngọn lửa đã tàn hoặc bình minh đã lên trước khi đảo được thắp sáng.';
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

console.log('✨ Starting Phase 2 Game Animation Loop...');
requestAnimationFrame(animate);
