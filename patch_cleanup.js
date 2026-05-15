const fs = require('fs');

let code = fs.readFileSync('src/game.js', 'utf8');

// Ensure proper entity cleanup without player interfering
code = code.replace(/while \(removeCount < entities\.length && entities\[removeCount\]\.z < camera\.z - 200\) \{[\s\S]*?if \(removeCount > 0\) \{[\s\S]*?entities\.splice\(0, removeCount\);[\s\S]*?\}/, `while (removeCount < entities.length && entities[removeCount].z < camera.z - 200) {
        removeCount++;
    }
    if (removeCount > 0) {
        entities.splice(0, removeCount);
    }`);

fs.writeFileSync('src/game.js', code);
