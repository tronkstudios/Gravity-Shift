import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";

test.skip(
  process.env.SITES_MANAGED_LINUX_CONTAINER === "1",
  "Browser QA runs on the GitHub runner, not the managed preview executor.",
);
async function ready(page) {
  await page.goto("/");
  await page.waitForFunction(
    () => window.gravityShiftGame?.modelReady === true,
  );
  await expect(page.locator("#loading-screen")).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
}
async function screenshot(page, info, name) {
  await page.screenshot({ path: info.outputPath(name), fullPage: true });
  await info.attach(name, {
    path: info.outputPath(name),
    contentType: "image/png",
  });
  if (existsSync(info.snapshotPath(name)))
    await expect(page).toHaveScreenshot(name, {
      animations: "disabled",
      mask: [page.locator("#daily-label")],
      maxDiffPixelRatio: 0.025,
    });
}
async function freezeMenu(page) {
  await page.evaluate(() => {
    const game = window.gravityShiftGame;
    game.quality.setMode("HIGH");
    const stage = game.menuStage;
    stage.update = () => {};
    stage.gravity.setSurfaceImmediate("FLOOR");
    stage.player.reset();
    stage.player.elapsed = 0;
    stage.player.update(0.25, 22, stage.gravity, true);
    stage.cameraController.reset(stage.gravity);
    stage.world.rng.setSeed("VISUAL");
    stage.world.resetWorld();
    stage.world.notifySurfaceShift("FLOOR");
    stage.world.update(1, 0, 0);
    stage.zoneController.update(100, 0);
    stage.director.coins = 0;
    stage.director.dodges = 0;
  });
}
async function freezeRun(page, surface = "FLOOR") {
  await page.evaluate((surface) => {
    const game = window.gravityShiftGame;
    game.startNewRun({ instant: true });
    game.quality.setMode("HIGH");
    game.world.clearObjects();
    game.world.nextPatternZ = -10000;
    game.world.spawnSurfaceObstacle("LEFT", -45, "LASER");
    game.gravitySys.setSurfaceImmediate(surface);
    game.player.reset();
    game.player.elapsed = 0;
    game.player.update(0.25, 30, game.gravitySys, false);
    game.cameraCtrl.reset(game.gravitySys);
    game.ui.updateHUD();
    game.state = "QA_CAPTURE";
  }, surface);
}

test("menu and humanoid render without runtime errors or layout overflow", async ({
  page,
}, info) => {
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (
      /^https?:/.test(req.url()) &&
      !req.url().startsWith("http://127.0.0.1:4173")
    )
      external.push(req.url());
  });
  await ready(page);
  await freezeMenu(page);
  await expect(page.locator("#screen-main-menu")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => window.gravityShiftGame.player.currentRig.captured,
    ),
  ).toBe(true);
  await screenshot(page, info, "menu.png");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("runner stays inside the view on floor and ceiling and captured skeletons are independent", async ({
  page,
}, info) => {
  await ready(page);
  await freezeRun(page);
  await screenshot(page, info, "floor.png");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  for (const surface of ["FLOOR", "CEILING", "LEFT", "RIGHT"]) {
    await freezeRun(page, surface);
    const projection = await page.evaluate(() => {
      const g = window.gravityShiftGame;
      return [g.player.root, g.player.currentRig.head].map((node) => {
        const p = node
          .getWorldPosition(g.player.root.position.clone())
          .project(g.camera);
        return { x: p.x, y: p.y };
      });
    });
    for (const p of projection) {
      expect(Math.abs(p.x)).toBeLessThan(1);
      expect(Math.abs(p.y)).toBeLessThan(1);
    }
  }
  await freezeRun(page, "CEILING");
  await screenshot(page, info, "ceiling.png");
  expect(
    await page.evaluate(() => {
      const g = window.gravityShiftGame;
      return (
        g.player.currentRig.model.getObjectByName("leg_joint_L_1") !==
        g.menuStage.player.currentRig.model.getObjectByName("leg_joint_L_1")
      );
    }),
  ).toBe(true);
});
test("death takes precedence over perfect-shift feedback in a real WebGL session", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.world.clearObjects();
    g.world.nextPatternZ = -10000;
    g.world.spawnSurfaceObstacle("FLOOR", -12, "LASER");
    g.world.spawnRotatingBlades(0);
    const rotor = g.world.obstacles.at(-1);
    rotor.mesh.rotation.z = Math.PI / 2;
    rotor.rotSpeed = 0;
    g.gravitySys.shiftTo("LEFT");
  });
  await expect(page.locator("#modal-gameover")).toBeVisible();
  await expect(page.locator("#perfect-feedback")).toBeHidden();
  expect(
    await page.evaluate(() => window.gravityShiftGame.scoreMgr.perfects),
  ).toBe(0);
});
test("installed resources reload offline including the human model and daily challenge", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto("/?daily=2026-11-09");
  await page.waitForFunction(
    () => window.gravityShiftGame?.modelReady === true,
  );
  await expect(page.locator("#daily-label")).toContainText("2026-11-09");
  expect(
    await page.evaluate(
      () => window.gravityShiftGame.player.currentRig.captured,
    ),
  ).toBe(true);
  await page.goto("/privacy.html");
  await expect(page.locator("h1")).toContainText("Tu progreso");
  await context.setOffline(false);
});
test("records a transparent software-renderer performance and balance report", async ({
  page,
}, info) => {
  await ready(page);
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.world.clearObjects();
    g.world.nextPatternZ = -10000;
  });
  await page.waitForTimeout(6000);
  const report = await page.evaluate(() => {
    const g = window.gravityShiftGame,
      gl = g.renderer.getContext(),
      debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      environment:
        "GitHub Actions Chromium; software WebGL, not a physical mobile device",
      project: innerWidth < 700 ? "mobile emulation" : "desktop",
      renderer: debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : "unknown",
      measurement: g.metrics.snapshot(),
      batching: g.world.tunnelBatching,
      pool: {
        coins: g.world.coinPool.length,
        obstacles: Object.fromEntries(
          Object.entries(g.world.obstaclePool).map(([k, v]) => [k, v.length]),
        ),
      },
    };
  });
  expect(report.measurement.frames).toBeGreaterThan(0);
  expect(report.measurement.meanFps).toBeGreaterThan(0);
  await info.attach("performance.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
});

// r128 requires skinning on replacement materials; bone motion alone is insufficient.
test("human mesh deforms between run poses", async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.state = "QA_CAPTURE";
    const rig = g.player.currentRig;
    let mesh;
    rig.model.traverse((n) => {
      if (n.isSkinnedMesh) mesh = n;
    });
    const sample = () => {
      rig.model.updateMatrixWorld(true);
      mesh.skeleton.update();
      return Array.from(mesh.skeleton.boneMatrices);
    };
    g.player.rigAnimator.mixer.setTime(0.15);
    const a = sample();
    g.player.rigAnimator.mixer.setTime(0.65);
    const b = sample();
    return {
      skinning: mesh.material.skinning,
      change: a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0),
    };
  });
  expect(result.skinning).toBe(true);
  expect(result.change).toBeGreaterThan(1);
});

// Verify the shader actually used by WebGL, not just a material flag or moving bones.
test("deforming body shader and anatomical poses render in the menu and race", async ({
  page,
}, info) => {
  await ready(page);
  await freezeRun(page);
  const shader = await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.renderer.render(g.scene, g.camera);
    let mesh;
    g.player.currentRig.model.traverse((n) => {
      if (n.isSkinnedMesh) mesh = n;
    });
    const gl = g.renderer.getContext();
    const program = g.renderer.properties.get(mesh.material).currentProgram;
    return {
      source: gl.getShaderSource(program.vertexShader),
      separate: !g.player.currentRig.sockets.some(({ socket }) => {
        let shares = false;
        socket.traverse((n) => {
          if (n.material === mesh.material) shares = true;
        });
        return shares;
      }),
    };
  });
  expect(shader.source).toContain("#define USE_SKINNING");
  expect(shader.separate).toBe(true);
  for (const [name, phase, air] of [
    ["contact", 0, false],
    ["stride", Math.PI / 2, false],
    ["transfer", Math.PI / 2, true],
  ]) {
    await page.evaluate(
      ({ phase, air }) => {
        const g = window.gravityShiftGame;
        g.player.rigAnimator.update(g.player.currentRig, 0.1, phase, air, 0.5);
        g.camera.position.set(2.5, g.player.root.position.y + 1.25, 3.3);
        g.camera.up.set(0, 1, 0);
        g.camera.lookAt(0, g.player.root.position.y + 0.8, 0);
        g.camera.fov = 40;
        g.camera.updateProjectionMatrix();
        document.getElementById("screen-hud").style.visibility = "hidden";
      },
      { phase, air },
    );
    await screenshot(page, info, "runner-" + name + ".png");
  }
});

test("character art review across five suit silhouettes", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Mobile in-game art is captured by the pose test.",
  );
  await ready(page);
  await freezeRun(page);
  for (const skin of ["core", "phantom", "titan", "volt", "nebula"]) {
    await page.evaluate((skin) => {
      const g = window.gravityShiftGame;
      g.player.applySkin(skin);
      g.player.update(0, 30, g.gravitySys);
      g.player.rigAnimator.update(
        g.player.currentRig,
        0.05,
        Math.PI * 0.3,
        false,
        0,
        true,
      );
      document.getElementById("screen-hud").style.visibility = "hidden";
      g.world.tunnelSegments.forEach((segment) => (segment.visible = false));
      g.world.speedDust.visible = false;
      g.camera.position.set(-2, -5.8, -3.25);
      g.camera.up.set(0, 1, 0);
      g.camera.lookAt(0, -6.05, 0);
      g.camera.fov = 35;
      g.camera.updateProjectionMatrix();
    }, skin);
    await screenshot(page, info, "design-" + skin + ".png");
  }
});

test("hangar supports inspecting a chosen character angle", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Art inspection uses the desktop hangar.",
  );
  await ready(page);
  await page.locator("#btn-open-shop").click();
  await expect(page.locator("#modal-shop")).toBeVisible();
  const viewport = page.locator("#hangar-preview-viewport");
  const box = await viewport.boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await page.mouse.up();
  const angle = await page.evaluate(
    () => window.gravityShiftGame.hangarStudio.userYaw,
  );
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => window.gravityShiftGame.hangarStudio.userYaw),
  ).toBeCloseTo(angle, 5);
  await page.locator("#btn-preview-pose").click();
  await screenshot(page, info, "hangar-inspection.png");
});

test("queued intent can be cancelled and death replay preserves the finished run", async ({
  page,
}, info) => {
  await ready(page);
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.world.clearObjects();
    g.world.nextPatternZ = -10000;
    g.gravitySys.transitionDuration = 3;
    g.triggerSurfaceShift("LEFT");
    g.triggerSurfaceShift("CEILING");
    g.ui.updateHUD();
  });
  await expect(page.locator("#queued-shift")).toContainText("TECHO");
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.triggerSurfaceShift("LEFT");
    g.ui.updateHUD();
  });
  await expect(page.locator("#queued-shift")).toBeHidden();
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.gravitySys.setSurfaceImmediate("FLOOR");
    g.player.reset();
    g.cameraCtrl.reset(g.gravitySys);
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() =>
    window.gravityShiftGame.world.spawnSurfaceObstacle(
      "FLOOR",
      -0.4,
      "BARRIER",
    ),
  );
  await expect(page.locator("#modal-gameover")).toBeVisible();
  await expect(page.locator("#btn-watch-replay")).toBeVisible();
  const before = await page.evaluate(() => {
    const g = window.gravityShiftGame;
    return {
      score: g.scoreMgr.score,
      energy: g.scoreMgr.saveData.totalEnergy,
      run: g.runId,
    };
  });
  await page.locator("#btn-watch-replay").click();
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.state = "QA_REPLAY_CAPTURE";
    g.replay.update(g.replay.duration / 0.6);
  });
  await expect(page.locator("#replay-overlay")).toBeVisible();
  await screenshot(page, info, "defeat-replay.png");
  await page.locator("#btn-close-replay").click();
  await expect(page.locator("#modal-gameover")).toBeVisible();
  expect(
    await page.evaluate(() => {
      const g = window.gravityShiftGame;
      return {
        score: g.scoreMgr.score,
        energy: g.scoreMgr.saveData.totalEnergy,
        run: g.runId,
      };
    }),
  ).toEqual(before);
});

test("workshop purchases survive reload and pickups change jumping and board animation", async ({
  page,
}, info) => {
  await ready(page);
  await page.locator("#btn-open-workshop").click();
  await expect(page.locator("#modal-workshop")).toBeVisible();
  await page.locator('[data-upgrade="magnet"]').click();
  await page.locator("[data-buy-board]").click();
  expect(
    await page.evaluate(
      () => window.gravityShiftGame.scoreMgr.saveData.upgrades.magnet,
    ),
  ).toBe(1);
  await screenshot(page, info, "workshop.png");
  await ready(page);
  expect(
    await page.evaluate(
      () => window.gravityShiftGame.scoreMgr.saveData.inventory.boards,
    ),
  ).toBe(1);
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.world.clearObjects();
    g.world.nextPatternZ = -10000;
    g.items.useBoard();
    g.items.collect("boots");
    g.items.jump();
    g.items.tick(0.38);
    g.player.update(0.08, 30, g.gravitySys);
    g.cameraCtrl.reset(g.gravitySys);
    g.ui.updateHUD();
    g.state = "QA_CAPTURE";
  });
  expect(
    await page.evaluate(() => window.gravityShiftGame.player.jumpOffset),
  ).toBeGreaterThan(3);
  await screenshot(page, info, "superboots.png");
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.items.cancelJump();
    g.items.tick(0);
    g.player.update(0.1, 30, g.gravitySys);
    g.ui.updateHUD();
  });
  expect(
    await page.evaluate(() => window.gravityShiftGame.player.board.visible),
  ).toBe(true);
  await screenshot(page, info, "hoverboard.png");
});

test("rare runner evades an obstacle and catching it permanently unlocks the outfit", async ({
  page,
}, info) => {
  await ready(page);
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.startNewRun({ instant: true });
    g.world.clearObjects();
    g.world.nextPatternZ = -10000;
    g.player.place(g.gravitySys);
    g.state = "QA_CAPTURE";
    g.rivals.spawn("phantom");
    g.rivals.active.z = -12;
    g.world.spawnSurfaceObstacle("FLOOR", -26, "BARRIER");
    g.state = "PLAYING";
    for (let i = 0; i < 75; i++) {
      g.world.update(1 / 120, 30, 0);
      g.rivals.tick(1 / 120);
    }
    g.state = "QA_CAPTURE";
  });
  expect(
    await page.evaluate(() => {
      const g = window.gravityShiftGame,
        r = g.rivals.active;
      return g.rivals.contacts(
        r.player.root.position,
        r.player.upDirection,
        r.z,
      );
    }),
  ).toBe(false);
  await page.evaluate(() => {
    const g = window.gravityShiftGame,
      r = g.rivals.active;
    g.world.clearObjects();
    r.z = -3;
    r.gravity.setSurfaceImmediate("FLOOR");
    g.rivals.render(0.1);
    g.ui.updateHUD();
  });
  await expect(page.locator("#rival-notice")).toContainText("PHANTOM");
  await screenshot(page, info, "rare-runner.png");
  const energy = await page.evaluate(
    () => window.gravityShiftGame.scoreMgr.saveData.totalEnergy,
  );
  await page.evaluate(() => {
    const g = window.gravityShiftGame;
    g.state = "PLAYING";
    g.rivals.active.z = -0.3;
    g.rivals.tick(0);
    g.handleGameOver();
  });
  expect(
    await page.evaluate(() =>
      window.gravityShiftGame.scoreMgr.saveData.unlockedSkins.includes(
        "phantom",
      ),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => window.gravityShiftGame.scoreMgr.saveData.totalEnergy,
    ),
  ).toBe(energy);
  await ready(page);
  expect(
    await page.evaluate(() =>
      window.gravityShiftGame.scoreMgr.saveData.unlockedSkins.includes(
        "phantom",
      ),
    ),
  ).toBe(true);
});
