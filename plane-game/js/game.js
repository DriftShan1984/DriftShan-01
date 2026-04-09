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
let lives = 10;
let isGameRunning = false;

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    hitboxWidth: 6,
    hitboxHeight: 6,
    speed: 3,
    bullets: [],
    lastShot: 0,
    shootInterval: 1100,
    bulletWidth: 8,
    bulletHeight: 20,
    bulletSpeed: 8,
    bulletRows: 1
};

let enemies = [];
let enemyBullets = [];
let boss = null;
let bossDeathTime = 0;
let bossSpawnScore = 100;
let waveCount = 0;
let boss1Appearances = 0;
let boss2Appearances = 0;
let boss2Kills = 0;
let boss3Appearances = 0;
let boss3BulletRadius = 30;
let playerSpeedBoost = 0;
let boss2IntervalReduction = 0;
let boss1BulletGrowth = 0;
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

let mouseX = null;
let mouseY = null;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', () => {
    mouseX = null;
    mouseY = null;
});

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

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function updatePlayer() {
    if (mouseX !== null && mouseY !== null) {
        const targetX = mouseX - player.width / 2;
        const targetY = mouseY - player.height / 2;
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 2) {
            const moveSpeed = Math.min(player.speed, dist);
            player.x += (dx / dist) * moveSpeed;
            player.y += (dy / dist) * moveSpeed;
        }
    } else {
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
    }

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    const now = Date.now();
    if (now - player.lastShot > player.shootInterval) {
        const colCount = player.bulletRows;
        const colSpacing = 20;
        for (let i = 0; i < colCount; i++) {
            const offsetX = (i - (colCount - 1) / 2) * colSpacing;
            player.bullets.push({
                x: player.x + player.width / 2 - player.bulletWidth / 2 + offsetX,
                y: player.y,
                width: player.bulletWidth,
                height: player.bulletHeight,
                hitboxWidth: player.bulletWidth + 6,
                hitboxHeight: player.bulletHeight + 4,
                speed: player.bulletSpeed
            });
        }
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
    player.bullets = player.bullets.filter(bullet => bullet.y + bullet.hitboxHeight > 0);
}

function spawnEnemy() {
    const size = 100;
    const baseSpeed = 0.3;
    const speedBonus = Math.floor(score / 100) * 0.1;
    const maxBonus = 1;
    const speed = baseSpeed + Math.random() * 0.2 + Math.min(speedBonus, maxBonus);
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: speed,
        health: 2,
        lastShot: 0,
        shootInterval: 11000
    });
}

function updateEnemyBullets() {
    const now = Date.now();
    const bulletSpeedBase = 1.2;
    const bulletSpeedBonus = Math.min(Math.floor(score / 100) * 0.1, 0.6);
    const bulletSpeed = bulletSpeedBase + bulletSpeedBonus;
    
    enemies.forEach(enemy => {
        if (now - enemy.lastShot > enemy.shootInterval) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 12,
                vx: 0,
                vy: bulletSpeed,
                fromBoss: false
            });
            enemy.lastShot = now;
        }
    });
    
    enemyBullets.forEach(bullet => {
        if (bullet.vx !== undefined) {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            if (bullet.bouncing) {
                const radius = bullet.radius || Math.max(bullet.width, bullet.height) / 2;
                if (bullet.x - radius <= 0 || bullet.x + radius >= canvas.width) {
                    bullet.vx = -bullet.vx;
                    bullet.x = Math.max(radius, Math.min(canvas.width - radius, bullet.x));
                }
                if (bullet.y - radius <= 0) {
                    bullet.vy = -bullet.vy;
                    bullet.y = radius;
                }
                if (bullet.bounceBottom && bullet.y + radius >= canvas.height) {
                    bullet.vy = -bullet.vy;
                    bullet.y = canvas.height - radius;
                }
            }
        } else {
            bullet.y += 1;
        }
    });
    enemyBullets = enemyBullets.filter(bullet => 
        bullet.y < canvas.height + 20 &&
        bullet.y + bullet.height > -20 &&
        bullet.x > -20 &&
        bullet.x < canvas.width + 20
    );
}

function drawEnemyBullets() {
    ctx.fillStyle = '#e74c3c';
    enemyBullets.forEach(bullet => {
        if (bullet.isCircle) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
}

function spawnBoss() {
    waveCount++;
    const bossHealth = 15 * waveCount;
    const bossType = waveCount % 3;
    const isBoss1 = bossType === 1;
    const isBoss2 = bossType === 2;
    const isBoss3 = bossType === 0;
    
    if (isBoss1) {
        boss1Appearances++;
        boss1BulletGrowth = Math.min(boss1Appearances, 5);
    } else if (isBoss2) {
        boss2Appearances++;
        boss2IntervalReduction = Math.min(boss2Appearances * 30, 1100);
    } else if (isBoss3) {
        boss3Appearances++;
    }
    
    let shootInterval = 100;
    let bulletWidth = 11;
    let bulletHeight = 11;
    
    if (isBoss1) {
        bulletWidth += boss1BulletGrowth;
        bulletHeight += boss1BulletGrowth;
    } else if (isBoss2) {
        shootInterval = Math.max(4100, 600 - boss2IntervalReduction);
    } else if (isBoss3) {
        shootInterval = 800;
        boss3BulletRadius = Math.min(30 + boss3Appearances * 2, 40);
    }
    
    boss = {
        type: isBoss1 ? 'boss1' : (isBoss2 ? 'boss2' : 'boss3'),
        x: canvas.width / 2,
        y: -70,
        radius: isBoss3 ? 80 : (isBoss2 ? 70 : 60),
        health: bossHealth,
        maxHealth: bossHealth,
        angle: 0,
        spiralAngle: 0,
        lastShot: 0,
        shootInterval: shootInterval,
        invincible: true,
        canAttack: false,
        targetY: isBoss3 ? 1100 : (isBoss2 ? 120 : 100),
        invincibleEndTime: 0,
        bulletWidth: bulletWidth,
        bulletHeight: bulletHeight,
        hasShotBoss3: false,
        normalBulletInterval: 600,
        lastNormalShot: 0
    };
}

function updateBoss() {
    if (!boss) return;
    
    if (boss.dying) {
        const blinkDuration = 400;
        const bulletClearDelay = 1000;
        const totalTime = Date.now() - boss.dyingStart;
        
        if (totalTime >= blinkDuration + bulletClearDelay) {
            enemyBullets = enemyBullets.filter(bullet => !bullet.fromBoss);
            bossDeathTime = Date.now();
            boss = null;
        }
        return;
    }
    
    if (boss.y < boss.targetY) {
        boss.y += 1;
    }
    
    if (boss.invincible && enemies.length === 0 && !boss.canAttack) {
        boss.canAttack = true;
        boss.invincibleEndTime = Date.now() + 2000;
    }
    
    if (boss.canAttack && Date.now() >= boss.invincibleEndTime) {
        boss.invincible = false;
    }
    
    if (boss.invincible) return;
    
    const now = Date.now();
    
    if (boss.type === 'boss1') {
        boss.spiralAngle += 0.08;
        if (now - boss.lastShot > boss.shootInterval) {
            for (let i = 0; i < 4; i++) {
                const angle = boss.spiralAngle + (i * Math.PI / 4);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * 30,
                    y: boss.y + Math.sin(angle) * 30,
                    width: boss.bulletWidth,
                    height: boss.bulletHeight,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    bouncing: false,
                    fromBoss: true
                });
            }
            
            const innerAngle = boss.spiralAngle * 1.5;
            for (let i = 0; i < 6; i++) {
                const angle = innerAngle + (i * Math.PI / 6);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * 20,
                    y: boss.y + Math.sin(angle) * 20,
                    width: boss.bulletWidth * 0.75,
                    height: boss.bulletHeight * 0.75,
                    vx: Math.cos(angle) * 0.625,
                    vy: Math.sin(angle) * 0.625,
                    bouncing: false,
                    fromBoss: true
                });
            }
            boss.lastShot = now;
        }
    } else if (boss.type === 'boss2') {
        boss.spiralAngle += 0.15;
        boss.x = canvas.width / 2 + Math.sin(boss.spiralAngle * 0.15) * 30;
        if (boss.x < boss.radius) boss.x = boss.radius;
        if (boss.x > canvas.width - boss.radius) boss.x = canvas.width - boss.radius;
        
        if (now - boss.lastShot > boss.shootInterval) {
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4 + Math.PI / 8;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    width: 10,
                    height: 10,
                    vx: Math.cos(angle) * 0.375,
                    vy: Math.sin(angle) * 0.375,
                    bouncing: true,
                    bounceBottom: false,
                    fromBoss: true
                });
            }
            boss.lastShot = now;
        }
        
        if (now - boss.lastNormalShot > boss.normalBulletInterval) {
            enemyBullets.push({
                x: boss.x - 45,
                y: boss.y + boss.radius,
                width: 12,
                height: 20,
                vx: 0,
                vy: 3,
                bouncing: false,
                fromBoss: true
            });
            enemyBullets.push({
                x: boss.x + 45,
                y: boss.y + boss.radius,
                width: 12,
                height: 20,
                vx: 0,
                vy: 3,
                bouncing: false,
                fromBoss: true
            });
            boss.lastNormalShot = now;
        }
    } else if (boss.type === 'boss3') {
        boss.spiralAngle += 0.05;
        if (now - boss.lastShot > boss.shootInterval && !boss.hasShotBoss3) {
            const baseAngles = [32.5, 77.5, 122.5, 167.5, 212.5, 257.5, 3025, 347.5];
            const indices = [0, 1, 2, 3, 4, 5, 6, 7];
            const selected = [];
            for (let i = 0; i < 3; i++) {
                const randIdx = Math.floor(Math.random() * indices.length);
                selected.push(indices.splice(randIdx, 1)[0]);
            }
            const radius = boss3BulletRadius;
            const halfSize = radius * 2;
            for (let i = 0; i < selected.length; i++) {
                const angle = baseAngles[selected[i]] * Math.PI / 180;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    radius: radius,
                    width: halfSize,
                    height: halfSize,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    bouncing: true,
                    bounceBottom: true,
                    fromBoss: true,
                    isCircle: true,
                    persistent: true,
                    overlapping: false
                });
            }
            boss.hasShotBoss3 = true;
            boss.lastShot = now;
        }
    }
}

function drawBoss() {
    if (!boss) return;
    
    if (boss.dying) {
        const elapsed = Date.now() - boss.dyingStart;
        const blinkDuration = 400;
        if (elapsed > blinkDuration) return;
        const blinkPhase = Math.floor(elapsed / 100) % 2;
        if (blinkPhase === 0) return;
    }
    
    if (boss.invincible) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (boss.type === 'boss1') {
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius - 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(boss.x - 15, boss.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(boss.x + 15, boss.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
    } else if (boss.type === 'boss2') {
        ctx.fillStyle = '#16a085';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1abc9c';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius - 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(boss.x - 20, boss.y - 5, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(boss.x + 20, boss.y - 5, 10, 0, Math.PI * 2);
        ctx.fill();
    } else if (boss.type === 'boss3') {
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius - 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(boss.x - 25, boss.y - 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(boss.x + 25, boss.y - 10, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#27ae60';
    const healthBarWidth = (boss.health / boss.maxHealth) * boss.radius * 2;
    ctx.fillRect(boss.x - boss.radius, boss.y - boss.radius - 15, healthBarWidth, 8);
    ctx.strokeStyle = '#2c3e100';
    ctx.strokeRect(boss.x - boss.radius, boss.y - boss.radius - 15, boss.radius * 2, 8);
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
        if (boss && !boss.invincible && !boss.dying) {
            const dx = bullet.x + bullet.hitboxWidth / 2 - boss.x;
            const dy = bullet.y + bullet.hitboxHeight / 2 - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < boss.radius + bullet.hitboxWidth / 2) {
                boss.health--;
                player.bullets.splice(bulletIndex, 1);
                if (boss.health <= 0) {
                    lives += 5;
                    livesElement.textContent = lives;
                    if (boss.type === 'boss2') {
                        boss2Kills++;
                        if (boss2Kills === 2 || boss2Kills === 5) {
                            player.bulletRows = Math.min(player.bulletRows + 1, 3);
                        }
                    }
                    if (boss.type === 'boss3' && playerSpeedBoost < 8) {
                        player.shootInterval = Math.max(100, player.shootInterval - 10);
                        playerSpeedBoost++;
                    }
                    boss.dying = true;
                    boss.dyingStart = Date.now();
                    boss.dyingBulletsClear = false;
                }
            }
        }
        
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.hitboxWidth > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.hitboxHeight > enemy.y) {
                
                enemy.health--;
                player.bullets.splice(bulletIndex, 1);

                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    let points = enemy.health === 3 ? 15 : (enemy.health === 2 ? 10 : 5);
                    score += points;
                    scoreElement.textContent = score;
                }
            }
        });
    });

    enemies.forEach((enemy, index) => {
        const playerHitboxX = player.x + (player.width - player.hitboxWidth) / 2;
        const playerHitboxY = player.y + (player.height - player.hitboxHeight) / 2;
        if (playerHitboxX < enemy.x + enemy.width &&
            playerHitboxX + player.hitboxWidth > enemy.x &&
            playerHitboxY < enemy.y + enemy.height &&
            playerHitboxY + player.hitboxHeight > enemy.y) {
            
            enemies.splice(index, 1);
            lives--;
            livesElement.textContent = lives;

            if (lives <= 0) {
                gameOver();
            }
        }
    });

    enemyBullets.forEach((bullet, index) => {
        const playerHitboxX = player.x + (player.width - player.hitboxWidth) / 2;
        const playerHitboxY = player.y + (player.height - player.hitboxHeight) / 2;
        
        let collision = false;
        if (bullet.isCircle) {
            const dx = playerHitboxX + player.hitboxWidth / 2 - bullet.x;
            const dy = playerHitboxY + player.hitboxHeight / 2 - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            collision = dist < bullet.radius + player.hitboxWidth / 2;
        } else {
            collision = playerHitboxX < bullet.x + bullet.width &&
                playerHitboxX + player.hitboxWidth > bullet.x &&
                playerHitboxY < bullet.y + bullet.height &&
                playerHitboxY + player.hitboxHeight > bullet.y;
        }
        
        if (collision && !bullet.overlapping) {
            if (!bullet.persistent) {
                enemyBullets.splice(index, 1);
            }
            if (bullet.persistent) {
                bullet.overlapping = true;
            }
            lives--;
            livesElement.textContent = lives;

            if (lives <= 0) {
                gameOver();
            }
        } else if (!collision) {
            bullet.overlapping = false;
        }
    });

    if (boss) {
        const playerHitboxX = player.x + (player.width - player.hitboxWidth) / 2;
        const playerHitboxY = player.y + (player.height - player.hitboxHeight) / 2;
        const dx = playerHitboxX + player.hitboxWidth / 2 - boss.x;
        const dy = playerHitboxY + player.hitboxHeight / 2 - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < boss.radius + player.hitboxWidth) {
            lives--;
            livesElement.textContent = lives;
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}

function drawBackground() {
    ctx.fillStyle = '#2c3e100';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34495e';
    for (let i = 0; i < 100; i++) {
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
    updateEnemyBullets();
    drawEnemyBullets();
    updateBoss();
    drawBoss();
    updateEnemies();
    drawEnemies();
    checkCollisions();

    const now = Date.now();
    if (!boss && score >= bossSpawnScore) {
        spawnBoss();
        bossSpawnScore += 100;
    }
    
    const canSpawnEnemies = !boss && (bossDeathTime === 0 || now - bossDeathTime > 3000);
    if (canSpawnEnemies && now - lastEnemySpawn > enemySpawnInterval) {
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
    lives = 10;
    bossSpawnScore = 100;
    waveCount = 0;
    boss1Appearances = 0;
    boss2Appearances = 0;
    boss2Kills = 0;
    boss3Appearances = 0;
    boss3BulletRadius = 30;
    playerSpeedBoost = 0;
    boss2IntervalReduction = 0;
    boss1BulletGrowth = 0;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    player.bullets = [];
    enemies = [];
    enemyBullets = [];
    boss = null;
    enemySpawnInterval = 1000;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.bulletWidth = 8;
    player.bulletHeight = 20;
    player.bulletSpeed = 8;
    player.shootInterval = 1100;
    player.bulletRows = 1;
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
