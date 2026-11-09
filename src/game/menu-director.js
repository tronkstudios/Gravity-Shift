import { SURFACES, SURFACE_KEYS } from "../config/surfaces.js";

/** Autonomous attract mode. Reads the world, never touches player progression. */
export class MenuDirector {
  constructor() {
    this.elapsed = 0;
    this.lastShift = -5;
    this.speed = 21;
  }
  update(dt, world, gravity, player) {
    this.elapsed += dt;
    if (gravity.isTransitioning) return;
    const current = gravity.targetSurface.id;
    const danger = world.obstacles.filter(
      (ob) => ob.mesh.position.z < 4 && ob.mesh.position.z > -this.speed * 2.3,
    );
    const rank = (key) => {
      const surf = SURFACES[key];
      let cost = key === current ? -0.35 : 0;
      for (const ob of danger) {
        const time = Math.max(0, -ob.mesh.position.z / this.speed);
        if (ob.type === "ROTATING") {
          const angle = ob.mesh.rotation.z + ob.rotSpeed * time;
          const x = surf.basePos.x + surf.normal.x;
          const y = surf.basePos.y + surf.normal.y;
          if (Math.abs(-Math.sin(angle) * x + Math.cos(angle) * y) < 2)
            cost += 12 / (time + 0.3);
        } else if (ob.surfaceKey === key) cost += 10 / (time + 0.3);
      }
      for (const orb of world.collectibles)
        if (
          !orb.collected &&
          orb.surfaceKey === key &&
          orb.mesh.position.z < -5 &&
          orb.mesh.position.z > -45
        )
          cost -= 0.16;
      // A slow scenic preference encourages varied poses when the path is clear.
      if (key === SURFACE_KEYS[Math.floor(this.elapsed / 3.8) % 4]) cost -= 0.6;
      return cost;
    };
    const choice = [...SURFACE_KEYS].sort((a, b) => rank(a) - rank(b))[0];
    if (
      choice !== current &&
      this.elapsed - this.lastShift > 0.65 &&
      gravity.shiftTo(choice)
    ) {
      this.lastShift = this.elapsed;
      world.notifySurfaceShift(choice);
      player.emitBurst(12);
    }
    world.checkCollisions(
      player,
      gravity,
      () => player.emitBurst(5),
      () => {
        // The demonstration recovers locally; it cannot end or reward a real run.
        player.shieldTimer = 0.7;
        player.emitBurst(12);
      },
    );
  }
}
