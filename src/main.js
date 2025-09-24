import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/SMAAPass.js';
import { RoomEnvironment } from 'https://unpkg.com/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';
import { Sky } from 'https://unpkg.com/three@0.160.0/examples/jsm/objects/Sky.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070f');
scene.fog = new THREE.FogExp2('#04060c', 0.01);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 4, 12);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.35, 0.7);
composer.addPass(bloomPass);

const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
composer.addPass(smaaPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.enableRotate = false;
controls.minDistance = 2;
controls.maxDistance = 40;
controls.target.set(0, 2, 0);

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const sun = new THREE.Vector3();

const hemiLight = new THREE.HemisphereLight('#5f82ff', '#1f2610', 0.55);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight('#fff2d2', 3.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(4096, 4096);
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 150;
directionalLight.shadow.camera.left = -60;
directionalLight.shadow.camera.right = 60;
directionalLight.shadow.camera.top = 60;
directionalLight.shadow.camera.bottom = -60;
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();

const groundColor = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
groundColor.wrapS = groundColor.wrapT = THREE.RepeatWrapping;
groundColor.repeat.set(80, 80);
groundColor.encoding = THREE.sRGBEncoding;

const groundNormal = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big-nm.jpg');
groundNormal.wrapS = groundNormal.wrapT = THREE.RepeatWrapping;
groundNormal.repeat.set(80, 80);

const groundGeometry = new THREE.CircleGeometry(120, 128);
groundGeometry.rotateX(-Math.PI / 2);

const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundColor,
  normalMap: groundNormal,
  emissive: '#05090f',
  emissiveIntensity: 0.2,
  roughness: 0.8,
  metalness: 0.15,
});

const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

const groundMaterialPhysics = new CANNON.Material('ground');
const playerMaterialPhysics = new CANNON.Material('player');
const dynamicMaterialPhysics = new CANNON.Material('dynamic');

world.addContactMaterial(new CANNON.ContactMaterial(groundMaterialPhysics, playerMaterialPhysics, {
  friction: 0.2,
  restitution: 0.05,
}));

world.addContactMaterial(new CANNON.ContactMaterial(dynamicMaterialPhysics, groundMaterialPhysics, {
  friction: 0.7,
  restitution: 0.1,
}));

const groundBody = new CANNON.Body({ mass: 0, material: groundMaterialPhysics });
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const playerGeometry = new THREE.CapsuleGeometry(0.8, 1.8, 10, 20);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: '#7de1ff',
  emissive: '#1f7aff',
  emissiveIntensity: 0.4,
  roughness: 0.25,
  metalness: 0.3,
});
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
playerMesh.castShadow = true;
scene.add(playerMesh);

const playerBody = new CANNON.Body({
  mass: 85,
  shape: new CANNON.Sphere(0.9),
  material: playerMaterialPhysics,
  position: new CANNON.Vec3(0, 3, 0),
});
playerBody.fixedRotation = true;
playerBody.updateMassProperties();
world.addBody(playerBody);

const hud = {
  health: document.getElementById('health'),
  stamina: document.getElementById('energy'),
  food: document.getElementById('food'),
  day: document.getElementById('day'),
  time: document.getElementById('time'),
  tooltip: document.getElementById('tooltip'),
};

const playerState = {
  maxHealth: 120,
  maxStamina: 120,
  health: 120,
  stamina: 120,
  food: 0,
  dashCooldown: 0,
  grounded: false,
  day: 1,
  timeOfDay: 0.25,
};

let lastTimeOfDay = playerState.timeOfDay;

const baseTooltip = 'Click to capture the mouse • WASD + mouse to move • Space to jump • Shift to dash';
hud.tooltip.textContent = baseTooltip;

const pointer = { yaw: 0, pitch: -0.15 };
const inputState = { forward: 0, backward: 0, left: 0, right: 0, jump: false, dash: false };
let pointerLocked = false;

function lockPointer() {
  canvas.requestPointerLock();
}

document.body.addEventListener('click', () => {
  if (!pointerLocked) lockPointer();
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
  if (pointerLocked) {
    hud.tooltip.textContent = baseTooltip;
  }
  hud.tooltip.style.opacity = pointerLocked ? '0' : '1';
});

document.addEventListener('mousemove', (event) => {
  if (!pointerLocked) return;
  const sensitivity = 0.0025;
  pointer.yaw -= event.movementX * sensitivity;
  pointer.pitch -= event.movementY * sensitivity;
  pointer.pitch = THREE.MathUtils.clamp(pointer.pitch, -Math.PI / 3, Math.PI / 3);
});

const keyMap = new Map([
  ['w', 'forward'],
  ['s', 'backward'],
  ['a', 'left'],
  ['d', 'right'],
  ['arrowup', 'forward'],
  ['arrowdown', 'backward'],
  ['arrowleft', 'left'],
  ['arrowright', 'right'],
]);

window.addEventListener('keydown', (event) => {
  const key = keyMap.get(event.key.toLowerCase());
  if (key) inputState[key] = 1;
  if (event.code === 'Space') inputState.jump = true;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') inputState.dash = true;
});

window.addEventListener('keyup', (event) => {
  const key = keyMap.get(event.key.toLowerCase());
  if (key) inputState[key] = 0;
  if (event.code === 'Space') inputState.jump = false;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') inputState.dash = false;
});

const crystals = [];
const crystalGeometry = new THREE.OctahedronGeometry(0.8, 2);
const enemyMeshes = [];
const dynamicBodies = [];

function createCrystal(position) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
    emissive: '#2245ff',
    emissiveIntensity: 0.8,
    metalness: 0.4,
    roughness: 0.15,
  });
  const mesh = new THREE.Mesh(crystalGeometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);
  crystals.push({ mesh, respawnTimer: 0 });
}

function randomInRing(radiusMin, radiusMax) {
  const angle = Math.random() * Math.PI * 2;
  const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

function clampToArena(vector, radius = 110) {
  const lengthSq = vector.x * vector.x + vector.z * vector.z;
  if (lengthSq > radius * radius) {
    const length = Math.sqrt(lengthSq);
    vector.x = (vector.x / length) * radius;
    vector.z = (vector.z / length) * radius;
  }
}

function clampBodyToArena(body, radius = 100) {
  const { x, z } = body.position;
  const lengthSq = x * x + z * z;
  if (lengthSq > radius * radius) {
    const length = Math.sqrt(lengthSq);
    const nx = (x / length) * radius;
    const nz = (z / length) * radius;
    body.position.x = nx;
    body.position.z = nz;
    body.velocity.x *= 0.2;
    body.velocity.z *= 0.2;
  }
}

for (let i = 0; i < 18; i += 1) {
  createCrystal(randomInRing(10, 70));
}

function spawnDynamicCrate(position, scale) {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: '#8f542f',
    roughness: 0.9,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(0.5 * scale, 0.5 * scale, 0.5 * scale));
  const body = new CANNON.Body({
    mass: 15 * scale,
    shape,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    material: dynamicMaterialPhysics,
  });
  body.angularDamping = 0.4;
  world.addBody(body);
  dynamicBodies.push({ mesh, body });
}

for (let i = 0; i < 12; i += 1) {
  const pos = randomInRing(5, 55);
  spawnDynamicCrate(new THREE.Vector3(pos.x, 4 + Math.random() * 8, pos.z), 0.8 + Math.random());
}

const treeGeometry = new THREE.CylinderGeometry(0, 1, 6, 8);
const treeMaterial = new THREE.MeshStandardMaterial({ color: '#226d3d', roughness: 0.7, metalness: 0.1 });
const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 6);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#5c3a23', roughness: 0.9 });

for (let i = 0; i < 40; i += 1) {
  const base = randomInRing(30, 110);
  const tree = new THREE.Mesh(treeGeometry, treeMaterial);
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  tree.position.set(base.x, 7, base.z);
  trunk.position.set(base.x, 2, base.z);
  tree.castShadow = true;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  scene.add(tree, trunk);
}

function createEnemy() {
  const geometry = new THREE.SphereGeometry(1.4, 48, 48);
  const material = new THREE.MeshStandardMaterial({
    color: '#ff5efc',
    emissive: '#79208f',
    emissiveIntensity: 0.6,
    metalness: 0.7,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);
  enemyMeshes.push({ mesh, position: randomInRing(10, 60), velocity: new THREE.Vector3(), cooldown: 0 });
}

for (let i = 0; i < 4; i += 1) {
  createEnemy();
}

const clock = new THREE.Clock();

function updatePlayer(delta) {
  const onGround = playerBody.position.y < 1.15 && Math.abs(playerBody.velocity.y) < 2.5;
  playerState.grounded = onGround;

  const forward = new THREE.Vector3(Math.sin(pointer.yaw), 0, Math.cos(pointer.yaw));
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const move = new THREE.Vector3();
  if (inputState.forward) move.add(forward);
  if (inputState.backward) move.sub(forward);
  if (inputState.left) move.sub(right);
  if (inputState.right) move.add(right);

  if (move.lengthSq() > 0) move.normalize();

  const speed = playerState.dashCooldown <= 0 && inputState.dash ? 12 : 7.5;
  const desired = move.multiplyScalar(speed);

  const lerp = 1 - Math.exp(-delta * 10);
  playerBody.velocity.x += (desired.x - playerBody.velocity.x) * lerp;
  playerBody.velocity.z += (desired.z - playerBody.velocity.z) * lerp;

  if (playerState.grounded && inputState.jump) {
    playerBody.velocity.y = 13;
    playerState.grounded = false;
  }

  if (inputState.dash && playerState.dashCooldown <= 0 && move.lengthSq() > 0) {
    const dashImpulse = move.clone().multiplyScalar(25);
    playerBody.velocity.x += dashImpulse.x;
    playerBody.velocity.z += dashImpulse.z;
    playerState.stamina = Math.max(0, playerState.stamina - 30);
    playerState.dashCooldown = 2.8;
  }

  playerState.dashCooldown = Math.max(0, playerState.dashCooldown - delta);
}

playerBody.addEventListener('collide', (event) => {
  if (event.contact.ni.y > 0.5) {
    playerState.grounded = true;
  }
});

function updateEnemies(delta) {
  enemyMeshes.forEach((enemy) => {
    const target = playerBody.position;
    const toPlayer = new THREE.Vector3(target.x - enemy.position.x, 0, target.z - enemy.position.z);
    const distance = toPlayer.length();
    if (distance > 0.001) {
      toPlayer.normalize();
      const speed = 4 + Math.sin(playerState.timeOfDay * Math.PI * 2) * 1.5;
    enemy.velocity.lerp(toPlayer.multiplyScalar(speed), 1 - Math.exp(-delta * 2));
  }
  enemy.position.add(enemy.velocity.clone().multiplyScalar(delta));
  clampToArena(enemy.position, 105);

  enemy.mesh.position.set(enemy.position.x, 1.4 + Math.sin(performance.now() * 0.004) * 0.4, enemy.position.z);
    enemy.mesh.rotation.y += delta * 0.7;

    if (distance < 4 && enemy.cooldown <= 0) {
      playerState.health = Math.max(0, playerState.health - 12);
      enemy.cooldown = 1.5;
    }

    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
  });
}

function updateCrystals(delta) {
  crystals.forEach((crystal) => {
    if (!crystal.mesh.visible) {
      crystal.respawnTimer -= delta;
      if (crystal.respawnTimer <= 0) {
        crystal.mesh.position.copy(randomInRing(8, 70));
        crystal.mesh.visible = true;
      }
      return;
    }

    crystal.mesh.rotation.y += delta * 0.8;
    crystal.mesh.position.y = 1.2 + Math.sin(performance.now() * 0.002) * 0.4;

    const dx = crystal.mesh.position.x - playerBody.position.x;
    const dz = crystal.mesh.position.z - playerBody.position.z;
    const distanceSq = dx * dx + dz * dz;

    if (distanceSq < 5) {
      crystal.mesh.visible = false;
      crystal.respawnTimer = 8 + Math.random() * 6;
      playerState.food += 1;
      playerState.stamina = Math.min(playerState.stamina + 20, playerState.maxStamina);
    }
  });
}

function updateDynamicBodies() {
  dynamicBodies.forEach(({ mesh, body }) => {
    clampBodyToArena(body, 110);
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });
}

function updateLighting(delta) {
  playerState.timeOfDay = (playerState.timeOfDay + delta * 0.01) % 1;
  if (playerState.timeOfDay < lastTimeOfDay) {
    playerState.day += 1;
    if (playerState.food > 0) {
      playerState.food -= 1;
      playerState.health = Math.min(playerState.maxHealth, playerState.health + 20);
    } else {
      playerState.health = Math.max(0, playerState.health - 15);
    }
  }
  lastTimeOfDay = playerState.timeOfDay;

  const theta = Math.PI * 2 * (playerState.timeOfDay - 0.25);
  const phi = THREE.MathUtils.degToRad(60 - 40 * Math.cos(theta));

  sun.setFromSphericalCoords(1, phi, theta);
  directionalLight.position.copy(sun).multiplyScalar(120);
  const sunFactor = Math.max(0, sun.y);
  directionalLight.intensity = THREE.MathUtils.lerp(0.6, 4.5, sunFactor);
  hemiLight.intensity = THREE.MathUtils.lerp(0.15, 0.6, sunFactor);
  groundMaterial.emissiveIntensity = THREE.MathUtils.clamp(sunFactor * 0.8, 0.05, 1.2);

  sky.material.uniforms['sunPosition'].value.copy(sun);
  sky.material.uniforms['turbidity'].value = 12;
  sky.material.uniforms['rayleigh'].value = 2.5;
  sky.material.uniforms['mieCoefficient'].value = 0.0015;
  sky.material.uniforms['mieDirectionalG'].value = 0.999;

  const fogDensity = THREE.MathUtils.lerp(0.018, 0.008, Math.max(0, sun.y));
  scene.fog.density = fogDensity;
}

function updateHUD() {
  hud.health.textContent = Math.round(playerState.health).toString();
  hud.stamina.textContent = Math.round(playerState.stamina).toString();
  hud.food.textContent = playerState.food.toString();
  hud.day.textContent = playerState.day.toString();
  const stages = ['Night', 'Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk'];
  const stageIndex = Math.floor(playerState.timeOfDay * stages.length) % stages.length;
  hud.time.textContent = stages[stageIndex];
}

function updateCamera(delta) {
  const offset = new THREE.Vector3(0, 3.5, 8);
  const rotation = new THREE.Euler(pointer.pitch, pointer.yaw, 0, 'YXZ');
  offset.applyEuler(rotation);

  const desiredPosition = new THREE.Vector3(
    playerBody.position.x - offset.x,
    playerBody.position.y + 2 - offset.y,
    playerBody.position.z - offset.z
  );

  camera.position.lerp(desiredPosition, 1 - Math.exp(-delta * 6));
  const lookAt = new THREE.Vector3(playerBody.position.x, playerBody.position.y + 1.6, playerBody.position.z);
  controls.target.lerp(lookAt, 1 - Math.exp(-delta * 8));
  controls.update();
}

function updateStats(delta) {
  const moving = Math.abs(playerBody.velocity.x) + Math.abs(playerBody.velocity.z) > 0.2;
  if (moving) {
    playerState.stamina = Math.max(0, playerState.stamina - delta * 10);
  } else {
    playerState.stamina = Math.min(playerState.maxStamina, playerState.stamina + delta * 18);
  }

  if (playerState.stamina <= 0) {
    playerState.health = Math.max(0, playerState.health - delta * 4);
  }

  if (playerState.health <= 0) {
    hud.tooltip.textContent = 'You fell... click to restart';
    hud.tooltip.style.opacity = '1';
    if (pointerLocked) {
      document.exitPointerLock();
    }
    pointerLocked = false;
    resetGame();
  }
}

function resetGame() {
  playerBody.position.set(0, 3, 0);
  playerBody.velocity.set(0, 0, 0);
  playerBody.angularVelocity.set(0, 0, 0);
  playerState.health = playerState.maxHealth;
  playerState.stamina = playerState.maxStamina;
  playerState.food = 0;
  playerState.day = 1;
  playerState.timeOfDay = 0.25;
  playerState.dashCooldown = 0;
  playerState.grounded = false;
  lastTimeOfDay = playerState.timeOfDay;

  crystals.forEach((crystal) => {
    crystal.mesh.visible = true;
    crystal.respawnTimer = 0;
    crystal.mesh.position.copy(randomInRing(8, 70));
  });

  enemyMeshes.forEach((enemy) => {
    enemy.position.copy(randomInRing(10, 60));
    enemy.velocity.set(0, 0, 0);
    enemy.cooldown = 0;
    enemy.mesh.position.set(enemy.position.x, 1.4, enemy.position.z);
  });
}

function stepPhysics(delta) {
  const fixedTimeStep = 1 / 90;
  const maxSubSteps = 5;
  world.step(fixedTimeStep, delta, maxSubSteps);
}

function syncPlayerMesh() {
  clampBodyToArena(playerBody, 98);
  playerMesh.position.copy(playerBody.position);
  playerMesh.position.y -= 0.8;
  playerMesh.quaternion.setFromEuler(0, pointer.yaw, 0);
}

function loop() {
  const delta = Math.min(0.05, clock.getDelta());

  updatePlayer(delta);
  stepPhysics(delta);
  syncPlayerMesh();
  updateEnemies(delta);
  updateCrystals(delta);
  updateDynamicBodies();
  updateLighting(delta);
  updateCamera(delta);
  updateStats(delta);
  updateHUD();

  composer.render();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

updateHUD();
loop();

