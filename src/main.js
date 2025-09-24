import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#02040a');

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

camera.position.set(0, 14, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 2, 0);

const hemiLight = new THREE.HemisphereLight('#74a4ff', '#1a1f29', 0.6);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight('#ffdca8', 1.4);
sun.castShadow = true;
sun.position.set(20, 35, 15);
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const groundGeometry = new THREE.CircleGeometry(60, 64);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: '#1f2a1f',
  roughness: 0.9,
  metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const fog = new THREE.Fog('#02040a', 40, 120);
scene.fog = fog;

function createCrystal(position) {
  const geometry = new THREE.TetrahedronGeometry(0.6, 1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
    emissive: '#2a3b5c',
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.userData = { type: 'food' };
  scene.add(mesh);
  return mesh;
}

function createEnemy(position) {
  const geometry = new THREE.SphereGeometry(1.2, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: '#c968ff',
    emissive: '#4a206a',
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.position.copy(position);
  mesh.userData = { type: 'enemy', speed: 1.6 };
  scene.add(mesh);
  return mesh;
}

function randomPosition(radius = 25) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius;
  return new THREE.Vector3(
    Math.cos(angle) * distance,
    0,
    Math.sin(angle) * distance
  );
}

const crystals = [];
const enemies = [];

for (let i = 0; i < 12; i += 1) {
  crystals.push(createCrystal(randomPosition()));
}

for (let i = 0; i < 3; i += 1) {
  enemies.push(createEnemy(randomPosition(20)));
}

const playerGeometry = new THREE.CapsuleGeometry(1, 1.6, 8, 16);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: '#73d3ff',
  emissive: '#0f4c81',
  roughness: 0.2,
});
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
playerMesh.castShadow = true;
scene.add(playerMesh);

const player = {
  position: new THREE.Vector3(0, 1.4, 0),
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  health: 100,
  energy: 100,
  food: 0,
  dashTimer: 0,
};

const hud = {
  health: document.getElementById('health'),
  energy: document.getElementById('energy'),
  food: document.getElementById('food'),
  day: document.getElementById('day'),
  time: document.getElementById('time'),
};

const keys = new Set();
window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let timeOfDay = 0;
let dayCount = 1;

function updateHUD() {
  hud.health.textContent = Math.round(player.health).toString();
  hud.energy.textContent = Math.round(player.energy).toString();
  hud.food.textContent = player.food.toString();
  hud.day.textContent = dayCount.toString();
  const stages = ['Night', 'Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk'];
  const index = Math.floor(timeOfDay * stages.length) % stages.length;
  hud.time.textContent = stages[index];
}

function handleInput(delta) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

  player.direction.set(0, 0, 0);
  const speed = keys.has('shift') ? 5 : 3.5;

  if (keys.has('w')) player.direction.add(forward);
  if (keys.has('s')) player.direction.sub(forward);
  if (keys.has('a')) player.direction.sub(right);
  if (keys.has('d')) player.direction.add(right);

  if (player.direction.lengthSq() > 0) {
    player.direction.normalize();
    player.velocity.lerp(player.direction.multiplyScalar(speed), 0.12);
  } else {
    player.velocity.multiplyScalar(0.9);
  }

  if (keys.has(' ')) {
    if (player.dashTimer <= 0 && player.energy > 20) {
      player.velocity.add(player.velocity.clone().normalize().multiplyScalar(8));
      player.energy = Math.max(0, player.energy - 20);
      player.dashTimer = 1.5;
    }
    keys.delete(' ');
  }

  player.dashTimer = Math.max(0, player.dashTimer - delta);
}

function clampToArena(target, radius = 55) {
  const length = Math.sqrt(target.x * target.x + target.z * target.z);
  if (length > radius) {
    target.multiplyScalar(radius / length);
  }
}

function updatePlayer(delta) {
  handleInput(delta);
  player.position.add(player.velocity.clone().multiplyScalar(delta));
  clampToArena(player.position);
  playerMesh.position.copy(player.position);
  playerMesh.position.y = 1.4;
  player.velocity.y = 0;

  player.energy = Math.min(100, player.energy + delta * 3 * (player.direction.lengthSq() === 0 ? 2 : 1));
  timeOfDay += delta * 0.02;
  if (timeOfDay >= 1) {
    timeOfDay -= 1;
    dayCount += 1;
    if (player.food > 0) {
      player.food -= 1;
      player.energy = Math.min(100, player.energy + 20);
    } else {
      player.health = Math.max(0, player.health - 15);
    }
  }

  if (player.energy <= 0) {
    player.health = Math.max(0, player.health - delta * 5);
  }

  if (player.health <= 0) {
    player.health = 0;
    player.energy = Math.max(0, player.energy - delta * 10);
  }
}

function updateCamera(delta) {
  const target = player.position.clone().add(new THREE.Vector3(0, 6, 10));
  camera.position.lerp(target, 1 - Math.pow(0.001, delta));
  controls.target.lerp(player.position.clone().add(new THREE.Vector3(0, 2, 0)), 1 - Math.pow(0.001, delta));
  controls.update();
}

function updateCrystals(delta) {
  for (const crystal of crystals) {
    if (!crystal.visible) continue;
    crystal.rotation.y += delta;
    const distance = crystal.position.distanceTo(player.position);
    if (distance < 2.2) {
      crystal.visible = false;
      player.food += 1;
      player.energy = Math.min(100, player.energy + 15);
      setTimeout(() => {
        crystal.position.copy(randomPosition());
        crystal.visible = true;
      }, 4000);
    }
  }
}

function updateEnemies(delta) {
  enemies.forEach((enemy) => {
    const toPlayer = player.position.clone().sub(enemy.position);
    const distance = toPlayer.length();
    toPlayer.normalize();
    const speed = enemy.userData.speed + Math.sin(timeOfDay * Math.PI * 2) * 0.4;
    enemy.position.add(toPlayer.multiplyScalar(delta * speed));
    enemy.position.y = 1.2 + Math.sin(performance.now() * 0.002 + distance) * 0.4;

    if (distance < 2.5) {
      player.health = Math.max(0, player.health - delta * 12);
    }

    if (distance > 70) {
      enemy.position.copy(randomPosition(20));
    }
  });
}

function updateLighting() {
  const t = (Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  const dayColor = new THREE.Color('#87b0ff');
  const nightColor = new THREE.Color('#0b0f2a');
  hemiLight.intensity = 0.3 + t * 0.5;
  sun.intensity = 0.8 + t * 1.2;
  scene.background = nightColor.clone().lerp(dayColor, t * 0.6 + 0.2);
  sun.position.set(Math.cos(timeOfDay * Math.PI * 2) * 40, 25 + t * 25, Math.sin(timeOfDay * Math.PI * 2) * 40);
}

const rocks = [];
const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
for (let i = 0; i < 20; i += 1) {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: '#48534a',
    roughness: 1,
  });
  const mesh = new THREE.Mesh(rockGeometry, rockMaterial);
  mesh.scale.setScalar(0.6 + Math.random() * 2);
  mesh.position.copy(randomPosition(40));
  mesh.position.y = mesh.scale.y / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  rocks.push(mesh);
}

let lastTime = performance.now();

function loop() {
  const now = performance.now();
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  updatePlayer(delta);
  updateCamera(delta);
  updateCrystals(delta);
  updateEnemies(delta);
  updateLighting();
  updateHUD();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

updateHUD();
loop();
