// Simple singleplayer naval shooter demo

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player ship properties
let player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  w: 40,
  h: 60,
  color: "#00aaff"
};

// Key states
let keys = {};

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Main game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  // Move player left/right
  if (keys["ArrowLeft"] && player.x > 0) player.x -= 5;
  if (keys["ArrowRight"] && player.x < canvas.width - player.w) player.x += 5;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw player ship
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // Add more game drawing here!
}

// Start loop
gameLoop();
