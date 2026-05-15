export function project3DTo2D(x, y, z, cameraX, cameraY, cameraZ, fov, canvasWidth, canvasHeight) {
    const dz = z - cameraZ;
    if (dz <= 0) return null; // Behind or at the camera

    const scale = fov / dz;
    const px = (x - cameraX) * scale + canvasWidth / 2;
    const py = (y - cameraY) * scale + canvasHeight / 2;

    return { px, py, scale };
}
