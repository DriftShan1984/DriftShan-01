const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

let gameLoop;
let score = 0;
let lives = 3;
let isGameRunning = false;

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    bullets: [],
    lastShot: 0,
    shootInterval: 150
};

let enemies = [];
let enemySpawnInterval = 1000;
let lastEnemySpawn = 0;

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

function drawPlayer() {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x - 5, player.y + 20);
    ctx.lineTo(player.x + 5, player.y + 20);
    ctx.fill();

    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width + 5, player.y + 20);
    ctx.lineTo(player.x + player.width - 5, player.y + 20);
    ctx.fill();
}

function updatePlayer() {
    if (keys.ArrowUp || keys.w) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown || keys.s) {
        player.y += player.speed;
    }
    if (keys.ArrowLeft || keys.a) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight || keys.d) {
        player.x += player.speed;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    const now = Date.now();
    if (keys[' '] && now - player.lastShot > player.shootInterval) {
        player.bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 8
        });
        player.lastShot = now;
    }
}

function drawBullets() {
    ctx.fillStyle = '#f39c12';
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updateBullets() {
    player.bullets.forEach(bullet => {
        bullet.y -= bullet.speed;
    });
    player.bullets = player.bullets.filter(bullet => bullet.y + bullet.height > 0);
}

function spawnEnemy() {
    const size = Math.random() * 20 + 30;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 2 + 1,
        health: Math.floor(size / 15)
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);

        ctx.fillStyle = '#27ae60';
        const healthBarWidth = (enemy.health / 3) * enemy.width;
        ctx.fillRect(enemy.x, enemy.y - 8, healthBarWidth, 4);
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.y += enemy.speed;
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                enemy.health--;
                player.bullets.splice(bulletIndex, 1);

                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    scoreElement.textContent = score;
                }
            }
        });
    });

    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            enemies.splice(index, 1);
            lives--;
            livesElement.textContent = lives;

            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

function drawBackground() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34495e';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37 + Date.now() * 0.01) % canvas.width;
        const y = (i * 53 + Date.now() * 0.02) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
}

function game() {
    if (!isGameRunning) return;

    drawBackground();
    updatePlayer();
    drawPlayer();
    updateBullets();
    drawBullets();
    updateEnemies();
    drawEnemies();
    checkCollisions();

    const now = Date.now();
    if (now - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = now;
        
        if (enemySpawnInterval > 300) {
            enemySpawnInterval -= 10;
        }
    }

    gameLoop = requestAnimationFrame(game);
}

function startGame() {
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    player.bullets = [];
    enemies = [];
    enemySpawnInterval = 1000;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    isGameRunning = true;
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    game();
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
