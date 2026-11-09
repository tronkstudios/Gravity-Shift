const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
let classes;
test.before(async () => {
  const imports = await Promise.all([
    import("../src/state/score-manager.js"),
    import("../src/game/procedural-world.js"),
    import("../src/core/seeded-rng.js"),
    import("../src/app/game.js"),
    import("../src/game/gravity-system.js"),
    import("three"),
  ]);
  classes = Object.assign({}, ...imports.slice(0, 5), { THREE: imports[5] });
});
function runtime(saved) {
  const nodes = new Map();
  const node = () => ({
    textContent: "",
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    addEventListener() {},
    appendChild() {},
  });
  const storage = {
    value: saved,
    getItem() {
      return this.value || null;
    },
    setItem(k, v) {
      this.value = v;
    },
    removeItem() {
      this.value = null;
    },
  };
  globalThis.localStorage = storage;
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener() {},
    matchMedia: () => ({ matches: false }),
  };
  globalThis.document = {
    addEventListener() {},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, node());
      return nodes.get(id);
    },
    querySelectorAll: () => [],
  };
  globalThis.requestAnimationFrame = () => {};
  return { ...classes, storage };
}
test("corrupt saves and locked equipped skins normalize without losing legitimate balances", () => {
  const { ScoreManager } = runtime(
    JSON.stringify({
      totalEnergy: "450",
      bestScore: -5,
      unlockedSkins: ["core", "core", "invalid"],
      equippedSkin: "invalid",
    }),
  );
  const s = new ScoreManager();
  assert.equal(s.saveData.totalEnergy, 450);
  assert.equal(s.saveData.bestScore, 0);
  assert.deepEqual(Array.from(s.saveData.unlockedSkins), ["core"]);
  assert.equal(s.saveData.equippedSkin, "core");
});
test("250m mission pays exactly once and resets for a new run", () => {
  const { ScoreManager } = runtime();
  const s = new ScoreManager();
  s.distance = 249;
  s.updateFrame(1, 30);
  assert.equal(s.missionCompleted, true);
  assert.equal(s.saveData.totalEnergy, 425);
  assert.equal(s.runEnergy, 75);
  s.reviveUsed = true;
  s.updateFrame(1, 30);
  assert.equal(s.saveData.totalEnergy, 425);
  s.resetRun();
  assert.equal(s.missionCompleted, false);
  assert.equal(s.runEnergy, 0);
});
test("thin laser cannot be skipped at maximum speed with 20 FPS frames", () => {
  const { GravityShiftGame, ProceduralWorld, THREE, ScoreManager } = runtime();
  const g = Object.create(GravityShiftGame.prototype);
  let hits = 0;
  const obs = {
    type: "LASER",
    surfaceKey: "FLOOR",
    halfD: 0.6,
    halfW: 5.4,
    localX: 0,
    mesh: { position: { z: -1.6 } },
  };
  const world = {
    obstacles: [obs],
    collectibles: [],
    update(dt, speed) {
      obs.mesh.position.z += dt * speed;
    },
    checkCollisions: ProceduralWorld.prototype.checkCollisions,
  };
  Object.assign(g, {
    state: "PLAYING",
    lastTime: 0,
    fixedAccumulator: 0,
    baseSpeed: 68,
    maxSpeed: 68,
    scoreMgr: new ScoreManager(),
    gravitySys: {
      lateralOffset: 0,
      currentSurface: { id: "FLOOR", normal: { x: 0, y: 1 } },
      update() {},
    },
    player: {
      root: { position: new THREE.Vector3() },
      shieldTimer: 0,
      update() {},
    },
    world,
    cameraCtrl: { update() {} },
    renderer: { render() {} },
    handleGameOver() {
      hits++;
      this.state = "GAMEOVER";
    },
    ui: { updateHUD() {} },
  });
  g.animate(50);
  assert.equal(hits, 1);
  assert.equal(g.state, "GAMEOVER");
});
test("removing obstacles frees each unique geometry once and retains shared orb geometry", () => {
  const { ProceduralWorld, THREE } = runtime();
  let disposed = 0,
    removed = 0;
  const geometry = new THREE.BoxGeometry();
  geometry.addEventListener("dispose", () => disposed++);
  const shared = new THREE.OctahedronGeometry();
  let sharedDisposed = 0;
  shared.addEventListener("dispose", () => sharedDisposed++);
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(geometry),
    new THREE.Mesh(geometry),
    new THREE.Mesh(shared),
  );
  ProceduralWorld.prototype.releaseMesh.call(
    {
      orbGeometry: shared,
      scene: {
        remove() {
          removed++;
        },
      },
    },
    group,
  );
  assert.equal(disposed, 1);
  assert.equal(sharedDisposed, 0);
  assert.equal(removed, 1);
});
test("seeded moving hazards depend on simulation time, not time spent paused", () => {
  const a = runtime();
  const world = new a.ProceduralWorld(
    new a.THREE.Scene(),
    new a.SeededRNG("TEST"),
  );
  world.resetWorld();
  world.obstacles.forEach((o) => assert.ok(Number.isFinite(o.mesh.position.z)));
  world.update(0.25, 30, 0);
  assert.equal(world.elapsed, 0.25);
  world.resetWorld();
  assert.equal(world.elapsed, 0);
});
test("HUD and all static controls referenced by the engine exist in the template", () => {
  const source = [
      "src/app/game.js",
      "src/ui/game-ui.js",
      "src/ui/input-controller.js",
    ]
      .map((p) => fs.readFileSync(p, "utf8"))
      .join("\n"),
    template = fs.readFileSync("src/index.template.html", "utf8");
  for (const match of source.matchAll(/getElementById\(["']([^"']+)["']\)/g))
    assert.ok(template.includes(`id="${match[1]}"`), `missing ${match[1]}`);
});
test("paused simulation does not advance the run", () => {
  const { GravityShiftGame, ScoreManager } = runtime();
  const g = Object.create(GravityShiftGame.prototype);
  let updates = 0;
  Object.assign(g, {
    state: "PAUSED",
    lastTime: 0,
    scoreMgr: new ScoreManager(),
    renderer: { render() {} },
    player: {
      update() {
        updates++;
      },
    },
    world: {
      update() {
        updates++;
      },
    },
  });
  g.animate(50);
  assert.equal(updates, 0);
  assert.equal(g.scoreMgr.distance, 0);
});
test("composed application starts, runs countdown, pauses and returns to menu", () => {
  const { GravityShiftGame } = runtime();
  const renderer = {
    domElement: { addEventListener() {} },
    setSize() {},
    setPixelRatio() {},
    render() {},
  };
  const game = new GravityShiftGame({
    rendererFactory: () => renderer,
    hangarFactory: () => ({ isActive: false }),
  });
  assert.equal(game.state, "MENU");
  assert.equal(game.ui.game, game);
  assert.equal(game.input.game, game);
  game.startNewRun();
  assert.equal(game.state, "COUNTDOWN");
  for (let i = 0; i < 62; i++) game.animate(game.lastTime + 50);
  assert.equal(game.state, "PLAYING");
  game.pauseGame();
  assert.equal(game.state, "PAUSED");
  game.resumeGame();
  assert.equal(game.state, "PLAYING");
  game.returnToMainMenu();
  assert.equal(game.state, "MENU");
});
test("module dependencies are acyclic and simulation modules do not depend on UI", () => {
  const path = require("node:path");
  const files = fs
    .readdirSync("src", { recursive: true })
    .filter((x) => x.endsWith(".js"))
    .map((x) => path.resolve("src", x));
  const graph = new Map(
    files.map((file) => [
      file,
      [...fs.readFileSync(file, "utf8").matchAll(/from ['"]([^'"]+)['"]/g)]
        .map((m) => m[1])
        .filter((p) => p.startsWith("."))
        .map((p) => path.resolve(path.dirname(file), p)),
    ]),
  );
  const visiting = new Set(),
    visited = new Set();
  function visit(file) {
    assert.ok(!visiting.has(file), "circular dependency: " + file);
    if (visited.has(file)) return;
    visiting.add(file);
    for (const dep of graph.get(file) || []) visit(dep);
    visiting.delete(file);
    visited.add(file);
  }
  files.forEach(visit);
  for (const [file, deps] of graph)
    if (file.includes("/game/") || file.includes("/state/"))
      for (const dep of deps)
        assert.ok(!dep.includes("/ui/"), "simulation importing UI: " + file);
});
