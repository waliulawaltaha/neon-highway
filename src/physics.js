export function applyPhysics(entity, dt, gravity, groundY) {
    const newEntity = { ...entity };

    if (newEntity.vy !== undefined) {
        newEntity.vy += gravity * dt;
        newEntity.y += newEntity.vy * dt;

        if (newEntity.y > groundY) {
            newEntity.y = groundY;
            newEntity.vy = 0;
            newEntity.isJumping = false;
        }
    }

    if (newEntity.vx !== undefined) newEntity.x += newEntity.vx * dt;
    if (newEntity.vz !== undefined) newEntity.z += newEntity.vz * dt;

    return newEntity;
}

export function updateEntityState(entity, dt, state) {
    return applyPhysics(entity, dt, state.gravity, state.groundY);
}
