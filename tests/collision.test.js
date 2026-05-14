const test = require('node:test');
const assert = require('node:assert');
const { detectCollision3D } = require('../js/collision.js');

test('detectCollision3D - direct hit', () => {
    const cameraZ = 1000;

    const p = { x: 0, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 }; // pZ = cameraZ + zOffset = 1600

    // hitXZ should be true:
    // X: Math.abs(0 - 0) < (180/2 + 180/2 - 30) => 0 < 150 (True)
    // Z: Math.abs(1600 - 1600) < (300/2 + 300/2 - 40) => 0 < 260 (True)
    // hitY should be true:
    // 0 < 90 (True)

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), true);
});

test('detectCollision3D - miss on X axis', () => {
    const cameraZ = 1000;

    const p = { x: 200, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 };

    // hitXZ:
    // Math.abs(200 - 0) < 150 => 200 < 150 (False)

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), false);
});

test('detectCollision3D - boundary hit on X axis', () => {
    const cameraZ = 1000;

    // Threshold is 150. 149 should hit.
    const p = { x: 149, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), true);
});

test('detectCollision3D - boundary miss on X axis', () => {
    const cameraZ = 1000;

    // Threshold is 150. 150 should miss (since it uses <).
    const p = { x: 150, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), false);
});

test('detectCollision3D - boundary hit on Z axis', () => {
    const cameraZ = 1000;

    // Threshold is 260.
    // pZ = 1000 + 600 = 1600.
    // obj.z = 1600 + 259 = 1859.
    // abs(1600 - 1859) = 259 < 260 (True)
    const p = { x: 0, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1859, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), true);
});

test('detectCollision3D - boundary miss on Z axis', () => {
    const cameraZ = 1000;

    // Threshold is 260.
    // abs(1600 - 1860) = 260 < 260 (False)
    const p = { x: 0, zOffset: 600, width: 180, height: 80, depth: 300, y: 0 };
    const obj = { x: 0, z: 1860, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), false);
});

test('detectCollision3D - hit on Y axis (jumping but low enough)', () => {
    const cameraZ = 1000;

    // obj.h = 90. p.y = 89.
    const p = { x: 0, zOffset: 600, width: 180, height: 80, depth: 300, y: 89 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), true);
});

test('detectCollision3D - miss on Y axis (jumping over)', () => {
    const cameraZ = 1000;

    // obj.h = 90. p.y = 90.
    const p = { x: 0, zOffset: 600, width: 180, height: 80, depth: 300, y: 90 };
    const obj = { x: 0, z: 1600, w: 180, h: 90, d: 300 };

    assert.strictEqual(detectCollision3D(p, obj, cameraZ), false);
});
