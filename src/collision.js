export function checkCollision(player, obstacle) {
    // 3D collision detection (AABB)
    const dx = Math.abs(player.x - obstacle.x);
    const dz = Math.abs(player.z - obstacle.z);

    const overlapX = dx < (player.width / 2 + obstacle.width / 2);
    const overlapZ = dz < (player.depth / 2 + obstacle.depth / 2);

    // Y-axis overlap must account for obstacle.y, height, and player height.
    // Assuming 'y' is the bottom edge of the object, growing downwards (Canvas coords).
    const playerTop = player.y - player.height;
    const playerBottom = player.y;

    const obstacleTop = obstacle.y - obstacle.height;
    const obstacleBottom = obstacle.y;

    const overlapY = playerBottom > obstacleTop && playerTop < obstacleBottom;

    return overlapX && overlapY && overlapZ;
}
