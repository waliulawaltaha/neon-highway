const test = require('node:test');
const assert = require('node:assert');
const { project3D } = require('../js/projection.js');

test('project3D - object behind or too close to camera returns null', () => {
    // dz = wZ - camZ. If dz <= 10, should return null.

    // dz = 0
    assert.strictEqual(project3D(0, 0, 100, 0, 0, 100, 1, 600, 800, 300), null);

    // dz = 10
    assert.strictEqual(project3D(0, 0, 110, 0, 0, 100, 1, 600, 800, 300), null);

    // dz = -10 (behind camera)
    assert.strictEqual(project3D(0, 0, 90, 0, 0, 100, 1, 600, 800, 300), null);
});

test('project3D - normal projection straight ahead', () => {
    // wZ = 200, camZ = 100 => dz = 100.
    // scale = (600 / 1) / 100 = 6
    // px = (800 / 2) + ((0 - 0) * 6) = 400
    // py = 300 + ((0 - 0) * 6) = 300
    const result = project3D(0, 0, 200, 0, 0, 100, 1, 600, 800, 300);
    assert.deepStrictEqual(result, { x: 400, y: 300, scale: 6, depth: 100 });
});

test('project3D - projection offset X and Y', () => {
    // wX = 50, wY = 20, wZ = 300, camX = 10, camY = 30, camZ = 100 => dz = 200.
    // scale = (600 / 1) / 200 = 3
    // px = (800 / 2) + ((50 - 10) * 3) = 400 + 120 = 520
    // py = 300 + ((30 - 20) * 3) = 300 + 30 = 330
    const result = project3D(50, 20, 300, 10, 30, 100, 1, 600, 800, 300);
    assert.deepStrictEqual(result, { x: 520, y: 330, scale: 3, depth: 200 });
});

test('project3D - different FOV multiplier', () => {
    // fovMult = 2 => scale = (600 / 2) / 100 = 300 / 100 = 3
    const result = project3D(0, 0, 200, 0, 0, 100, 2, 600, 800, 300);
    assert.deepStrictEqual(result, { x: 400, y: 300, scale: 3, depth: 100 });
});

test('project3D - different screen dimensions', () => {
    // scale = (600 / 1) / 100 = 6
    // px = (1920 / 2) + ((10 - 0) * 6) = 960 + 60 = 1020
    // py = 540 + ((0 - (-10)) * 6) = 540 + 60 = 600
    const result = project3D(10, -10, 200, 0, 0, 100, 1, 600, 1920, 540);
    assert.deepStrictEqual(result, { x: 1020, y: 600, scale: 6, depth: 100 });
});

test('project3D - far object scale approaches 0', () => {
    // dz = 10000.
    // scale = (600 / 1) / 10000 = 0.06
    const result = project3D(100, 100, 10100, 0, 0, 100, 1, 600, 800, 300);
    assert.deepStrictEqual(result, { x: 400 + 100 * 0.06, y: 300 + (-100) * 0.06, scale: 0.06, depth: 10000 });
});
