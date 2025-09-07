/// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2d3a);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 12);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(10, 25, 15);
scene.add(dirLight);

// ===== Ocean with Waves =====
const oceanGeometry = new THREE.PlaneGeometry(120, 120, 120, 120);
const oceanMaterial = new THREE.MeshPhongMaterial({
  color: 0x207bbf,
  transparent: true,
  opacity: 0.85,
  shininess: 80,
  side: THREE.DoubleSide,
});
const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.rotation.x = -Math.PI / 2;
scene.add(ocean);

// ===== Island & Dock =====
const islandGeometry = new THREE.CircleGeometry(20, 48);
const islandMaterial = new THREE.MeshPhongMaterial({ color: 0xdeb887 });
const island = new THREE.Mesh(islandGeometry, islandMaterial);
island.position.y = 0.2;
island.rotation.x = -Math.PI / 2;
scene.add(island);

// Dock
const dockGeometry = new THREE.BoxGeometry(6, 0.3, 2);
const dockMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
const dock = new THREE.Mesh(dockGeometry, dockMaterial);
dock.position.set(0, 0.35, -10);
scene.add(dock);

// ===== NPC =====
const npcGeometry = new THREE.SphereGeometry(0.8, 16, 16);
const npcMaterial = new THREE.MeshPhongMaterial({color: 0xffe0a8});
const npc = new THREE.Mesh(npcGeometry, npcMaterial);
npc.position.set(0, 1.1, -10.5);
scene.add(npc);

// ===== Ship =====
const shipGeometry = new THREE.BoxGeometry(3, 1, 8);
const shipMaterial = new THREE.MeshPhongMaterial({color: 0x0077be});
const ship = new THREE.Mesh(shipGeometry, shipMaterial);
ship.position.set(12, 1, -10);
ship.visible = false; // Hidden until purchased
scene.add(ship);

let shipOwned = false;
let onShip = false;

// ===== Player =====
let player = {
  x: 0,
  y: 1.6,
  z: 6,
  rotY: 0,
  gold: 100,
  hasMusket: false,
  musketReloading: false,
};
camera.position.set(player.x, player.y, player.z);

// ===== Controls =====
let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let mouseDown = false;
let lastMouseX = null, lastMouseY = null;

// Mouse look (click to drag)
renderer.domElement.addEventListener('mousedown', e => {
  // Only left mouse: look around
  if (e.button === 0) {
    mouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
  // Right mouse: aim musket
  if (e.button === 2 && player.hasMusket && !player.musketReloading) {
    musketAiming = true;
    camera.fov = 40; // Zoom in
    camera.updateProjectionMatrix();
  }
});
renderer.domElement.addEventListener('mouseup', e => {
  // Only left mouse: stop look
  if (e.button === 0) {
    mouseDown = false;
  }
  // Right mouse: fire musket if aiming
  if (e.button === 2 && player.hasMusket && !player.musketReloading && musketAiming) {
    musketAiming = false;
    camera.fov = 75; // Zoom out
    camera.updateProjectionMatrix();
    fireMusket();
  }
});
renderer.domElement.addEventListener('mousemove', e => {
  if (!mouseDown) return;
  let dx = e.clientX - lastMouseX;
  player.rotY -= dx * 0.002;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// ===== HUD =====
const goldSpan = document.getElementById('gold');
const musketSpan = document.getElementById('musket-status');
const reloadSpan = document.getElementById('reload-status');

// ===== Musket =====
let bullet = null;
let musketReloadTimer = 0;
let musketAiming = false;

function equipMusket() {
  player.hasMusket = true;
  musketSpan.textContent = 'Musket: Equipped';
}
function unequipMusket() {
  player.hasMusket = false;
  musketSpan.textContent = 'Musket: Unequipped';
}
function reloadMusket() {
  player.musketReloading = true;
  musketReloadTimer = 6;
  reloadSpan.textContent = 'Reloading...';
  setTimeout(() => {
    player.musketReloading = false;
    reloadSpan.textContent = '';
  }, 6000);
}
function fireMusket() {
  if (!player.hasMusket || player.musketReloading) return;
  // Create bullet
  const bulletGeom = new THREE.SphereGeometry(0.1, 8, 8);
  const bulletMat = new THREE.MeshPhongMaterial({color: 0xaaaaaa});
  bullet = new THREE.Mesh(bulletGeom, bulletMat);
  bullet.position.set(camera.position.x, camera.position.y, camera.position.z);
  bullet.direction = new THREE.Vector3(
    -Math.sin(player.rotY), 0, -Math.cos(player.rotY)
  );
  scene.add(bullet);
  reloadMusket();
}

// ===== Game Loop =====
function animateWaves(time) {
  const arr = ocean.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 2] = Math.sin(time / 900 + arr[i] / 6 + arr[i + 1] / 7) * 0.5;
  }
  ocean.geometry.attributes.position.needsUpdate = true;
}

function updatePlayer() {
  // WASD movement
  let moveSpeed = 0.18;
  let dx = 0, dz = 0;
  if (keys['w']) {
    dx -= Math.sin(player.rotY) * moveSpeed;
    dz -= Math.cos(player.rotY) * moveSpeed;
  }
  if (keys['s']) {
    dx += Math.sin(player.rotY) * moveSpeed;
    dz += Math.cos(player.rotY) * moveSpeed;
  }
  if (keys['a']) {
    dx -= Math.cos(player.rotY) * moveSpeed;
    dz += Math.sin(player.rotY) * moveSpeed;
  }
  if (keys['d']) {
    dx += Math.cos(player.rotY) * moveSpeed;
    dz -= Math.sin(player.rotY) * moveSpeed;
  }
  // Prevent walking into water unless on the ship
  if (Math.sqrt((player.x+dx)**2 + (player.z+dz)**2) < 20 || onShip) {
    player.x += dx;
    player.z += dz;
  }
  // Board ship if close
  if (shipOwned && !onShip && Math.abs(player.x-ship.position.x)<2 && Math.abs(player.z-ship.position.z)<6) {
    if (keys['e']) {
      onShip = true;
      reloadSpan.textContent = 'On Ship!';
    }
  }
  // Leave ship
  if (onShip && keys['q']) {
    onShip = false;
    reloadSpan.textContent = '';
    player.x = ship.position.x + 2;
    player.z = ship.position.z;
  }
  // Buy ship from NPC
  if (!shipOwned && Math.abs(player.x-npc.position.x)<2 && Math.abs(player.z-npc.position.z)<2) {
    if (keys['f'] && player.gold >= 50) {
      player.gold -= 50;
      shipOwned = true;
      ship.visible = true;
      reloadSpan.textContent = 'Bought Ship! Press E to board.';
    }
  }
  // Equip musket
  if (keys['1']) equipMusket();
  // Unequip musket
  if (keys['2']) unequipMusket();

  // Update camera position
  if (onShip) {
    // Move ship
    ship.position.x += dx;
    ship.position.z += dz;
    // Bobbing effect
    ship.position.y = 1 + Math.sin(Date.now()/600 + ship.position.x) * 0.3;
    camera.position.set(ship.position.x, ship.position.y+0.7, ship.position.z-2);
  } else {
    // Bob player if on water
    let bob = 0;
    if (Math.sqrt(player.x**2 + player.z**2) > 20) {
      bob = Math.sin(Date.now()/600 + player.x) * 0.2;
    }
    camera.position.set(player.x, player.y+bob, player.z);
  }
  camera.rotation.y = player.rotY;

  // HUD
  goldSpan.textContent = `Gold: ${player.gold}`;
}

function updateBullet() {
  if (!bullet) return;
  bullet.position.addScaledVector(bullet.direction, 0.6);
  // Remove bullet if out of view
  if (bullet.position.length() > 80) {
    scene.remove(bullet);
    bullet = null;
  }
}

function animate(time) {
  animateWaves(time);
  updatePlayer();
  updateBullet();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// ===== Instructions =====
reloadSpan.innerHTML +=
  "<br>Controls: WASD to move, Mouse left to look, F to buy ship, E to board, Q to leave ship, 1/2 to equip/unequip musket, Right click to aim & fire.";
