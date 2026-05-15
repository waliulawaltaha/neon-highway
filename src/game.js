import { project3DTo2D } from './projection.js';
import { updateEntityState } from './physics.js';
import { checkCollision } from './collision.js';

let canvas, ctx;
let lastTime = 0;
let fov = 300;
let camera = { x: 0, y: -150, z: -300 };

// Game State
let state = {
    gravity: 2000,
    groundY: 0,
    score: 0,
    highScore: 0,
    speedFactor: 1.0,
    isGameOver: false,
    isPaused: false
};

export let keys = {};
export let pointer = { x: null, isDown: false, startY: null };

let cachedWidth = 0;
let cachedHeight = 0;

const gradientCache = new Map();
const MAX_CACHE_SIZE = 10;

export let entities = [];
export let effects = [];
let roadLines = [];

const LANE_WIDTH = 200;
const ROAD_Z_START = 0;
const ROAD_Z_END = 2000;

let player;

export function initGame(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');

    const saved = localStorage.getItem('neon_highway_high_score');
    if (saved) state.highScore = parseInt(saved, 10);

    setupInputHandlers();
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    resetGame();
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    cachedWidth = window.innerWidth;
    cachedHeight = window.innerHeight;
}

function getBackgroundGradient() {
    const key = Math.round(cachedHeight);
    if (gradientCache.has(key)) {
        return gradientCache.get(key);
    }

    if (gradientCache.size >= MAX_CACHE_SIZE) {
        const firstKey = gradientCache.keys().next().value;
        gradientCache.delete(firstKey);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, cachedHeight);
    grad.addColorStop(0, '#10002b');
    grad.addColorStop(0.5, '#240046');
    grad.addColorStop(1, '#ff6d00');

    gradientCache.set(key, grad);
    return grad;
}

function resetGame() {
    state.score = 0;
    state.speedFactor = 1.0;
    state.isGameOver = false;
    state.isPaused = false;

    camera.z = -100;

    player = {
        type: 'player',
        x: 0,
        y: state.groundY,
        z: 0,
        width: 40,
        height: 20,
        depth: 60,
        vx: 0,
        vy: 0,
        vz: 300,
        isJumping: false,
        color: '#00ffff'
    };

    entities = [player];
    effects = [];
    roadLines = [];

    for(let i=ROAD_Z_START; i<ROAD_Z_END; i+=100) {
        roadLines.push({z: i});
    }

    lastTime = performance.now();
}

function setupInputHandlers() {
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'KeyP' || e.code === 'Escape') {
            state.isPaused = !state.isPaused;
        }
    });

    const handlePointerDown = e => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        pointer.x = clientX;
        pointer.startY = clientY;
        pointer.isDown = true;
    };

    const handlePointerMove = e => {
        if(!pointer.isDown) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        pointer.x = clientX;
    };

    const handlePointerUp = e => {
        pointer.isDown = false;
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    window.addEventListener('touchstart', handlePointerDown, {passive: false});
    window.addEventListener('touchmove', handlePointerMove, {passive: false});
    window.addEventListener('touchend', handlePointerUp);
}

function handleInput() {
    if (state.isGameOver || state.isPaused) return;

    let targetX = 0;

    if (keys['ArrowLeft'] || keys['KeyA']) targetX = -1;
    if (keys['ArrowRight'] || keys['KeyD']) targetX = 1;

    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !player.isJumping) {
        player.vy = -600;
        player.isJumping = true;
        playSynthSound(400, 'sine', 0.1);
    }

    if (pointer.isDown && pointer.x !== null) {
        if (pointer.x < window.innerWidth / 2) targetX = -1;
        else targetX = 1;

        if (pointer.startY !== null && (pointer.startY - (window.event?.touches?.[0]?.clientY || window.event?.clientY || pointer.startY)) > 50 && !player.isJumping) {
            player.vy = -600;
            player.isJumping = true;
            pointer.startY = null;
            playSynthSound(400, 'sine', 0.1);
        }
    }

    player.x += targetX * 500 * (1/60);

    const maxOffset = LANE_WIDTH * 1.5 - player.width/2;
    if (player.x > maxOffset) player.x = maxOffset;
    if (player.x < -maxOffset) player.x = -maxOffset;
}

function spawnEntities(dt) {
    if (Math.random() < 0.02 * state.speedFactor) {
        const lane = Math.floor(Math.random() * 3) - 1;
        const x = lane * LANE_WIDTH;

        if (Math.random() > 0.8) {
            entities.push({
                type: 'cube',
                x: x,
                y: -10,
                z: player.z + 1500,
                width: 20, height: 20, depth: 20,
                color: '#ffd700',
                rotationY: 0
            });
        } else {
            const typeProb = Math.random();
            let color, speed, width, height, depth;
            if (typeProb < 0.5) {
                color = '#ff00ff'; speed = 100; width = 40; height = 20; depth = 50;
            } else if (typeProb < 0.8) {
                color = '#ff0000'; speed = 50; width = 50; height = 40; depth = 100;
            } else {
                color = '#ff8800'; speed = 250; width = 40; height = 15; depth = 45;
            }

            entities.push({
                type: 'obstacle',
                x: x,
                y: state.groundY,
                z: player.z + 1500,
                vz: speed,
                width, height, depth,
                color
            });
        }
    }
}

function playSynthSound(freq, type='square', duration=0.1) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!window.audioCtx) window.audioCtx = new AudioContext();
    const ctx = window.audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (type === 'noise') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function createExplosion(x, y, z, color) {
    for(let i=0; i<20; i++) {
        effects.push({
            type: 'particle',
            x, y, z,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400 - 200,
            vz: (Math.random() - 0.5) * 400,
            life: 1.0,
            color
        });
    }
}

function gameOver() {
    state.isGameOver = true;
    createExplosion(player.x, player.y - player.height/2, player.z, player.color);
    playSynthSound(100, 'noise', 0.5);

    if (state.score > state.highScore) {
        state.highScore = Math.floor(state.score);
        localStorage.setItem('neon_highway_high_score', state.highScore);
    }
}

function update(dt) {
    if (state.isGameOver || state.isPaused) return;

    handleInput();

    state.speedFactor += dt * 0.01;
    player.vz = 300 * state.speedFactor;
    state.score += (player.vz * dt) / 100;

    camera.x += (player.x - camera.x) * dt * 5;
    camera.z = player.z - 300;

    for (let i = 0; i < entities.length; i++) {
        if (entities[i].dead) continue;
        entities[i] = updateEntityState(entities[i], dt, state);
        if (entities[i].type === 'cube') {
            entities[i].rotationY += dt * 5;
        }
    }

    for (let i = effects.length - 1; i >= 0; i--) {
        let p = effects[i];
        p = updateEntityState(p, dt, state);
        p.life -= dt;
        effects[i] = p;
        if (p.life <= 0) {
             effects[i] = effects[effects.length - 1];
             effects.pop();
        }
    }

    if (!state.isGameOver) {
        for (let i = 0; i < entities.length; i++) {
            if (entities[i].type === 'player' || entities[i].dead) continue;

            if (checkCollision(player, entities[i])) {
                if (entities[i].type === 'obstacle') {
                    gameOver();
                } else if (entities[i].type === 'cube') {
                    state.score += 50;
                    playSynthSound(800, 'sine', 0.1);
                    entities[i].dead = true;
                }
            }
        }
    }

    spawnEntities(dt);

    for(let i=0; i<roadLines.length; i++) {
        if (roadLines[i].z < camera.z) {
            roadLines[i].z += ROAD_Z_END;
        }
    }

    // Cleanup dead or passed entities from the start
    let removeCount = 0;
    while (removeCount < entities.length && entities[removeCount].z < camera.z - 200) {
        removeCount++;
    }
    if (removeCount > 0) {
        entities.splice(0, removeCount);
    }
}

function render3DBox(ctx, px, py, scale, entity) {
    const hw = (entity.width / 2) * scale;
    const hh = entity.height * scale;

    ctx.fillStyle = entity.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(px - hw, py - hh, hw * 2, hh);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 15;
    ctx.shadowColor = entity.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawGame() {
    ctx.clearRect(0, 0, cachedWidth, cachedHeight);

    // Draw Sky Gradient
    ctx.fillStyle = getBackgroundGradient();
    ctx.fillRect(0, 0, cachedWidth, cachedHeight);

    // Calculate horizon
    const horizon = project3DTo2D(0, 0, 10000, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);

    if (horizon) {
        // Draw Ground
        ctx.fillStyle = '#0a001a'; // Dark ground color
        ctx.fillRect(0, horizon.py, cachedWidth, cachedHeight - horizon.py);

        // Draw Horizon Line
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.moveTo(0, horizon.py);
        ctx.lineTo(cachedWidth, horizon.py);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Draw Road Lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    for(let i=0; i<roadLines.length; i++) {
        const line = roadLines[i];
        const projL = project3DTo2D(-LANE_WIDTH * 1.5, state.groundY, line.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        const projR = project3DTo2D(LANE_WIDTH * 1.5, state.groundY, line.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);

        if (projL && projR) {
             ctx.beginPath();
             ctx.moveTo(projL.px, projL.py);
             ctx.lineTo(projR.px, projR.py);
             ctx.stroke();
        }
    }

    // Draw Lane Dividers
    const pFarC = project3DTo2D(0, state.groundY, camera.z + 2000, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
    const pNearC = project3DTo2D(0, state.groundY, camera.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
    if(pFarC && pNearC) {
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        let plFar = project3DTo2D(-LANE_WIDTH/2, state.groundY, camera.z + 2000, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        let plNear = project3DTo2D(-LANE_WIDTH/2, state.groundY, camera.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        if(plFar && plNear) { ctx.moveTo(plNear.px, plNear.py); ctx.lineTo(plFar.px, plFar.py); }

        let prFar = project3DTo2D(LANE_WIDTH/2, state.groundY, camera.z + 2000, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        let prNear = project3DTo2D(LANE_WIDTH/2, state.groundY, camera.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        if(prFar && prNear) { ctx.moveTo(prNear.px, prNear.py); ctx.lineTo(prFar.px, prFar.py); }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Entities rely on chronological insertion for Z-sorting, so we draw from end of array to start (farthest to nearest)
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.dead && e.type !== 'player') continue; // Draw dead player for explosion, skip others
        // Wait, if player is dead, we shouldn't draw it either because it exploded.
        if (state.isGameOver && e.type === 'player') continue;
        if (e.dead) continue;

        const proj = project3DTo2D(e.x, e.y, e.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        if (proj) {
            render3DBox(ctx, proj.px, proj.py, proj.scale, e);
        }
    }

    for(let p of effects) {
        const proj = project3DTo2D(p.x, p.y, p.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        if (proj) {
            ctx.fillStyle = p.color;
            const size = 5 * proj.scale;
            ctx.fillRect(proj.px - size/2, proj.py - size/2, size, size);
        }
    }

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Courier New", Courier, monospace';
    ctx.fillText(`SCORE: ${Math.floor(state.score)}`, 20, 30);
    ctx.fillText(`HIGH: ${state.highScore}`, 20, 60);
    ctx.fillText(`SPEED: ${state.speedFactor.toFixed(2)}x`, 20, 90);

    if (state.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, cachedWidth, cachedHeight);
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', cachedWidth/2, cachedHeight/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillText('Press SPACE or Tap to Restart', cachedWidth/2, cachedHeight/2 + 20);
        ctx.textAlign = 'left';

        if (keys['Space'] || (pointer.isDown && pointer.x !== null)) {
            resetGame();
        }
    } else if (state.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, cachedWidth, cachedHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '40px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', cachedWidth/2, cachedHeight/2);
        ctx.textAlign = 'left';
    }
}

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    update(dt);
    drawGame();

    requestAnimationFrame(gameLoop);
}
