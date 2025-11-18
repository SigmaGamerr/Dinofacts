const dino = document.querySelector('.dino');
const gameContainer = document.querySelector('.game-container');
const gameOverText = document.querySelector('.game-over');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.querySelector('.score');

let isJumping = false;
let isCrouching = false;
let isGameOver = false;
let obstacles = [];
let score = 0;
let scoreInterval;

// ---- Tuning constants ----
const CONTAINER_WIDTH = 800;        // matches your starting left
const OBSTACLE_START_X = 800;       // where obstacles spawn
const MOVE_SPEED_PX_PER_TICK = 5;   // 5px every 20ms
const TICK_MS = 20;                 // update interval
const MIN_GAP_PX = 180;             // minimum gap so dino can fit/jump
const MAX_GAP_PX = 320;             // optional upper bound for variety
const MIN_SPAWN_MS = 1200;          // base spawn timing window
const MAX_SPAWN_MS = 2200;

// Jump function (restored original values)
function jump() {
  if (isJumping || isCrouching) return;
  isJumping = true;

  let position = 0;
  let velocity = 12;   // original jump strength
  const gravity = 0.6; // original gravity

  const jumpInterval = setInterval(() => {
    const effectiveGravity = isCrouching ? 1.2 : gravity;

    if (position <= 0 && velocity < 0) {
      clearInterval(jumpInterval);
      position = 0;
      dino.style.bottom = position + 'px';
      isJumping = false;
    } else {
      position += velocity;
      velocity -= gravity;
      velocity -= effectiveGravity;
      dino.style.bottom = position + 'px';
    }
  }, 20);
}

// Crouch
function crouch(start) {
  if (start) {
    isCrouching = true;
    dino.classList.add('crouch');
  } else {
    isCrouching = false;
    dino.classList.remove('crouch');
  }
}

// ---- Gap helpers ----
function getLastObstacle() {
  if (obstacles.length === 0) return null;
  return obstacles[obstacles.length - 1];
}

// Distance from last obstacle’s right edge to spawn point (800px)
function currentGapToSpawn() {
  const last = getLastObstacle();
  if (!last) return Infinity;
  const rect = last.getBoundingClientRect();
  // Convert rect.left from viewport to gameContainer coordinates using computed left
  // Easier: read inline style left, which you control during movement
  const left = parseFloat(last.style.left || OBSTACLE_START_X);
  const width = last.offsetWidth || 20;
  const lastRight = left + width;
  const gap = OBSTACLE_START_X - lastRight;
  return gap;
}

function randomSpawnDelay() {
  return MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS);
}

// ---- Fair spawn scheduler ----
function scheduleNextSpawn() {
  const delay = randomSpawnDelay();
  setTimeout(generateObstacle, delay);
}

// Generate obstacles (fair spacing)
function generateObstacle() {
  if (isGameOver) return;

  // If the last obstacle is too close to the spawn point, wait a bit and try again
  const gap = currentGapToSpawn();
  if (gap < MIN_GAP_PX) {
    // Poll until the gap is big enough; short delay keeps spawns responsive
    setTimeout(generateObstacle, 120);
    return;
  }

  const obstacle = document.createElement('div');
  obstacle.classList.add('obstacle');

  const type = Math.random() < 0.7 ? 'cactus' : 'bird';
  obstacle.classList.add(type);

  if (type === 'cactus') {
    const clusterSize = Math.floor(Math.random() * 3) + 1;
    obstacle.style.width = (20 * clusterSize) + 'px';
  } else {
    // birds fly higher so crouch matters; set a sensible vertical position via CSS or here
    // Example: obstacle.style.bottom = '40px'; // uncomment if you control bird height via JS
  }

  obstacle.style.left = OBSTACLE_START_X + 'px';
  gameContainer.appendChild(obstacle);
  obstacles.push(obstacle);

  moveObstacle(obstacle);

  // Schedule the next spawn (still random, but fairness is enforced above)
  scheduleNextSpawn();
}

// Move obstacle
function moveObstacle(obstacle) {
  let position = OBSTACLE_START_X;
  const moveInterval = setInterval(() => {
    if (isGameOver) {
      clearInterval(moveInterval);
      return;
    }
    position -= MOVE_SPEED_PX_PER_TICK;
    obstacle.style.left = position + 'px';

    if (position < -50) {
      obstacle.remove();
      obstacles = obstacles.filter(o => o !== obstacle);
      clearInterval(moveInterval);
    }

    checkCollision(obstacle);
  }, TICK_MS);
}

// Collision detection
function checkCollision(obstacle) {
  const dinoRect = dino.getBoundingClientRect();
  const obsRect = obstacle.getBoundingClientRect();

  // small forgiveness padding to reduce unfair hits
  const pad = 3;

  if (
    dinoRect.right - pad > obsRect.left &&
    dinoRect.left + pad < obsRect.right &&
    dinoRect.bottom - pad > obsRect.top &&
    dinoRect.top + pad < obsRect.bottom
  ) {
    isGameOver = true;
    gameOverText.style.display = 'block';
    restartBtn.style.display = 'block';
    obstacles.forEach(o => o.remove());
    obstacles = [];
    clearInterval(scoreInterval);
  }
}

// Controls
document.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'ArrowUp') {
    if (!isGameOver) jump();
  }
  if (event.key === 'ArrowDown') {
    if (!isGameOver) crouch(true);
  }
});
document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowDown') {
    crouch(false);
  }
});

// Restart button logic
restartBtn.addEventListener('click', () => {
  isGameOver = false;
  gameOverText.style.display = 'none';
  restartBtn.style.display = 'none';
  dino.style.bottom = '0px';
  score = 0;
  scoreDisplay.textContent = "Score: 0";

  // Clean up existing obstacles and timers
  obstacles.forEach(o => o.remove());
  obstacles = [];

  startScore();
  scheduleNextSpawn();
});

// Score counter
function startScore() {
  clearInterval(scoreInterval);
  scoreInterval = setInterval(() => {
    if (!isGameOver) {
      score++;
      scoreDisplay.textContent = "Score: " + score;
    }
  }, 100);
}

// Start game
startScore();
scheduleNextSpawn();
