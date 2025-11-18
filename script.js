// ===== Canvas setup =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== Dino =====
const dino = {
  x: 60,
  y: 0,                // will be set to ground on init
  width: 44,
  height: 44,
  jumping: false,
  velocityY: 0
};

// ===== World =====
const groundY = () => canvas.height - 60;   // ground baseline
const gravity = 0.7;
let gameSpeed = 4;                           // base speed, scales up
let isPaused = false;
let isGameOver = false;

// ===== Obstacles =====
let obstacles = [];
let lastSpawnTime = 0;
let spawnIntervalMs = 1400;                  // base interval, randomized each spawn
const MIN_GAP = 180;                         // minimum pixels between obstacles (fairness)
const MAX_GAP = 320;                         // maximum gap for variety
const obstacleTypes = [
  { width: 26, height: 46 },                 // small cactus
  { width: 34, height: 54 },                 // medium cactus
  { width: 48, height: 64 }                  // large cactus
];

// ===== Score / Difficulty =====
let score = 0;
let highScore = 0;
let frames = 0;

// ===== Helpers =====
function resetGame() {
  obstacles = [];
  score = 0;
  frames = 0;
  gameSpeed = 4;
  isGameOver = false;
  dino.y = groundY() - dino.height;
  dino.jumping = false;
  dino.velocityY = 0;
  lastSpawnTime = 0;
  spawnIntervalMs = 1400;
}

function fairGapReady() {
  if (obstacles.length === 0) return true;
  const last = obstacles[obstacles.length - 1];
  // Distance from last obstacle's current x to right edge
  const gap = canvas.width - last.x;
  return gap > MIN_GAP;
}

// Randomize next spawn interval with bounds
function randomizeSpawnInterval() {
  spawnIntervalMs = 1100 + Math.random() * 800; // 1100–1900ms
}

// ===== Input =====
function jump() {
  if (isGameOver || isPaused) return;
  if (!dino.jumping) {
    dino.jumping = true;
    dino.velocityY = -13.5; // jump strength
  }
}

function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;
}

function handleKeydown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    jump();
  } else if (e.code === "KeyP") {
    togglePause();
  } else if (e.code === "KeyR") {
    resetGame();
  }
}
document.addEventListener("keydown", handleKeydown);

// ===== Physics =====
function updateDino() {
  dino.y += dino.velocityY;
  dino.velocityY += gravity;

  // Ground collision
  const groundLine = groundY();
  if (dino.y >= groundLine - dino.height) {
    dino.y = groundLine - dino.height;
    dino.jumping = false;
  }
}

// ===== Spawning =====
function spawnObstacle(timestamp) {
  if (timestamp - lastSpawnTime < spawnIntervalMs) return;
  if (!fairGapReady()) return;

  // Pick a random obstacle type
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const obHeight = type.height;
  const obWidth = type.width;

  // Place at ground
  obstacles.push({
    x: canvas.width,
    y: groundY() - obHeight,
    width: obWidth,
    height: obHeight,
    passed: false
  });

  lastSpawnTime = timestamp;

  // Randomize spawn interval AND enforce max gap fairness simultaneously
  randomizeSpawnInterval();
}

// ===== Obstacles update =====
function updateObstacles() {
  for (let ob of obstacles) {
    ob.x -= gameSpeed;

    // Mark as passed for scoring
    if (!ob.passed && ob.x + ob.width < dino.x) {
      ob.passed = true;
      score += 1;
      // Gradual difficulty bump
      if (score % 5 === 0) {
        gameSpeed = Math.min(gameSpeed + 0.4, 12); // cap top speed
      }
    }
  }
  // Remove off-screen obstacles
  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
}

// ===== Collision (with slight padding forgiveness) =====
function collide(a, b) {
  const pad = 4; // makes hitbox a tiny bit smaller for fairness
  return (
    a.x + pad < b.x + b.width &&
    a.x + a.width - pad > b.x &&
    a.y + pad < b.y + b.height &&
    a.y + a.height - pad > b.y
  );
}

function checkCollision() {
  for (let ob of obstacles) {
    if (collide(dino, ob)) {
      isGameOver = true;
      highScore = Math.max(highScore, score);
      break;
    }
  }
}

// ===== Draw =====
function drawBackground() {
  // Sky
  ctx.fillStyle = "#f7f7f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground line
  ctx.fillStyle = "#444";
  ctx.fillRect(0, groundY() + 40, canvas.width, 2);

  // Parallax ground dots
  ctx.fillStyle = "#888";
  for (let i = 0; i < canvas.width; i += 28) {
    ctx.fillRect((i - (frames % 28)), groundY() + 20, 6, 2);
  }
}

function drawDino() {
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
}

function drawObstacles() {
  ctx.fillStyle = "#b71c1c";
  for (let ob of obstacles) {
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
  }
}

function drawHUD() {
  ctx.fillStyle = "#333";
  ctx.font = "16px monospace";
  ctx.fillText(`Score: ${score}`, 16, 24);
  ctx.fillText(`High: ${highScore}`, 16, 44);
  ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 16, 64);
  if (isPaused) ctx.fillText("Paused (P)", canvas.width - 120, 24);
  if (isGameOver) {
    ctx.fillStyle = "#000";
    ctx.font = "20px monospace";
    ctx.fillText("Game Over! Press R to reset", canvas.width / 2 - 140, canvas.height / 2);
  }
}

// ===== Game loop =====
function update(timestamp) {
  if (isPaused || isGameOver) return;

  frames++;
  updateDino();
  spawnObstacle(timestamp);
  updateObstacles();
  checkCollision();
}

function render() {
  drawBackground();
  drawDino();
  drawObstacles();
  drawHUD();
}

function loop(timestamp) {
  update(timestamp);
  render();
  requestAnimationFrame(loop);
}

// ===== Init =====
function init() {
  // Ensure dino starts on ground
  dino.y = groundY() - dino.height;
  resetGame();
  requestAnimationFrame(loop);
}

init();
