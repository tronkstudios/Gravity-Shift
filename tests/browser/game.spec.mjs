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
    stage.player.update(0, 22, stage.gravity, true);
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
    game.player.update(0, 30, game.gravitySys, false);
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
  expect(report.measurement.frames).toBeGreaterThan(10);
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
