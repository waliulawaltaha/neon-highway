function detectCollision3D(p, obj, cameraZ) {
    let pZ = cameraZ + p.zOffset;
    let hitXZ = Math.abs(p.x - obj.x) < (p.width/2 + obj.w/2 - 30) && Math.abs(pZ - obj.z) < (p.depth/2 + obj.d/2 - 40);
    let hitY = (p.y < obj.h); // True if player is lower than the obstacle's height
    return hitXZ && hitY;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectCollision3D };
}
