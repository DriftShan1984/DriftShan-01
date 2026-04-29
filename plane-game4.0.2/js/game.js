const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const challengeBtn = document.getElementById('challengeBtn');
const restartBtn = document.getElementById('restartBtn');
const returnBtn = document.getElementById('returnBtn');
const pauseBtn = document.getElementById('pauseBtn');

let gameLoop;
let score = 0;
let lives = 10;
let isGameRunning = false;
let isPaused = false;
let challengeMode = false;
let gameStartTime = 0;
let totalDamage = 0;
let lastDamageUpdate = 0;

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
    shootInterval: 200,
    bulletWidth: 6,
    bulletHeight: 12,
    bulletSpeed: 8,
    bulletRows: 1
};

let enemies = [];
let enemyBullets = [];
let boss = null;
let bossDeathTime = 0;
let waveCount = 0;

let enemySpawnInterval = 1000;
let lastEnemySpawn = 0;

const ENEMY_CONFIG = {
    enemy1: {
        size: 50,
        baseSpeed: 0.3,
        speedBonusPerScore: 0.1,
        maxSpeedBonus: 1,
        randomSpeedRange: 0.2,
        health: 2,
        shootInterval: 1500,
        bulletSpeedBase: 1.2,
        bulletSpeedBonusPerScore: 0.1,
        maxBulletSpeedBonus: 0.6,
        bulletWidth: 6,
        bulletHeight: 12,
        points: 10
    }
};

const BOSS_CONFIG = {
    boss1: {
        radius: 60,
        baseHealth: 50,
        targetY: 100,
        invincibleTime: 2000,
        spiralBulletCount: 4,
        innerBulletCount: 6,
        spiralAngleSpeed: 0.08,
        bulletSpeed: 0.5,
        innerBulletSpeed: 0.625,
        shootInterval: 100,
        baseBulletSize: 11,
        bulletGrowthPerAppear: 1,
        maxBulletGrowth: 4,
        rewardType: 'bulletSize',
        rewardAmount: { width: 2, height: 3 }
    },
    boss2: {
        radius: 70,
        baseHealth: 50,
        targetY: 120,
        invincibleTime: 2000,
        bounceBulletCount: 8,
        bulletSpeed: 0.375,
        shootInterval: 600,
        intervalReductionPerAppear: 30,
        maxIntervalReduction: 150,
        normalBulletInterval: 600,
        normalBulletWidth: 12,
        normalBulletHeight: 20,
        normalBulletSpeed: 3,
        normalBulletOffset: 45,
        rewardType: 'bulletRows',
        rewardAppears: [2, 5]
    },
    boss3: {
        radius: 80,
        baseHealth: 50,
        targetY: 150,
        invincibleTime: 2000,
        shootInterval: 800,
        baseRadius: 30,
        radiusGrowthPerAppear: 2,
        maxRadiusGrowth: 10,
        bulletSpeed: 3,
        directionCount: 3,
        rewardType: 'shootInterval',
        rewardAmount: 20,
        maxRewardCount: 4
    },
    bossSpl: {
        radius: 90,
        baseHealth: 9999999,
        targetY: 100,
        invincibleTime: 2000,
        shootInterval: 500,
        spiralBulletCount: 4,
        innerBulletCount: 6,
        spiralAngleSpeed: 0.08,
        bulletSpeed: 0.5,
        innerBulletSpeed: 0.625,
        spawnOffset: 30,
        innerOffset: 20,
        bounceBulletCount: 8,
        bounceBulletSpeed: 0.375,
        bounceOffset: 0,
        normalBulletInterval: 600,
        normalBulletWidth: 12,
        normalBulletHeight: 20,
        normalBulletSpeed: 3,
        normalBulletOffset: 45,
        baseRadius: 30,
        bulletSpeedBoss3: 2,
        directionCount: 3,
        trackBulletInterval: 400,
        trackBulletSpeed: 2,
        rewardType: 'none',
        rewardAmount: 0
    }
};

let bossStats = {
    boss1Appearances: 0,
    boss2Appearances: 0,
    boss2Kills: 0,
    boss3Appearances: 0,
    splAppearances: 0,
    boss1BulletGrowth: 0,
    boss2IntervalReduction: 0,
    boss3BulletRadius: 30,
    playerSpeedBoost: 0,
    bossSpawnScore: 100
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false,
    Escape: false
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
    if (e.key === 'Escape' && isGameRunning) {
        togglePause();
        return;
    }
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
        if (keys.ArrowUp || keys.w) player.y -= player.speed;
        if (keys.ArrowDown || keys.s) player.y += player.speed;
        if (keys.ArrowLeft || keys.a) player.x -= player.speed;
        if (keys.ArrowRight || keys.d) player.x += player.speed;
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
    const config = ENEMY_CONFIG.enemy1;
    const speedBonus = Math.floor(score / 100) * config.speedBonusPerScore;
    const speed = config.baseSpeed + Math.random() * config.randomSpeedRange + Math.min(speedBonus, config.maxSpeedBonus);
    
    enemies.push({
        type: 'enemy1',
        x: Math.random() * (canvas.width - config.size),
        y: -config.size,
        width: config.size,
        height: config.size,
        speed: speed,
        health: config.health,
        lastShot: 0,
        shootInterval: config.shootInterval
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.y += enemy.speed;
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

function updateEnemyBullets() {
    const config = ENEMY_CONFIG.enemy1;
    const bulletSpeed = config.bulletSpeedBase + Math.min(Math.floor(score / 100) * config.bulletSpeedBonusPerScore, config.maxBulletSpeedBonus);
    const now = Date.now();
    
    enemies.forEach(enemy => {
        if (now - enemy.lastShot > enemy.shootInterval) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - config.bulletWidth / 2,
                y: enemy.y + enemy.height,
                width: config.bulletWidth,
                height: config.bulletHeight,
                vx: 0,
                vy: bulletSpeed,
                color: '#e74c3c',
                fromBoss: false
            });
            enemy.lastShot = now;
        }
    });
    
    enemyBullets.forEach(bullet => {
        if (bullet.vx !== undefined) {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            if (bullet.tracking && bullet.targetX !== undefined) {
                const dx = bullet.targetX - bullet.x;
                bullet.vx = dx * 0.05;
            }
            
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
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color || '#e74c3c';
        if (bullet.isCircle) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
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

function spawnBoss() {
    waveCount++;
    let bossTypeName;
    let config;
    
    if (challengeMode) {
        bossTypeName = 'bossSpl';
        config = BOSS_CONFIG.bossSpl;
        bossStats.splAppearances++;
    } else {
        const bossType = waveCount % 3;
        bossTypeName = bossType === 1 ? 'boss1' : (bossType === 2 ? 'boss2' : 'boss3');
        config = BOSS_CONFIG[bossTypeName];
        
        if (bossTypeName === 'boss1') {
            bossStats.boss1Appearances++;
            bossStats.boss1BulletGrowth = Math.min(bossStats.boss1Appearances, config.maxBulletGrowth);
        } else if (bossTypeName === 'boss2') {
            bossStats.boss2Appearances++;
            bossStats.boss2IntervalReduction = Math.min(bossStats.boss2Appearances * config.intervalReductionPerAppear, config.maxIntervalReduction);
        } else if (bossTypeName === 'boss3') {
            bossStats.boss3Appearances++;
        }
    }
    
    const health = challengeMode ? config.baseHealth : 50 + 10 * (waveCount - 1);
    let bulletWidth = config.baseBulletSize || 11;
    let bulletHeight = config.baseBulletSize || 11;
    let shootInterval = config.shootInterval;
    
    if (!challengeMode) {
        if (bossTypeName === 'boss1') {
            bulletWidth += bossStats.boss1BulletGrowth;
            bulletHeight += bossStats.boss1BulletGrowth;
        } else if (bossTypeName === 'boss2') {
            shootInterval = Math.max(450, config.shootInterval - bossStats.boss2IntervalReduction);
        } else if (bossTypeName === 'boss3') {
            bossStats.boss3BulletRadius = Math.min(config.baseRadius + bossStats.boss3Appearances * config.radiusGrowthPerAppear, config.baseRadius + config.maxRadiusGrowth);
        }
    }
    
    boss = {
        type: bossTypeName,
        config: config,
        x: canvas.width / 2,
        y: -config.radius - 10,
        radius: config.radius,
        health: health,
        maxHealth: health,
        spiralAngle: 0,
        lastShot: 0,
        shootInterval: shootInterval,
        invincible: true,
        canAttack: false,
        targetY: config.targetY,
        invincibleEndTime: 0,
        invincibleDuration: config.invincibleTime,
        bulletWidth: bulletWidth,
        bulletHeight: bulletHeight,
        hasShotBoss3: false,
        lastNormalShot: 0,
        lastTrackShot: 0,
        playerHistory: [],
        justBecameVulnerable: false,
        dying: false,
        dyingStart: 0
    };
}

function updateBoss() {
    if (!boss) return;
    
    if (boss.dying) {
        const blinkDuration = 400;
        const bulletClearDelay = 1000;
        if (Date.now() - boss.dyingStart >= blinkDuration + bulletClearDelay) {
            enemyBullets = enemyBullets.filter(bullet => !bullet.fromBoss);
            bossDeathTime = Date.now();
            boss = null;
        }
        return;
    }
    
    if (boss.y < boss.targetY) {
        boss.y += 1;
        return;
    }
    
    if (boss.invincible) {
        if (challengeMode) {
            boss.invincible = false;
            boss.justBecameVulnerable = true;
        } else {
            if (enemies.length === 0 && !boss.canAttack) {
                boss.canAttack = true;
                boss.invincibleEndTime = Date.now() + boss.invincibleDuration;
            }
            if (boss.canAttack && Date.now() >= boss.invincibleEndTime) {
                boss.invincible = false;
                boss.justBecameVulnerable = true;
            }
        }
        if (boss.invincible) return;
    }
    
    const now = Date.now();
    const type = boss.type;
    const config = boss.config;
    
    if (boss.justBecameVulnerable) {
        boss.lastShot = now - boss.shootInterval;
        boss.lastNormalShot = now - config.normalBulletInterval;
        boss.justBecameVulnerable = false;
    }
    
    if (type === 'boss1') {
        boss.spiralAngle += config.spiralAngleSpeed;
        if (now - boss.lastShot > boss.shootInterval) {
            for (let i = 0; i < config.spiralBulletCount; i++) {
                const angle = boss.spiralAngle + (i * Math.PI / 4);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * 30,
                    y: boss.y + Math.sin(angle) * 30,
                    width: boss.bulletWidth,
                    height: boss.bulletHeight,
                    vx: Math.cos(angle) * config.bulletSpeed,
                    vy: Math.sin(angle) * config.bulletSpeed,
                    color: '#9b59b6',
                    bouncing: false,
                    fromBoss: true
                });
            }
            
            const innerAngle = boss.spiralAngle * 1.5;
            for (let i = 0; i < config.innerBulletCount; i++) {
                const angle = innerAngle + (i * Math.PI / 6);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * 20,
                    y: boss.y + Math.sin(angle) * 20,
                    width: boss.bulletWidth * 0.75,
                    height: boss.bulletHeight * 0.75,
                    vx: Math.cos(angle) * config.innerBulletSpeed,
                    vy: Math.sin(angle) * config.innerBulletSpeed,
                    color: '#8e44ad',
                    bouncing: false,
                    fromBoss: true
                });
            }
            boss.lastShot = now;
        }
    } else if (type === 'boss2') {
        boss.spiralAngle += 0.15;
        boss.x = canvas.width / 2 + Math.sin(boss.spiralAngle * 0.15) * 30;
        if (boss.x < boss.radius) boss.x = boss.radius;
        if (boss.x > canvas.width - boss.radius) boss.x = canvas.width - boss.radius;
        
        if (now - boss.lastShot > boss.shootInterval) {
            for (let i = 0; i < config.bounceBulletCount; i++) {
                const angle = i * Math.PI / 4 + Math.PI / 8;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    width: 10,
                    height: 10,
                    vx: Math.cos(angle) * config.bulletSpeed,
                    vy: Math.sin(angle) * config.bulletSpeed,
                    color: '#1abc9c',
                    bouncing: true,
                    bounceBottom: false,
                    fromBoss: true
                });
            }
            boss.lastShot = now;
        }
        
        if (now - boss.lastNormalShot > config.normalBulletInterval) {
            enemyBullets.push({
                x: boss.x - config.normalBulletOffset,
                y: boss.y + boss.radius,
                width: config.normalBulletWidth,
                height: config.normalBulletHeight,
                vx: 0,
                vy: config.normalBulletSpeed,
                color: '#16a085',
                bouncing: false,
                fromBoss: true
            });
            enemyBullets.push({
                x: boss.x + config.normalBulletOffset,
                y: boss.y + boss.radius,
                width: config.normalBulletWidth,
                height: config.normalBulletHeight,
                vx: 0,
                vy: config.normalBulletSpeed,
                color: '#16a085',
                bouncing: false,
                fromBoss: true
            });
            boss.lastNormalShot = now;
        }
    } else if (type === 'boss3') {
        boss.spiralAngle += 0.05;
        if (now - boss.lastShot > boss.shootInterval && !boss.hasShotBoss3) {
            const baseAngles = [32.5, 77.5, 122.5, 167.5, 212.5, 257.5, 302.5, 347.5];
            const indices = [0, 1, 2, 3, 4, 5, 6, 7];
            const selected = [];
            for (let i = 0; i < config.directionCount; i++) {
                const randIdx = Math.floor(Math.random() * indices.length);
                selected.push(indices.splice(randIdx, 1)[0]);
            }
            const radius = bossStats.boss3BulletRadius;
            const halfSize = radius * 2;
            for (let i = 0; i < selected.length; i++) {
                const angle = baseAngles[selected[i]] * Math.PI / 180;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    radius: radius,
                    width: halfSize,
                    height: halfSize,
                    vx: Math.cos(angle) * config.bulletSpeed,
                    vy: Math.sin(angle) * config.bulletSpeed,
                    color: '#c0392b',
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
    } else if (type === 'bossSpl') {
        boss.spiralAngle += config.spiralAngleSpeed;
        boss.x = canvas.width / 2 + Math.sin(boss.spiralAngle * 0.15) * 30;
        if (boss.x < boss.radius) boss.x = boss.radius;
        if (boss.x > canvas.width - boss.radius) boss.x = canvas.width - boss.radius;

        if (now - boss.lastShot > boss.shootInterval) {
            for (let i = 0; i < config.spiralBulletCount; i++) {
                const angle = boss.spiralAngle + (i * Math.PI / 4);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * config.spawnOffset,
                    y: boss.y + Math.sin(angle) * config.spawnOffset,
                    width: boss.bulletWidth,
                    height: boss.bulletHeight,
                    vx: Math.cos(angle) * config.bulletSpeed,
                    vy: Math.sin(angle) * config.bulletSpeed,
                    color: '#9b59b6',
                    bouncing: false,
                    fromBoss: true
                });
            }
            
            const innerAngle = boss.spiralAngle * 1.5;
            for (let i = 0; i < config.innerBulletCount; i++) {
                const angle = innerAngle + (i * Math.PI / 6);
                enemyBullets.push({
                    x: boss.x + Math.cos(angle) * config.innerOffset,
                    y: boss.y + Math.sin(angle) * config.innerOffset,
                    width: boss.bulletWidth * 0.75,
                    height: boss.bulletHeight * 0.75,
                    vx: Math.cos(angle) * config.innerBulletSpeed,
                    vy: Math.sin(angle) * config.innerBulletSpeed,
                    color: '#8e44ad',
                    bouncing: false,
                    fromBoss: true
                });
            }
            
            for (let i = 0; i < config.bounceBulletCount; i++) {
                const angle = i * Math.PI / 4 + Math.PI / 8;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    width: 10,
                    height: 10,
                    vx: Math.cos(angle) * config.bounceBulletSpeed,
                    vy: Math.sin(angle) * config.bounceBulletSpeed,
                    color: '#1abc9c',
                    bouncing: true,
                    bounceBottom: false,
                    fromBoss: true
                });
            }
            
            enemyBullets.push({
                x: boss.x - config.normalBulletOffset,
                y: boss.y + boss.radius,
                width: config.normalBulletWidth,
                height: config.normalBulletHeight,
                vx: 0,
                vy: config.normalBulletSpeed,
                color: '#16a085',
                bouncing: false,
                fromBoss: true
            });
            enemyBullets.push({
                x: boss.x + config.normalBulletOffset,
                y: boss.y + boss.radius,
                width: config.normalBulletWidth,
                height: config.normalBulletHeight,
                vx: 0,
                vy: config.normalBulletSpeed,
                color: '#16a085',
                bouncing: false,
                fromBoss: true
            });
            
            if (!boss.hasShotBoss3) {
                const baseAngles = [32.5, 77.5, 122.5, 167.5, 212.5, 257.5, 302.5, 347.5];
                const indices = [0, 1, 2, 3, 4, 5, 6, 7];
                const selected = [];
                for (let i = 0; i < config.directionCount; i++) {
                    const randIdx = Math.floor(Math.random() * indices.length);
                    selected.push(indices.splice(randIdx, 1)[0]);
                }
                for (let i = 0; i < selected.length; i++) {
                    const angle = baseAngles[selected[i]] * Math.PI / 180;
                    enemyBullets.push({
                        x: boss.x + Math.cos(angle) * config.spawnOffset,
                        y: boss.y + Math.sin(angle) * config.spawnOffset,
                        radius: config.baseRadius,
                        width: config.baseRadius * 2,
                        height: config.baseRadius * 2,
                        vx: Math.cos(angle) * config.bulletSpeedBoss3,
                        vy: Math.sin(angle) * config.bulletSpeedBoss3,
                        color: '#c0392b',
                        bouncing: true,
                        bounceBottom: true,
                        fromBoss: true,
                        isCircle: true,
                        persistent: true,
                        overlapping: false
                    });
                }
                boss.hasShotBoss3 = true;
            }
            
            boss.lastShot = now;
        }

        if (now - boss.lastTrackShot > config.trackBulletInterval) {
            boss.playerHistory.push({ x: player.x + player.width / 2, time: now });
            if (boss.playerHistory.length > 0 && now - boss.playerHistory[0].time > 100) {
                boss.playerHistory.shift();
            }
            
            let targetX = boss.x;
            if (boss.playerHistory.length > 0) {
                targetX = boss.playerHistory[0].x;
            }
            
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.radius,
                width: 8,
                height: 16,
                vx: 0,
                vy: config.trackBulletSpeed,
                targetX: targetX,
                color: '#f1c40f',
                bouncing: false,
                fromBoss: true,
                tracking: true
            });
            
            boss.lastTrackShot = now;
        }
    }
}

function drawBoss() {
    if (!boss) return;
    
    if (boss.dying) {
        const elapsed = Date.now() - boss.dyingStart;
        const blinkPhase = Math.floor(elapsed / 100) % 2;
        if (blinkPhase === 0) return;
    }
    
    if (boss.invincible) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const type = boss.type;
    
    if (type === 'boss1') {
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
    } else if (type === 'boss2') {
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
    } else if (type === 'boss3') {
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
    } else if (type === 'bossSpl') {
        const gradient = ctx.createRadialGradient(boss.x, boss.y, 0, boss.x, boss.y, boss.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#9b59b6');
        gradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius - 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (type !== 'bossSpl') {
        ctx.fillStyle = '#27ae60';
        const healthBarWidth = (boss.health / boss.maxHealth) * boss.radius * 2;
        ctx.fillRect(boss.x - boss.radius, boss.y - boss.radius - 15, healthBarWidth, 8);
        ctx.strokeStyle = '#2c3e50';
        ctx.strokeRect(boss.x - boss.radius, boss.y - boss.radius - 15, boss.radius * 2, 8);
    }
}

function applyBossRewards(bossType) {
    const config = BOSS_CONFIG[bossType];
    
    if (bossType === 'boss1') {
        player.bulletWidth += config.rewardAmount.width;
        player.bulletHeight += config.rewardAmount.height;
    } else if (bossType === 'boss2') {
        bossStats.boss2Kills++;
        if (config.rewardAppears.includes(bossStats.boss2Kills)) {
            player.bulletRows = Math.min(player.bulletRows + 1, 3);
        }
    } else if (bossType === 'boss3') {
        if (bossStats.playerSpeedBoost < config.maxRewardCount) {
            player.shootInterval = Math.max(80, player.shootInterval - config.rewardAmount);
            bossStats.playerSpeedBoost++;
        }
    }
}

function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        if (boss && !boss.invincible && !boss.dying) {
            const dx = bullet.x + bullet.hitboxWidth / 2 - boss.x;
            const dy = bullet.y + bullet.hitboxHeight / 2 - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < boss.radius + bullet.hitboxWidth / 2) {
                boss.health--;
                if (challengeMode) totalDamage++;
                player.bullets.splice(bulletIndex, 1);
                if (boss.health <= 0) {
                    lives += 5;
                    livesElement.textContent = lives;
                    applyBossRewards(boss.type);
                    boss.dying = true;
                    boss.dyingStart = Date.now();
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
                    score += ENEMY_CONFIG.enemy1.points;
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
        if (bullet.overlapping) {
            return;
        }
        
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
        
        if (collision) {
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
        } else {
            bullet.overlapping = false;
        }
    });

    if (boss && !boss.invincible && !boss.dying) {
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
    if (isPaused) {
        gameLoop = requestAnimationFrame(game);
        return;
    }

    drawBackground();
    updatePlayer();
    drawPlayer();
    updateBullets();
    drawBullets();
    updateEnemyBullets();
    drawEnemyBullets();
    updateBoss();
    drawBoss();
    if (!challengeMode) {
        updateEnemies();
        drawEnemies();
    }
    checkCollisions();

    if (challengeMode) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        document.getElementById('timer').textContent = elapsed;
        document.getElementById('damage').textContent = totalDamage;
    }

    const now = Date.now();
    if (!boss && score >= bossStats.bossSpawnScore) {
        spawnBoss();
        bossStats.bossSpawnScore += challengeMode ? 0 : 100;
    }
    
    if (!challengeMode) {
        const canSpawnEnemies = !boss && (bossDeathTime === 0 || now - bossDeathTime > 3000);
        if (canSpawnEnemies && now - lastEnemySpawn > enemySpawnInterval) {
            spawnEnemy();
            lastEnemySpawn = now;
            
            if (enemySpawnInterval > 300) {
                enemySpawnInterval -= 10;
            }
        }
    }

    gameLoop = requestAnimationFrame(game);
}

function startGame() {
    isPaused = false;
    challengeMode = false;
    score = 0;
    lives = 10;
    bossSpawnScore = 100;
    waveCount = 0;
    bossStats = {
        boss1Appearances: 0,
        boss2Appearances: 0,
        boss2Kills: 0,
        boss3Appearances: 0,
        splAppearances: 0,
        boss1BulletGrowth: 0,
        boss2IntervalReduction: 0,
        boss3BulletRadius: 30,
        playerSpeedBoost: 0,
        bossSpawnScore: 100
    };
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    player.bullets = [];
    enemies = [];
    enemyBullets = [];
    boss = null;
    enemySpawnInterval = 1000;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.bulletWidth = 6;
    player.bulletHeight = 12;
    player.bulletSpeed = 8;
    player.shootInterval = 200;
    player.bulletRows = 1;
    isGameRunning = true;
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseBtn.style.display = 'block';
    
    game();
}

function startChallenge() {
    isPaused = false;
    challengeMode = true;
    score = 0;
    lives = 10;
    bossStats = {
        boss1Appearances: 0,
        boss2Appearances: 0,
        boss2Kills: 0,
        boss3Appearances: 0,
        splAppearances: 0,
        boss1BulletGrowth: 0,
        boss2IntervalReduction: 0,
        boss3BulletRadius: 30,
        playerSpeedBoost: 0,
        bossSpawnScore: 0
    };
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    player.bullets = [];
    enemies = [];
    enemyBullets = [];
    boss = null;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    player.bulletWidth = 6;
    player.bulletHeight = 12;
    player.bulletSpeed = 8;
    player.shootInterval = 200;
    player.bulletRows = 1;
    gameStartTime = Date.now();
    totalDamage = 0;
    isGameRunning = true;
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    document.getElementById('challengeInfo').style.display = 'block';
    document.getElementById('challengeStats').style.display = 'none';
    document.getElementById('returnBtn').style.display = 'none';
    pauseBtn.style.display = 'block';
    
    spawnBoss();
    game();
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    
    if (challengeMode) {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const finalScore = (elapsed + totalDamage) * 10;
        finalScoreElement.textContent = finalScore;
        document.getElementById('finalTime').textContent = elapsed;
        document.getElementById('finalDamage').textContent = totalDamage;
        document.getElementById('challengeStats').style.display = 'block';
        document.getElementById('returnBtn').style.display = 'inline-block';
        document.getElementById('restartBtn').style.display = 'none';
    } else {
        finalScoreElement.textContent = score;
        document.getElementById('challengeStats').style.display = 'none';
        document.getElementById('returnBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'inline-block';
    }
    
    pauseBtn.style.display = 'none';
    gameOverScreen.style.display = 'block';
}

function returnToMain() {
    isPaused = false;
    isGameRunning = false;
    challengeMode = false;
    cancelAnimationFrame(gameLoop);
    if (pauseScreen) {
        pauseScreen.remove();
        pauseScreen = null;
    }
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'block';
    document.getElementById('challengeInfo').style.display = 'none';
    pauseBtn.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let pauseScreen = null;

function togglePause() {
    if (!isPaused) {
        isPaused = true;
        pauseScreen = document.createElement('div');
        pauseScreen.className = 'pause-screen';
        pauseScreen.innerHTML = `
            <h1>暂停</h1>
            <button id="resumeBtn">继续游戏</button>
            <button id="pauseReturnBtn">返回主页</button>
            <button id="pauseRestartBtn">重新开始</button>
        `;
        document.querySelector('.game-container').appendChild(pauseScreen);
        
        document.getElementById('resumeBtn').addEventListener('click', togglePause);
        document.getElementById('pauseReturnBtn').addEventListener('click', returnToMain);
        document.getElementById('pauseRestartBtn').addEventListener('click', () => {
            if (pauseScreen) {
                pauseScreen.remove();
                pauseScreen = null;
            }
            startGame();
        });
    } else {
        isPaused = false;
        if (pauseScreen) {
            pauseScreen.remove();
            pauseScreen = null;
        }
    }
}

startBtn.addEventListener('click', startGame);
challengeBtn.addEventListener('click', startChallenge);
restartBtn.addEventListener('click', startGame);
returnBtn.addEventListener('click', returnToMain);
pauseBtn.addEventListener('click', togglePause);
