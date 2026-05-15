const fs = require('fs');

let code = fs.readFileSync('src/game.js', 'utf8');

// Remove player from entities in resetGame
code = code.replace(/entities = \[player\];/, `entities = [];`);

// Add player physics update in update function
code = code.replace(/camera\.z = player\.z - 300;/, `camera.z = player.z - 300;\n\n    player = updateEntityState(player, dt, state);`);

// Skip player check in collision loop (since it's removed from entities)
code = code.replace(/if \(entities\[i\]\.type === 'player' \|\| entities\[i\]\.dead\) continue;/, `if (entities[i].dead) continue;`);

// Draw player in drawGame explicitly since it's not in entities
code = code.replace(/const proj = project3DTo2D\(e\.x, e\.y, e\.z, camera\.x, camera\.y, camera\.z, fov, cachedWidth, cachedHeight\);/, `if (e.z > camera.z) {
            const proj = project3DTo2D(e.x, e.y, e.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
            if (proj) {
                render3DBox(ctx, proj.px, proj.py, proj.scale, e);
            }
        }`);

code = code.replace(/for\(let p of effects\) \{/, `
    if (!state.isGameOver) {
        const projPlayer = project3DTo2D(player.x, player.y, player.z, camera.x, camera.y, camera.z, fov, cachedWidth, cachedHeight);
        if (projPlayer) {
            render3DBox(ctx, projPlayer.px, projPlayer.py, projPlayer.scale, player);
        }
    }

    for(let p of effects) {`);

fs.writeFileSync('src/game.js', code);
