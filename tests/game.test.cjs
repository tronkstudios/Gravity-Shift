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
test("menu camera stays locked while the character changes surfaces", async () => {
  const { CameraController } =
    await import("../src/graphics/camera-controller.js");
  const { THREE, GravitySystem } = runtime();
  const camera = new THREE.PerspectiveCamera();
  const controller = new CameraController(camera);
  const gravity = new GravitySystem();
  controller.update(0.016, {}, gravity, 21, true);
  const position = camera.position.clone(),
    quaternion = camera.quaternion.clone();
  gravity.setSurfaceImmediate("CEILING");
  controller.update(0.05, {}, gravity, 60, true);
  assert.ok(camera.position.equals(position));
  assert.ok(camera.quaternion.equals(quaternion));
});
test("menu autopilot avoids an approaching surface barrier without awarding progression", async () => {
  const { MenuDirector } = await import("../src/game/menu-director.js");
  const { GravitySystem, ScoreManager } = runtime();
  const gravity = new GravitySystem(),
    score = new ScoreManager();
  const energy = score.saveData.totalEnergy;
  let shifts = 0,
    bursts = 0;
  const world = {
    obstacles: [
      { type: "BARRIER", surfaceKey: "FLOOR", mesh: { position: { z: -12 } } },
    ],
    collectibles: [],
    notifySurfaceShift() {
      shifts++;
    },
    checkCollisions(player, g, onOrb) {
      onOrb();
    },
  };
  new MenuDirector().update(0.016, world, gravity, {
    emitBurst() {
      bursts++;
    },
  });
  assert.notEqual(gravity.targetSurface.id, "FLOOR");
  assert.equal(shifts, 1);
  assert.ok(bursts > 0);
  assert.equal(score.saveData.totalEnergy, energy);
  assert.equal(score.distance, 0);
});
test("interior menu game keeps tunnel walls visible and restores the full viewport", async () => {
  const { MenuStage } = await import("../src/graphics/menu-stage.js");
  runtime();
  const stage = new MenuStage();
  assert.ok(stage.world.tunnelSegments.every((segment) => segment.visible));
  for (let i = 0; i < 120; i++) stage.update(1 / 60, "core");
  assert.ok(Number.isFinite(stage.camera.position.x));
  const calls = [];
  stage.render(
    {
      setScissorTest(value) {
        calls.push(["scissor", value]);
      },
      setViewport(...args) {
        calls.push(["viewport", ...args]);
      },
      setScissor() {},
      clear() {},
      render(scene, camera) {
        assert.equal(scene, stage.scene);
        assert.equal(camera, stage.camera);
      },
    },
    1200,
    800,
  );
  assert.deepEqual(calls.at(-2), ["scissor", false]);
  assert.deepEqual(calls.at(-1), ["viewport", 0, 0, 1200, 800]);
});
test("all 16 skins have movable elbow, knee and ankle chains", async () => {
  const { SkinMeshBuilder } =
    await import("../src/graphics/skin-mesh-builder.js");
  const { SKINS_CATALOG } = await import("../src/data/skins.js");
  const { RigAnimator } = await import("../src/graphics/rig-animator.js");
  for (const skin of SKINS_CATALOG) {
    const rig = SkinMeshBuilder.buildCharacterRig(skin);
    for (const name of [
      "leftElbow",
      "rightElbow",
      "leftKnee",
      "rightKnee",
      "leftAnkle",
      "rightAnkle",
    ])
      assert.ok(rig.joints[name]?.parent, skin.id + ": " + name);
    assert.equal(rig.joints.leftKnee.parent, rig.leftLeg);
    assert.equal(rig.joints.leftAnkle.parent, rig.joints.leftKnee);
    const animator = new RigAnimator();
    animator.update(rig, 0.1, Math.PI / 2, false);
    assert.ok(rig.joints.leftKnee.rotation.x < 0);
    assert.ok(rig.joints.leftElbow.rotation.x > 0);
    animator.update(rig, 0.1, 0, true, 0.5);
    animator.update(rig, 0.05, 0, false);
    assert.ok(animator.landing > 0);
    SkinMeshBuilder.disposeRig(rig);
  }
});
test("autonomous game actually collects coins and passes hazards over time", async () => {
  const { MenuStage } = await import("../src/graphics/menu-stage.js");
  runtime();
  const stage = new MenuStage();
  for (let i = 0; i < 900; i++) stage.update(1 / 30, "core");
  assert.ok(stage.director.coins > 0, "must visibly pick up coins");
  assert.ok(stage.director.dodges > 0, "must pass obstacles");
});
test("rapid directional inputs are buffered without snapping the gravity pose", () => {
  const { GravitySystem } = runtime();
  const gravity = new GravitySystem();
  gravity.shiftTo("CEILING");
  gravity.update(0.05);
  const position = gravity.currentPos2D.clone(),
    rotation = gravity.currentQuat.clone();
  assert.equal(gravity.shiftTo("RIGHT"), false);
  assert.ok(gravity.currentPos2D.equals(position));
  assert.ok(gravity.currentQuat.equals(rotation));
  gravity.update(0.2);
  assert.equal(gravity.currentSurface.id, "CEILING");
  assert.equal(gravity.targetSurface.id, "RIGHT");
  gravity.update(0.2);
  assert.equal(gravity.currentSurface.id, "RIGHT");
  assert.equal(gravity.isTransitioning, false);
  assert.ok(gravity.currentPos2D.equals(gravity.targetSurface.basePos));
});
test("all character designs have articulated geometry and distinct silhouette families", async () => {
  const { SkinMeshBuilder } =
    await import("../src/graphics/skin-mesh-builder.js");
  const { SKINS_CATALOG } = await import("../src/data/skins.js");
  const families = new Set();
  for (const skin of SKINS_CATALOG) {
    const rig = SkinMeshBuilder.buildCharacterRig(skin);
    families.add(rig.designFamily);
    assert.ok(rig.joints.leftKnee.children.length >= 3);
    SkinMeshBuilder.disposeRig(rig);
  }
  assert.equal(families.size, 5);
});
test("human gait plants the stance foot and bends knees only anatomically", async () => {
  const { sampleFoot, solveLeg } =
    await import("../src/graphics/rig-animator.js");
  for (let i = 0; i < 100; i++) {
    const foot = sampleFoot(i / 100);
    const pose = solveLeg(foot.z, 0.66 - foot.lift);
    assert.ok(pose.knee <= 0 && pose.knee >= -Math.PI);
    if (foot.contact) assert.equal(foot.lift, 0);
    const y =
      -0.36 * Math.cos(pose.hip) - 0.36 * Math.cos(pose.hip + pose.knee);
    const z =
      -0.36 * Math.sin(pose.hip) - 0.36 * Math.sin(pose.hip + pose.knee);
    assert.ok(Math.abs(y - (-0.66 + foot.lift)) < 0.002);
    assert.ok(Math.abs(z - foot.z) < 0.002);
    assert.ok(Math.abs(pose.hip + pose.knee + pose.ankle) < 0.00001);
  }
});
