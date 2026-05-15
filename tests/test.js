import test from 'node:test';
import assert from 'node:assert';
import { project3DTo2D } from '../src/projection.js';
import { applyPhysics } from '../src/physics.js';
import { checkCollision } from '../src/collision.js';

test('project3DTo2D should correctly project 3D coordinates', () => {
    const res = project3DTo2D(0, 0, 100, 0, 0, 0, 50, 800, 600);
    assert.strictEqual(res.px, 400);
    assert.strictEqual(res.py, 300);
    assert.strictEqual(res.scale, 0.5);

    const behind = project3DTo2D(0, 0, -10, 0, 0, 0, 50, 800, 600);
    assert.strictEqual(behind, null);
});

test('applyPhysics should update position and handle gravity', () => {
    const dt = 1; // 1 second for simplicity
    const gravity = 10;
    const groundY = 0;

    let entity = { y: -50, vy: 0 }; // Start above ground

    entity = applyPhysics(entity, dt, gravity, groundY);

    assert.strictEqual(entity.vy, 10);
    assert.strictEqual(entity.y, -40); // -50 + 10

    // Force it below ground
    entity.y = 10;
    entity = applyPhysics(entity, dt, gravity, groundY);

    assert.strictEqual(entity.y, groundY);
    assert.strictEqual(entity.vy, 0);
    assert.strictEqual(entity.isJumping, false);
});

test('checkCollision should correctly detect 3D AABB overlap', () => {
    const player = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };
    const obstacle = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };

    assert.strictEqual(checkCollision(player, obstacle), true);

    const nonColliding = { x: 20, y: 0, z: 0, width: 10, height: 10, depth: 10 };
    assert.strictEqual(checkCollision(player, nonColliding), false);

    const floatingObstacle = { x: 0, y: -20, z: 0, width: 10, height: 10, depth: 10 }; // Top: -30, Bottom: -20. Player Top: -10, Bottom: 0.
    assert.strictEqual(checkCollision(player, floatingObstacle), false);

    const jumpingPlayer = { x: 0, y: -20, z: 0, width: 10, height: 10, depth: 10 }; // Top: -30, Bottom: -20. Obstacle Top: -10, Bottom: 0
    assert.strictEqual(checkCollision(jumpingPlayer, obstacle), false);

    const collidingObstacleAbove = { x: 0, y: -5, z: 0, width: 10, height: 10, depth: 10 }; // Top: -15, Bottom: -5. Player Top: -10, Bottom: 0.
    assert.strictEqual(checkCollision(player, collidingObstacleAbove), true);
});
