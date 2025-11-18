const dino = document.querySelector('.dino');
const tree = document.querySelector('.tree');
const gameOverText = document.querySelector('.game-over');
let isJumping = false;
let isGameOver = false;

// Dino jump function
function jump() {
  if (isJumping) return; // Prevent multiple jumps
  isJumping = true;

  let position = 0;
  const upInterval = setInterval(() => {
    if (position >= 150) {
      clearInterval(upInterval);
      const downInterval = setInterval(() => {
        if (position <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        }
        position -= 10;
        dino.style.bottom = position + 'px';
      }, 20);
    }
    position += 10;
    dino.style.bottom = position + 'px';
  }, 20);
}

// Collision detection
function checkCollision() {
  const dinoRect = dino.getBoundingClientRect();
  const treeRect = tree.getBoundingClientRect();

  if (
    dinoRect.right > treeRect.left &&
    dinoRect.left < treeRect.right &&
    dinoRect.bottom > treeRect.top &&
    dinoRect.top < treeRect.bottom
  ) {
    isGameOver = true;
    tree.style.animation = 'none';
    gameOverText.style.display = 'block';
  }
}

// Listen for key presses
document.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'ArrowUp') {
    if (!isGameOver) jump();
  }
});

// Run collision detection continuously
setInterval(() => {
  if (!isGameOver) checkCollision();
}, 20);
