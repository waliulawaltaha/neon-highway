const fs = require('fs');

let code = fs.readFileSync('src/game.js', 'utf8');

// Replace drawGame
code = code.replace(/function drawGame\(\) \{[\s\S]*?function gameLoop\(/, `function drawGame() {
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
    ctx.fillText(\`SCORE: \${Math.floor(state.score)}\`, 20, 30);
    ctx.fillText(\`HIGH: \${state.highScore}\`, 20, 60);
    ctx.fillText(\`SPEED: \${state.speedFactor.toFixed(2)}x\`, 20, 90);

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

function gameLoop(`);

fs.writeFileSync('src/game.js', code);
