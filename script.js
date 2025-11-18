const dino = document.querySelector('.dino');
const gameContainer = document.querySelector('.game-container');
const gameOverText = document.querySelector('.game-over');
const restartBtn = document.getElementById('restart-btn');

let isJumping = false;
let isCrouching = false;
let isGameOver = false;
let obstacles = [];

// Jump function (smooth arc)
function jump() {
  if (isJumping || isCrouching) return;
  isJumping = true;

  let position = 0;
  let velocity = 12; // jump speed
  const gravity = 0.6;

  const jumpInterval = setInterval(() => {
    if (position <= 0 && velocity < 0) {
      clearInterval(jumpInterval);
      position = 0;
      dino.style.bottom = position + 'px';
      isJumping = false;
    } else {
      position += velocity;
      velocity -= gravity;
      dino.style.bottom = position + 'px';
    }
  }, 20);
}

// Crouch function
function crouch(start) {
  if (start) {
    isCrouching = true;
    dino.classList.add('crouch');
  } else {
    isCrouching = false;
    dino.classList.remove('crouch');
  }
}

// Generate obstacles randomly
function generateObstacle() {
  if (isGameOver) return;

  const obstacle = document.createElement('div');
  obstacle.classList.add('obstacle');

  const type = Math.random() < 0.7 ? 'cactus' : 'bird'; // 70% cactus, 30% bird
  obstacle.classList.add(type);

  // Multiple cactus cluster
  if (type === 'cactus') {
    const clusterSize = Math.floor(Math.random() * 3) + 1; // 1–3 cactus
    obstacle.style.width = 20 * clusterSize + 'px';
  }

  obstacle.style.left = '800px';
  gameContainer.appendChild(obstacle);
  obstacles.push(obstacle);

  moveObstacle(obstacle);
  const nextSpawn = Math.random() * 2000 + 1500; // random spawn time
  setTimeout(generateObstacle, nextSpawn);
}

// Move obstacle
function moveObstacle(obstacle) {
  let position = 800;
  const moveInterval = setInterval(() => {
    if (isGameOver) {
      clearInterval(moveInterval);
      return;
    }
    position -= 5;
    obstacle.style.left = position + 'px';

    if (position < -50) {
      obstacle.remove();
      obstacles = obstacles.filter(o => o !== obstacle);
      clearInterval(moveInterval);
    }

    checkCollision(obstacle);
  }, 20);
}

// Collision detection
function checkCollision(obstacle) {
  const dinoRect = dino.getBoundingClientRect();
  const obsRect = obstacle.getBoundingClientRect();

  if (
    dinoRect.right > obsRect.left &&
    dinoRect.left < obsRect.right &&
    dinoRect.bottom > obsRect.top &&
    dinoRect.top < obsRect.bottom
  ) {
    isGameOver = true;
    gameOverText.style.display = 'block';
    restartBtn.style.display = 'block';
    obstacles.forEach(o => o.remove());
    obstacles = [];
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

// Restart
restartBtn.addEventListener('click', () => {
  isGameOver = false;
  gameOverText.style.display = 'none';
  restartBtn.style.display = 'none';
  dino.style.bottom = '0px';
  generateObstacle();
});

// Start game
generateObstacle();
