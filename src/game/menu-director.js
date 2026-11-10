import { SURFACES, SURFACE_KEYS } from "../config/surfaces.js";

/** Autonomous attract mode. Reads the world, never touches player progression. */
export class MenuDirector {
  constructor() {
    this.elapsed = 0;
    this.lastShift = -5;
    this.speed = 21;
    this.coins = 0;
    this.dodges = 0;
    this.crashed = false;
  }
  update(dt, world, gravity, player) {
    this.elapsed += dt;
    if (this.crashed) return;
    for (const obstacle of world.obstacles) {
      if (!obstacle.demoPassed && obstacle.mesh.position.z > 2) {
        obstacle.demoPassed = true;
        this.dodges++;
      }
    }

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
      const trail = world.collectibles.filter(
        (orb) =>
          !orb.collected &&
          orb.surfaceKey === key &&
          orb.mesh.position.z < 1 &&
          orb.mesh.position.z > -55,
      );
      for (const orb of trail) {
        const eta = Math.max(0, -orb.mesh.position.z / this.speed);
        cost -= 0.8 / (eta + 0.65);
      }
      // Stay committed to a reachable coin trail rather than oscillating between routes.
      if (key === current && trail.some((orb) => orb.mesh.position.z > -22))
        cost -= 0.65;
      return cost;
    };
    const choice = [...SURFACE_KEYS].sort((a, b) => rank(a) - rank(b))[0];
    if (
      !gravity.isTransitioning &&
      choice !== current &&
      rank(current) - rank(choice) > 0.45 &&
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
      () => {
        this.coins++;
        player.emitBurst(7, 0xffca55);
      },
      () => {
        // The demonstration recovers locally; it cannot end or reward a real run.
        this.crashed = true;
        player.emitBurst(12);
      },
    );
  }
}
