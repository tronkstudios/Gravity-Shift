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
  const node = () => {
    const classes = new Set();
    return {
      textContent: "",
      style: {},
      classList: {
        add(...names) {
          names.forEach((name) => classes.add(name));
        },
        remove(...names) {
          names.forEach((name) => classes.delete(name));
        },
        contains(name) {
          return classes.has(name);
        },
        toggle(name, force) {
          const enabled = force === undefined ? !classes.has(name) : force;
          if (enabled) classes.add(name);
          else classes.delete(name);
          return enabled;
        },
      },
      setAttribute() {},
      addEventListener() {},
      appendChild() {},
    };
  };
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
  return { ...classes, storage, nodes };
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
  const {
    GravityShiftGame,
    ProceduralWorld,
    THREE,
    ScoreManager,
    GravitySystem,
  } = runtime();
  const g = Object.create(GravityShiftGame.prototype);
  let hits = 0;
  const obs = {
    type: "LASER",
    surfaceKey: "FLOOR",
    halfD: 0.6,
    halfW: 5.4,
    localX: 0,
    mesh: { position: new THREE.Vector3(0, -6.97, -1.6) },
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
    lastShiftSequence: 0,
    lastFeedbackSequence: 0,
    baseSpeed: 68,
    maxSpeed: 68,
    scoreMgr: new ScoreManager(),
    gravitySys: new GravitySystem(),
    player: {
      root: new THREE.Group(),
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
  const pausedDistance = game.scoreMgr.distance;
  game.resumeGame();
  assert.equal(game.state, "RESUMING");
  while (game.state === "RESUMING") game.animate(game.lastTime + 50);
  assert.equal(game.state, "PLAYING");
  assert.equal(game.scoreMgr.distance, pausedDistance);
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
test("authored phrases retain a safe coin route at every difficulty", () => {
  const { ProceduralWorld, THREE, SeededRNG } = runtime();
  for (const distance of [0, 250, 1000]) {
    const world = new ProceduralWorld(
      new THREE.Scene(),
      new SeededRNG("PHRASES"),
    );
    world.spawnNextPattern(distance);
    const rows = new Map();
    for (const ob of world.obstacles) {
      const z = ob.mesh.position.z;
      rows.set(z, [...(rows.get(z) || []), ob]);
    }
    assert.equal(rows.size, 3);
    const positions = [...rows.keys()].sort((a, b) => b - a);
    assert.ok(positions[0] - positions[1] >= 52);
    for (const [z, row] of rows) {
      const safe = row[0].safeSurface;
      assert.ok(row.every((ob) => ob.surfaceKey !== safe));
      assert.ok(new Set(row.map((ob) => ob.surfaceKey)).size <= 3);
      assert.ok(
        world.collectibles.some(
          (coin) =>
            coin.surfaceKey === safe &&
            coin.mesh.position.z > z &&
            coin.mesh.position.z <= z + 18,
        ),
      );
    }
  }
});
test("perfect shifts require a timed threat and safe destination and pay once per obstacle", async () => {
  const { judgePerfectShift } = await import("../src/game/shift-judge.js");
  const threat = {
    surfaceKey: "FLOOR",
    type: "LASER",
    mesh: { position: { z: -12 } },
  };
  assert.equal(judgePerfectShift([threat], "FLOOR", "LEFT", 30), true);
  assert.equal(judgePerfectShift([threat], "FLOOR", "LEFT", 30), false);
  const second = { ...threat, perfectCredited: false };
  assert.equal(
    judgePerfectShift(
      [second, { surfaceKey: "LEFT", mesh: { position: { z: -5 } } }],
      "FLOOR",
      "LEFT",
      30,
    ),
    false,
  );
  assert.equal(
    judgePerfectShift(
      [{ ...second, mesh: { position: { z: -100 } } }],
      "FLOOR",
      "LEFT",
      30,
    ),
    false,
  );
});
test("all three achievements unlock and persist without charging currency or duplicating runs", () => {
  const { ScoreManager, storage } = runtime();
  const score = new ScoreManager();
  score.updateFrame(60, 0);
  for (let i = 0; i < 5; i++) score.awardPerfect();
  for (let i = 0; i < 50; i++) score.collectOrb();
  assert.equal(score.saveData.achievements.length, 3);
  for (const skin of ["phantom", "volt", "frost"])
    assert.ok(score.saveData.unlockedSkins.includes(skin));
  assert.equal(score.saveData.totalEnergy, 400);
  score.finalizeRun();
  score.finalizeRun();
  assert.equal(score.saveData.totalRuns, 1);
  assert.equal(JSON.parse(storage.value).achievements.length, 3);
});
test("zones change at the configured distances and transition lighting without changing geometry", async () => {
  const { zoneForDistance } = await import("../src/data/run-content.js");
  const { ZoneController } = await import("../src/graphics/zone-controller.js");
  const { ProceduralWorld, THREE, SeededRNG } = runtime();
  assert.equal(zoneForDistance(0).id, "industrial");
  assert.equal(zoneForDistance(250).id, "reactor");
  assert.equal(zoneForDistance(650).id, "fracture");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151d);
  scene.fog = new THREE.Fog(0x10151d, 20, 80);
  const world = new ProceduralWorld(scene, new SeededRNG("ZONE"));
  const controller = new ZoneController(scene, world),
    segments = world.tunnelSegments.length;
  controller.update(100, 650);
  assert.equal(controller.zone.id, "fracture");
  assert.equal(controller.changed, true);
  assert.equal(world.tunnelSegments.length, segments);
  assert.equal(scene.background.getHex(), 0x141020);
  controller.update(0.01, 650);
  assert.equal(controller.changed, false);
});
test("animation clips loop continuously and include run, transfer and additive landing", async () => {
  const { createHumanClips } = await import("../src/graphics/human-motion.js");
  const clips = createHumanClips();
  assert.deepEqual(Object.keys(clips), ["run", "transfer", "landing"]);
  for (const track of clips.run.tracks) {
    assert.ok(track.values.every(Number.isFinite));
    assert.ok(Math.abs(track.values[0] - track.values.at(-1)) < 0.0001);
  }
  assert.ok(clips.transfer.tracks.length > 20);
  assert.equal(clips.landing.duration, 0.28);
});
test("rewarded ads never reward a cancellation or duplicate provider callbacks", async () => {
  runtime();
  const { RewardedAdService } = await import("../src/services/rewarded-ads.js");
  const service = new RewardedAdService();
  let callbacks,
    rewards = 0,
    cancelled = 0,
    unavailable = 0;
  service.requestRewardedAd({
    onRewardGranted() {
      rewards++;
    },
    onProviderUnavailable() {
      unavailable++;
    },
  });
  assert.equal(unavailable, 1);
  assert.equal(rewards, 0);
  service.registerProvider({
    showRewardedAd(options) {
      callbacks = options;
    },
  });
  service.requestRewardedAd({
    onRewardGranted() {
      rewards++;
    },
    onAdDismissed() {
      cancelled++;
    },
  });
  callbacks.onCancel();
  callbacks.onReward();
  assert.equal(rewards, 0);
  assert.equal(cancelled, 1);
  service.requestRewardedAd({
    onRewardGranted() {
      rewards++;
    },
  });
  callbacks.onReward();
  callbacks.onReward();
  assert.equal(rewards, 1);
});
test("retry starts immediately and each run can continue only once", () => {
  const { GravityShiftGame } = runtime();
  const game = new GravityShiftGame({
    rendererFactory: () => ({
      domElement: { addEventListener() {} },
      setSize() {},
      setPixelRatio() {},
      render() {},
    }),
    hangarFactory: () => ({ isActive: false }),
  });
  game.startNewRun({ instant: true });
  assert.equal(game.state, "PLAYING");
  game.lastDeath = { type: "LASER", surfaceKey: "FLOOR" };
  game.handleGameOver();
  assert.equal(game.state, "GAMEOVER");
  const balance = game.scoreMgr.saveData.totalEnergy;
  assert.equal(game.continueRun({ useEnergy: true }), true);
  assert.equal(game.scoreMgr.saveData.totalEnergy, balance - 50);
  game.handleGameOver();
  assert.equal(game.continueRun(), false);
  game.startNewRun({ instant: true });
  assert.equal(game.scoreMgr.reviveUsed, false);
  assert.equal(game.state, "PLAYING");
});
test("H5 rewarded continuation waits for the completed placement before resuming", async () => {
  runtime();
  const { RewardedAdService } = await import("../src/services/rewarded-ads.js");
  let placement,
    rewards = 0;
  window.adBreak = (options) => {
    placement = options;
  };
  const service = new RewardedAdService();
  service.requestRewardedAd({
    onRewardGranted() {
      rewards++;
    },
  });
  placement.adViewed();
  assert.equal(rewards, 0);
  assert.equal(service.busy, true);
  placement.adBreakDone({ breakStatus: "viewed" });
  assert.equal(rewards, 1);
  assert.equal(service.busy, false);
  placement.adBreakDone({ breakStatus: "viewed" });
  assert.equal(rewards, 1);
});
function visualGame() {
  const env = runtime();
  const game = new env.GravityShiftGame({
    rendererFactory: () => ({
      domElement: { addEventListener() {} },
      setSize() {},
      setPixelRatio() {},
      render() {},
    }),
    hangarFactory: () => ({ isActive: false }),
  });
  game.startNewRun({ instant: true });
  game.world.collectibles = [];
  game.world.nextPatternZ = -1000;
  const threat = new env.THREE.Group();
  threat.position.z = -12;
  game.world.obstacles = [
    {
      type: "LASER",
      surfaceKey: "FLOOR",
      mesh: threat,
      halfD: 0.6,
      halfW: 5.4,
      localX: 0,
    },
  ];
  return { ...env, game };
}
test("perfect shift and lethal collision in the same simulation step shows defeat only", () => {
  const { game, THREE, nodes } = visualGame();
  const rotor = new THREE.Group();
  rotor.rotation.z = Math.PI / 2;
  game.world.obstacles.push({
    type: "ROTATING",
    surfaceKey: "ALL",
    mesh: rotor,
    rotSpeed: 0,
    halfD: 0.9,
  });
  game.gravitySys.shiftTo("LEFT");
  game.animate(game.lastTime + 10);
  assert.equal(game.state, "GAMEOVER");
  assert.equal(game.scoreMgr.perfects, 0);
  assert.equal(
    nodes.get("perfect-feedback").classList.contains("hidden"),
    true,
  );
  assert.equal(nodes.get("toast-msg").textContent, "");
  assert.equal(game.perfectUntil, 0);
  assert.equal(nodes.get("modal-gameover").classList.contains("hidden"), false);
});
test("death and retry clear an already visible perfect banner, toast and flash", () => {
  const { game, nodes } = visualGame();
  game.gravitySys.shiftTo("LEFT");
  game.animate(game.lastTime + 10);
  assert.equal(game.scoreMgr.perfects, 1);
  assert.equal(
    nodes.get("perfect-feedback").classList.contains("hidden"),
    false,
  );
  game.handleGameOver();
  assert.equal(
    nodes.get("perfect-feedback").classList.contains("hidden"),
    true,
  );
  assert.equal(nodes.get("toast-msg").classList.contains("opacity-0"), true);
  assert.equal(nodes.get("toast-msg").textContent, "");
  assert.equal(game.audio.perfectTimeout, null);
  game.startNewRun({ instant: true });
  assert.equal(game.perfectUntil, 0);
  assert.equal(nodes.get("screen-flash").style.opacity, "0");
  assert.equal(
    nodes.get("perfect-feedback").classList.contains("hidden"),
    true,
  );
});
test("camera follows the current gravity pose and stays stable through opposite-wall turns", async () => {
  const { CameraController } =
    await import("../src/graphics/camera-controller.js");
  const { GravitySystem, THREE } = runtime();
  const gravity = new GravitySystem(),
    camera = new THREE.PerspectiveCamera(),
    controller = new CameraController(camera);
  controller.reset(gravity);
  const start = camera.position.clone();
  gravity.shiftTo("CEILING");
  controller.update(1 / 120, {}, gravity, 30);
  assert.ok(
    camera.position.distanceTo(start) < 1e-8,
    "must not dive before body takeoff",
  );
  let previous = camera.quaternion.clone();
  for (let i = 0; i < 90; i++) {
    gravity.update(1 / 120);
    controller.update(1 / 120, {}, gravity, 30);
    assert.ok(
      previous.angleTo(camera.quaternion) < 0.6,
      "no sudden camera flip",
    );
    assert.ok(Math.abs(controller.currentUp.length() - 1) < 1e-8);
    previous.copy(camera.quaternion);
  }
  gravity.setSurfaceImmediate("FLOOR");
  controller.reset(gravity);
  assert.ok(camera.position.distanceTo(start) < 1e-8);
});
test("invisible shields cannot occlude particles and expired shields disappear immediately", async () => {
  const { Player } = await import("../src/game/player.js");
  const { THREE, GravitySystem } = runtime();
  const player = new Player(new THREE.Scene()),
    gravity = new GravitySystem();
  player.update(0.01, 30, gravity);
  assert.equal(player.shieldMesh.visible, false);
  assert.equal(player.shieldMat.depthWrite, false);
  assert.equal(player.particleMat.depthWrite, false);
  assert.equal(player.particleSystem.frustumCulled, false);
  player.shieldTimer = 0.005;
  player.update(0.01, 30, gravity);
  assert.equal(player.shieldMesh.visible, false);
  assert.equal(player.shieldTimer, 0);
});
test("swipe fires during movement once per gesture and cancels multi-touch", async () => {
  const { SwipeGesture } = await import("../src/input/swipe-gesture.js");
  const swipe = new SwipeGesture(24);
  swipe.begin(1, 100, 100);
  assert.equal(swipe.move(1, 110, 100), null);
  assert.equal(swipe.move(1, 135, 101), "RIGHT");
  assert.equal(swipe.move(1, 160, 102), null);
  swipe.cancel();
  swipe.begin(2, 100, 100);
  assert.equal(swipe.move(2, 100, 60), "CEILING");
  swipe.cancel();
  swipe.begin(3, 0, 0);
  swipe.begin(4, 0, 0);
  assert.equal(swipe.move(3, 70, 0), null);
  assert.equal(swipe.move(4, 70, 0), null);
});
test("pointer input invokes the surface action before pointerup and never duplicates it", () => {
  const { GravityShiftGame } = runtime(),
    events = {};
  const actions = [];
  const game = new GravityShiftGame({
    rendererFactory: () => ({
      domElement: {
        style: {},
        addEventListener(type, handler) {
          events[type] = handler;
        },
      },
      setPixelRatio() {},
      setSize() {},
      render() {},
    }),
    hangarFactory: () => ({ isActive: false }),
  });
  game.startNewRun({ instant: true });
  game.triggerSurfaceShift = (surface) => actions.push(surface);
  events.pointerdown({
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    pointerType: "touch",
  });
  events.pointermove({ pointerId: 1, clientX: 60, clientY: 100 });
  assert.deepEqual(actions, ["LEFT"]);
  events.pointerup({ pointerId: 1, clientX: 55, clientY: 100 });
  assert.deepEqual(actions, ["LEFT"]);
});
test("resume countdown freezes hazards and can be cancelled back to pause", () => {
  const { game, nodes } = visualGame();
  game.pauseGame();
  const distance = game.scoreMgr.distance;
  const z = game.world.obstacles[0].mesh.position.z;
  game.resumeGame();
  game.animate(game.lastTime + 50);
  assert.equal(game.state, "RESUMING");
  assert.equal(game.scoreMgr.distance, distance);
  assert.equal(game.world.obstacles[0].mesh.position.z, z);
  game.cancelResume();
  assert.equal(game.state, "PAUSED");
  assert.equal(nodes.get("countdown").classList.contains("hidden"), true);
  game.resumeGame();
  while (game.state === "RESUMING") game.animate(game.lastTime + 50);
  assert.equal(game.state, "PLAYING");
  assert.equal(game.scoreMgr.distance, distance);
});
test("adaptive quality lowers after sustained slow frames and recovers gradually", async () => {
  const { AdaptiveQuality } =
    await import("../src/graphics/adaptive-quality.js");
  const ratios = [],
    profiles = [];
  const quality = new AdaptiveQuality(
    {
      setPixelRatio(r) {
        ratios.push(r);
      },
    },
    2,
    (p) => profiles.push(p),
  );
  quality.setMode("AUTO");
  assert.equal(quality.ratio, 1.5);
  for (let i = 0; i < 100; i++) quality.update(1 / 30);
  assert.ok(quality.ratio < 1.5);
  const low = quality.ratio;
  for (let i = 0; i < 600; i++) quality.update(1 / 60);
  assert.ok(quality.ratio > low);
  quality.setMode("PERFORMANCE");
  const fixed = quality.ratio;
  for (let i = 0; i < 100; i++) quality.update(0.04);
  assert.equal(quality.ratio, fixed);
  quality.setMode("HIGH");
  assert.equal(profiles.at(-1).particles, 60);
  assert.equal(quality.ratio, 2);
  const one = new AdaptiveQuality({ setPixelRatio() {} }, 1, (p) =>
    profiles.push(p),
  );
  one.setMode("AUTO");
  one.setMode("HIGH");
  assert.equal(profiles.at(-1).label, "CALIDAD ALTA");
});
test("obstacles and coins reuse bounded pools and reset transforms and collision metadata", () => {
  const { ProceduralWorld, THREE, SeededRNG } = runtime();
  const world = new ProceduralWorld(new THREE.Scene(), new SeededRNG("POOL"));
  world.spawnSurfaceObstacle("LEFT", -20, "LASER");
  const mesh = world.obstacles[0].mesh;
  world.obstacles[0].perfectCredited = true;
  world.clearObjects();
  world.spawnSurfaceObstacle("RIGHT", -40, "LASER");
  assert.equal(world.obstacles[0].mesh, mesh);
  assert.equal(world.obstacles[0].perfectCredited, undefined);
  assert.equal(mesh.position.z, -40);
  world.clearObjects();
  world.spawnEnergyTrail("FLOOR", -20, 1, 4, 3);
  const coin = world.collectibles[0].mesh;
  world.clearObjects();
  world.spawnEnergyTrail("FLOOR", -10, 1, 4, 1);
  assert.equal(world.collectibles[0].mesh, coin);
  assert.equal(coin.scale.x, 1);
  assert.equal(world.collectibles[0].value, 1);
  for (let i = 0; i < 100; i++)
    world.spawnSurfaceObstacle("LEFT", -30, "BARRIER");
  world.clearObjects();
  assert.ok(world.obstaclePool.BARRIER.length <= 12);
  assert.ok(world.coinPool.length <= 64);
});
test("rest sections have no hazards and risk coins precede a hazard without blocking the safe route", () => {
  const { ProceduralWorld, THREE, SeededRNG } = runtime();
  const world = new ProceduralWorld(new THREE.Scene(), new SeededRNG("REST"));
  world.patternCounter = 3;
  world.nextPatternZ = -50;
  world.spawnNextPattern(500);
  assert.equal(world.obstacles.length, 0);
  assert.ok(world.collectibles.length >= 8);
  world.clearObjects();
  world.patternCounter = 4;
  world.nextPatternZ = -80;
  world.spawnNextPattern(500);
  const bonus = world.collectibles.filter((c) => c.value === 3);
  assert.equal(bonus.length, 3);
  assert.ok(
    bonus.every((coin) =>
      world.obstacles.some(
        (ob) =>
          ob.surfaceKey === coin.surfaceKey &&
          ob.mesh.position.z < coin.mesh.position.z,
      ),
    ),
  );
});
test("practice and daily score calculation never changes normal currency, achievements or records", () => {
  const { ScoreManager } = runtime();
  const score = new ScoreManager();
  const before = JSON.stringify(score.saveData);
  for (const mode of ["practice", "daily"]) {
    score.mode = mode;
    score.resetRun();
    score.updateFrame(100, 50);
    for (let i = 0; i < 60; i++) score.collectOrb(3);
    for (let i = 0; i < 8; i++) score.awardPerfect();
    assert.equal(score.finalizeRun(), false);
    assert.equal(JSON.stringify(score.saveData), before);
  }
});
test("practice covers all surfaces, lateral controls and a real timed perfect change", () => {
  const { game } = visualGame();
  const before = JSON.stringify(game.scoreMgr.saveData);
  game.startNewRun({ mode: "practice", instant: true });
  assert.equal(game.practice.stage.surface, "FLOOR");
  assert.equal(game.world.obstacles.length, 0);
  game.scoreMgr.collectOrb();
  game.scoreMgr.collectOrb();
  game.scoreMgr.collectOrb();
  game.practice.update(0.01, game);
  assert.equal(game.practice.stage.surface, "CEILING");
  for (const surface of ["LEFT", "RIGHT"]) {
    game.scoreMgr.collectOrb();
    game.practice.update(0.01, game);
    assert.equal(game.practice.stage.surface, surface);
  }
  game.scoreMgr.collectOrb();
  game.practice.update(0.01, game);
  assert.equal(game.practice.stage.goal, "lateral");
  game.gravitySys.nudgeLateral(1);
  game.practice.update(0.01, game);
  assert.equal(game.practice.stage.goal, "perfect");
  assert.equal(game.world.obstacles.length, 1);
  game.scoreMgr.awardPerfect();
  game.practice.update(0.01, game);
  assert.equal(game.practice.done, true);
  assert.equal(JSON.stringify(game.scoreMgr.saveData), before);
});
test("practice collision retries its exercise without dying or spending energy", () => {
  const { game } = visualGame();
  game.startNewRun({ mode: "practice", instant: true });
  const balance = game.scoreMgr.saveData.totalEnergy;
  game.handleGameOver();
  assert.equal(game.state, "PLAYING");
  assert.equal(game.practice.pendingRetry, true);
  game.practice.update(0.02, game);
  assert.equal(game.practice.pendingRetry, false);
  assert.equal(game.scoreMgr.saveData.totalEnergy, balance);
  assert.equal(game.continueRun({ useEnergy: true }), false);
});
test("daily dates, seeds and links agree across time zones and reject impossible dates", async () => {
  const { dailyDate, dailySeed, validChallengeDate, challengeUrl } =
    await import("../src/game/daily-challenge.js");
  assert.equal(dailyDate(new Date("2026-11-09T22:59:59Z")), "2026-11-09");
  assert.equal(dailyDate(new Date("2026-11-09T23:00:00Z")), "2026-11-10");
  assert.equal(dailyDate(new Date("2026-07-01T22:00:00Z")), "2026-07-02");
  assert.equal(dailySeed("2026-11-09"), "DAILY-2026-11-09");
  assert.equal(validChallengeDate("2026-02-30"), false);
  assert.equal(
    challengeUrl("https://game.example/?other=secret#old", "2026-11-09"),
    "https://game.example/?daily=2026-11-09",
  );
});
test("daily runs replay the same layout, save an independent record and forbid continuation", () => {
  const { game } = visualGame();
  const profile = game.scoreMgr.saveData,
    balance = profile.totalEnergy,
    best = profile.bestScore;
  game.startNewRun({
    mode: "daily",
    challengeDate: "2026-11-09",
    instant: true,
  });
  const signature = () =>
    game.world.obstacles.map((ob) => [
      ob.type,
      ob.surfaceKey,
      ob.mesh.position.z,
      ob.phase,
    ]);
  const first = signature();
  game.scoreMgr.score = 1234;
  game.scoreMgr.distance = 70;
  game.handleGameOver();
  assert.equal(profile.dailyRecords["2026-11-09"].score, 1234);
  assert.equal(profile.bestScore, best);
  assert.equal(profile.totalEnergy, balance);
  assert.equal(game.continueRun(), false);
  game.startNewRun({
    mode: "daily",
    challengeDate: "2026-11-09",
    instant: true,
  });
  assert.deepEqual(signature(), first);
  assert.equal(game.gravitySys.transitionDuration, 0.24);
});
test("save backup round trips progress and rejects malformed input without touching the live profile", async () => {
  const { parseBackup, exportBackup } =
    await import("../src/persistence/save-backup.js");
  const { ScoreManager } = runtime();
  const score = new ScoreManager();
  score.saveData.unlockedSkins.push("phantom");
  score.saveData.dailyRecords["2026-11-09"] = { score: 42, distance: 12 };
  const restored = parseBackup(exportBackup(score.saveData));
  assert.ok(restored.unlockedSkins.includes("phantom"));
  assert.equal(restored.dailyRecords["2026-11-09"].score, 42);
  const before = JSON.stringify(score.saveData);
  assert.throws(() => parseBackup("{bad json"));
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        game: "gravity-shift",
        version: 2,
        profile: { totalEnergy: -1, unlockedSkins: ["core"] },
      }),
    ),
  );
  assert.equal(JSON.stringify(score.saveData), before);
});
test("storage failure is observable and does not destroy in-memory progress", async () => {
  const { BrowserSaveStore } =
    await import("../src/persistence/browser-save-store.js");
  const { ScoreManager } = runtime();
  globalThis.localStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("blocked");
    },
  };
  const store = new BrowserSaveStore(),
    score = new ScoreManager(store);
  assert.equal(store.status, "unavailable");
  score.collectOrb();
  const energy = score.saveData.totalEnergy;
  assert.equal(score.persist(), false);
  assert.equal(score.saveStatus, "error");
  assert.equal(score.saveData.totalEnergy, energy);
});
test("import preview is validated before confirmation and cancellation preserves current progress", async () => {
  const { exportBackup } = await import("../src/persistence/save-backup.js");
  const { game } = visualGame();
  const original = game.scoreMgr.saveData;
  const text = exportBackup({ ...original, totalEnergy: 999 });
  window.confirm = () => false;
  assert.equal(game.ui.importSave(text), false);
  assert.equal(game.scoreMgr.saveData, original);
  assert.throws(() => game.ui.importSave("invalid"));
  assert.equal(game.scoreMgr.saveData, original);
  window.confirm = () => true;
  assert.equal(game.ui.importSave(text), true);
  assert.equal(game.scoreMgr.saveData.totalEnergy, 999);
});
test("shared daily links pin the requested date and keep that date for result sharing", () => {
  const { game, nodes } = visualGame();
  game.returnToMainMenu();
  window.location = { href: "https://game.example/?daily=2026-11-08" };
  game.loadSharedDaily();
  assert.equal(game.challengeDate, "2026-11-08");
  assert.equal(game.linkChallenge, true);
  assert.ok(nodes.get("daily-label").textContent.includes("2026-11-08"));
  game.startNewRun({
    mode: "daily",
    challengeDate: game.challengeDate,
    instant: true,
  });
  assert.equal(game.ui.selectedDailyDate(), "2026-11-08");
});
test("finishing practice opens its completion screen and never modifies the profile", () => {
  const { game, nodes } = visualGame();
  const before = JSON.stringify(game.scoreMgr.saveData);
  game.startNewRun({ mode: "practice", instant: true });
  game.practice.index = 5;
  game.practice.enter(game);
  game.scoreMgr.awardPerfect();
  game.animate(game.lastTime + 10);
  assert.equal(game.state, "PRACTICE_DONE");
  assert.equal(
    nodes.get("practice-complete").classList.contains("hidden"),
    false,
  );
  assert.equal(JSON.stringify(game.scoreMgr.saveData), before);
});

test("run time and distance agree at 60 and 10 FPS, while a long stall pauses safely", () => {
  function run(frame, count) {
    const { game } = visualGame();
    game.world.clearObjects();
    game.world.nextPatternZ = -10000;
    for (let i = 0; i < count; i++) game.animate(game.lastTime + frame);
    return game;
  }
  const smooth = run(1000 / 60, 60),
    slow = run(100, 10);
  assert.ok(Math.abs(smooth.scoreMgr.elapsed - slow.scoreMgr.elapsed) < 0.01);
  assert.ok(Math.abs(smooth.scoreMgr.distance - slow.scoreMgr.distance) < 0.2);
  assert.ok(slow.scoreMgr.elapsed > 0.99);
  const before = slow.scoreMgr.distance;
  slow.animate(slow.lastTime + 1500);
  assert.equal(slow.state, "PAUSED");
  assert.equal(slow.scoreMgr.distance, before);
});
test("successive contracts award once and remain isolated from daily and practice profiles", () => {
  const { ScoreManager } = runtime();
  const s = new ScoreManager();
  const before = s.saveData.totalEnergy;
  s.distance = 250;
  s.updateFrame(0, 30);
  assert.equal(s.saveData.totalEnergy, before + 75);
  assert.equal(s.contractIndex, 0);
  s.distance = 750;
  s.updateFrame(0, 30);
  assert.equal(s.contractIndex, 1);
  const earned = s.saveData.totalEnergy;
  s.updateFrame(0, 30);
  assert.equal(s.saveData.totalEnergy, earned);
  for (let i = 0; i < 20; i++) s.collectOrb();
  assert.equal(s.contractIndex, 2);
  assert.equal(s.saveData.totalEnergy, earned + 20 + 75);
  s.mode = "daily";
  const saved = s.saveData.totalEnergy;
  for (let i = 0; i < 3; i++) s.awardPerfect();
  assert.equal(s.saveData.totalEnergy, saved);
  s.resetRun();
  assert.equal(s.contractIndex, 0);
});
test("death playback restores world transforms and cannot change score, currency or run identity", () => {
  const { game, THREE } = visualGame();
  game.world.clearObjects();
  game.world.nextPatternZ = -10000;
  game.world.spawnSurfaceObstacle("FLOOR", -25, "BARRIER");
  for (let i = 0; i < 10; i++) game.animate(game.lastTime + 50);
  game.lastDeath = game.world.obstacles[0];
  game.lastDeath.lastContact = { x: 0, y: -6, z: 0 };
  game.handleGameOver();
  const snapshot = {
    score: game.scoreMgr.score,
    energy: game.scoreMgr.saveData.totalEnergy,
    runId: game.runId,
    z: game.lastDeath.mesh.position.z,
    position: game.player.root.position.clone(),
  };
  assert.ok(game.replay.start());
  assert.equal(game.state, "REPLAY");
  game.replay.update(0.4);
  game.replay.stop();
  assert.equal(game.state, "GAMEOVER");
  assert.equal(game.scoreMgr.score, snapshot.score);
  assert.equal(game.scoreMgr.saveData.totalEnergy, snapshot.energy);
  assert.equal(game.runId, snapshot.runId);
  assert.equal(game.lastDeath.mesh.position.z, snapshot.z);
  assert.ok(game.player.root.position.distanceTo(snapshot.position) < 1e-9);
});

test("workshop purchases persist and cannot overspend; backups retain upgrades and boards", async () => {
  const { ScoreManager } = runtime();
  const { buyUpgrade, buyBoard } = await import("../src/data/items.js");
  const { exportBackup, parseBackup } =
    await import("../src/persistence/save-backup.js");
  const s = new ScoreManager();
  s.saveData.totalEnergy = 200;
  assert.ok(buyUpgrade(s.saveData, "magnet"));
  assert.equal(s.saveData.totalEnergy, 80);
  assert.equal(buyUpgrade(s.saveData, "magnet"), false);
  assert.ok(buyBoard(s.saveData));
  assert.equal(s.saveData.inventory.boards, 1);
  assert.equal(s.saveData.totalEnergy, 20);
  assert.equal(buyBoard(s.saveData), false);
  s.persist();
  const restored = new ScoreManager();
  assert.equal(restored.saveData.upgrades.magnet, 1);
  assert.equal(restored.saveData.inventory.boards, 1);
  const backup = parseBackup(exportBackup(s.saveData));
  assert.equal(backup.upgrades.magnet, 1);
  assert.equal(backup.inventory.boards, 1);
});
test("a board absorbs one real collision and a second crash after grace ends the run", () => {
  const { game } = visualGame();
  game.world.clearObjects();
  game.world.nextPatternZ = -10000;
  game.items.collect("board");
  game.world.spawnSurfaceObstacle("FLOOR", -0.3, "BARRIER");
  game.animate(game.lastTime + 30);
  assert.equal(game.state, "PLAYING");
  assert.equal(game.items.active.board, 0);
  assert.ok(game.player.shieldTimer > 0);
  for (let i = 0; i < 11; i++) game.animate(game.lastTime + 100);
  game.world.spawnSurfaceObstacle("FLOOR", -0.3, "BARRIER");
  game.animate(game.lastTime + 30);
  assert.equal(game.state, "GAMEOVER");
});
test("superboots clear a barrier that a regular jump cannot and upgrades stay out of daily runs", async () => {
  const { game, THREE } = visualGame();
  const { obstacleContact } = await import("../src/game/collision-shapes.js");
  game.world.clearObjects();
  game.world.spawnSurfaceObstacle("FLOOR", 0, "BARRIER");
  const ob = game.world.obstacles[0];
  game.items.jump();
  game.items.tick(0.399);
  game.player.place(game.gravitySys);
  assert.ok(
    obstacleContact(ob, game.player.root.position, game.player.upDirection),
  );
  game.items.cancelJump();
  game.items.collect("boots");
  game.items.jump();
  game.items.tick(0.399);
  game.player.place(game.gravitySys);
  assert.equal(
    obstacleContact(ob, game.player.root.position, game.player.upDirection),
    null,
  );
  game.scoreMgr.saveData.upgrades.magnet = 3;
  assert.equal(game.items.duration("magnet"), 14);
  game.runMode = "daily";
  assert.equal(game.items.duration("magnet"), 8);
  assert.equal(game.items.useBoard(), false);
});
test("magnet pulls real coins into pickup range and score boosts never multiply currency", () => {
  const { game, ScoreManager } = visualGame();
  game.world.clearObjects();
  game.world.nextPatternZ = -10000;
  game.player.place(game.gravitySys);
  game.world.spawnEnergyTrail("FLOOR", -5, 1);
  game.items.collect("magnet");
  for (let i = 0; i < 30; i++) game.animate(game.lastTime + 20);
  assert.ok(game.scoreMgr.collectedCoins >= 1);
  const a = new ScoreManager(),
    b = new ScoreManager();
  b.scoreBoost = 2;
  a.collectOrb();
  b.collectOrb();
  assert.equal(b.score, a.score * 2);
  assert.equal(a.saveData.totalEnergy, b.saveData.totalEnergy);
});
test("rare runners unlock their skin only when caught and the reward survives defeat", () => {
  const { game } = visualGame();
  game.world.clearObjects();
  game.world.nextPatternZ = -10000;
  game.player.place(game.gravitySys);
  const energy = game.scoreMgr.saveData.totalEnergy;
  assert.ok(game.rivals.spawn("phantom"));
  assert.equal(game.scoreMgr.saveData.unlockedSkins.includes("phantom"), false);
  game.rivals.active.z = -0.5;
  game.rivals.tick(0.01);
  assert.ok(game.scoreMgr.saveData.unlockedSkins.includes("phantom"));
  assert.equal(game.scoreMgr.saveData.totalEnergy, energy);
  assert.equal(game.rivals.active, null);
  assert.equal(game.rivals.spawn("volt"), false);
  game.handleGameOver();
  assert.ok(game.scoreMgr.saveData.unlockedSkins.includes("phantom"));
  game.startNewRun({ instant: true, mode: "daily" });
  assert.equal(game.rivals.spawn("volt"), false);
});
test("rare runners travel slower and evade a real generated route without colliding", () => {
  const { game } = visualGame();
  game.world.resetWorld();
  game.player.root.position.x = 100;
  game.currentSpeed = 40;
  game.rivals.spawn("phantom");
  const start = game.rivals.active.z;
  for (let i = 0; i < 900; i++) {
    game.world.update(1 / 120, 40, (i / 120) * 18);
    game.rivals.tick(1 / 120);
    const rival = game.rivals.active;
    assert.ok(rival);
    assert.equal(
      game.rivals.contacts(
        rival.player.root.position,
        rival.player.upDirection,
        rival.z,
      ),
      false,
    );
  }
  assert.ok(game.rivals.active.z > start);
  assert.ok(game.rivals.active.z < 0);
  game.rivals.despawn();
});
