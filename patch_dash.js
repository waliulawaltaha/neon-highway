const fs = require('fs');

let code = fs.readFileSync('src/game.js', 'utf8');

// Remove line dashes which break perspective in 3D-to-2D projection
code = code.replace(/ctx\.setLineDash\(\[20, 20\]\);/, `// Removed line dash`);
code = code.replace(/ctx\.setLineDash\(\[\]\);/, `// Reset line dash`);

fs.writeFileSync('src/game.js', code);
