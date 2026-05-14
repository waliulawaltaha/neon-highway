function project3D(wX, wY, wZ, camX, camY, camZ, fovMult = 1, focalLength, screenWidth, horizonY) {
    let dz = wZ - camZ;
    if (dz <= 10) return null;
    let scale = (focalLength / fovMult) / dz;
    let px = (screenWidth / 2) + ((wX - camX) * scale);
    let py = horizonY + ((camY - wY) * scale);
    return { x: px, y: py, scale: scale, depth: dz };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { project3D };
}
