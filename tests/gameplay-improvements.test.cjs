const { test } = require("node:test");
const assert = require("node:assert/strict");
test("the latest surface intention replaces or cancels a queued transfer", async () => {
  const { GravitySystem } = await import("../src/game/gravity-system.js");
  const g = new GravitySystem();
  g.shiftTo("LEFT");
  g.shiftTo("CEILING");
  assert.equal(g.pendingSurface, "CEILING");
  g.shiftTo("LEFT");
  assert.equal(g.pendingSurface, null);
  g.update(0.21);
  assert.equal(g.currentSurface.id, "LEFT");
  assert.equal(g.isTransitioning, false);
  g.shiftTo("FLOOR");
  g.shiftTo("RIGHT");
  g.shiftTo("CEILING");
  g.update(0.21);
  assert.equal(g.targetSurface.id, "CEILING");
});
test("physical contact during takeoff is detected, but a clear airborne trajectory is safe", async () => {
  const [{ GravitySystem }, { obstacleContact }, THREE, { SURFACES }] =
    await Promise.all([
      import("../src/game/gravity-system.js"),
      import("../src/game/collision-shapes.js"),
      import("three"),
      import("../src/config/surfaces.js"),
    ]);
  const g = new GravitySystem(),
    ob = {
      type: "BARRIER",
      surfaceKey: "FLOOR",
      halfW: 5.4,
      height: 2.3,
      halfD: 0.9,
      mesh: { position: new THREE.Vector3(0, SURFACES.FLOOR.basePos.y, 0) },
    };
  const contact = () =>
    obstacleContact(
      ob,
      { ...g.currentPos2D },
      new THREE.Vector3(0, 1, 0).applyQuaternion(g.currentQuat),
    );
  g.shiftTo("LEFT");
  g.update(0.01);
  assert.ok(
    contact(),
    "departing cannot make the player instantly invulnerable",
  );
  g.update(0.1);
  assert.equal(
    contact(),
    null,
    "do not hit a floor barrier after physically clearing it",
  );
});
test("laser gaps and finite rotating arms use their visible shapes", async () => {
  const { obstacleContact } = await import("../src/game/collision-shapes.js");
  const { SURFACES } = await import("../src/config/surfaces.js");
  const ob = {
    type: "LASER",
    surfaceKey: "FLOOR",
    halfD: 0.6,
    mesh: { position: { x: 0, y: SURFACES.FLOOR.basePos.y, z: 0 } },
  };
  assert.ok(
    obstacleContact(ob, { x: 0, y: ob.mesh.position.y }, { x: 0, y: 1 }),
  );
  assert.equal(
    obstacleContact(ob, { x: 0, y: ob.mesh.position.y + 3.5 }, { x: 0, y: 1 }),
    null,
  );
  const rotor = {
    type: "ROTATING",
    halfD: 0.9,
    mesh: { position: { x: 0, y: 0, z: 0 }, rotation: { z: 0 } },
  };
  assert.equal(obstacleContact(rotor, { x: 8, y: 0 }, { x: 0, y: 1 }), null);
  assert.ok(obstacleContact(rotor, { x: 2, y: -0.5 }, { x: 0, y: 1 }));
});
test("important notifications survive combo bursts and duplicate messages coalesce", async () => {
  const { NotificationQueue } =
    await import("../src/services/notification-queue.js");
  const shown = [],
    timers = new Map();
  let id = 0;
  const q = new NotificationQueue((text) => shown.push(text), {
    schedule: (cb) => {
      timers.set(++id, cb);
      return id;
    },
    cancel: (key) => timers.delete(key),
  });
  q.push("combo", 0);
  q.push("perfect", 2);
  q.push("combo", 0);
  q.push("combo", 0);
  assert.equal(q.active.text, "perfect");
  assert.equal(q.items.length, 1);
  assert.equal(shown.at(-1), "perfect");
  timers.get(id)();
  assert.equal(shown.at(-1), "combo");
  q.clear();
  assert.equal(shown.at(-1), null);
  assert.equal(q.items.length, 0);
});

test("forks offer two signalled exits without placing an obstacle on either route", async () => {
  const [{ ProceduralWorld }, { SeededRNG }, { RUN_PHRASES }, THREE] =
    await Promise.all([
      import("../src/game/procedural-world.js"),
      import("../src/core/seeded-rng.js"),
      import("../src/data/run-content.js"),
      import("three"),
    ]);
  const world = new ProceduralWorld(new THREE.Scene(), new SeededRNG("FORK"));
  world.patternCounter = 4;
  world.nextPatternZ = -80;
  world.rng.pick = () => RUN_PHRASES.find((p) => p.id === "fork");
  world.spawnNextPattern(900);
  const fork = world.obstacles.find((o) => o.safeSurfaces?.length === 2);
  assert.ok(fork);
  const row = world.obstacles.filter(
    (o) => o.mesh.position.z === fork.mesh.position.z,
  );
  for (const safe of fork.safeSurfaces) {
    assert.ok(row.every((o) => o.surfaceKey !== safe));
    assert.ok(
      world.collectibles.some(
        (c) =>
          c.surfaceKey === safe &&
          c.mesh.position.z > fork.mesh.position.z &&
          c.mesh.position.z < fork.mesh.position.z + 40,
      ),
    );
  }
});
