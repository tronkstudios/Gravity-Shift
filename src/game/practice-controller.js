export const PRACTICE_STAGES = [
  {
    surface: "FLOOR",
    goal: "coins",
    target: 3,
    label: "1/6 · SUELO",
    hint: "Recoge tres monedas sin cambiar de superficie.",
  },
  {
    surface: "CEILING",
    goal: "coins",
    target: 1,
    label: "2/6 · TECHO",
    hint: "Pulsa W / ↑ o desliza hacia arriba y recoge una moneda.",
  },
  {
    surface: "LEFT",
    goal: "coins",
    target: 1,
    label: "3/6 · PARED IZQUIERDA",
    hint: "Pulsa A / ← o desliza a la izquierda.",
  },
  {
    surface: "RIGHT",
    goal: "coins",
    target: 1,
    label: "4/6 · PARED DERECHA",
    hint: "Pulsa D / → o desliza a la derecha.",
  },
  {
    surface: "RIGHT",
    goal: "lateral",
    label: "5/6 · AJUSTE LATERAL",
    hint: "Usa Q / E o los botones laterales para apartarte del centro.",
  },
  {
    surface: "FLOOR",
    goal: "perfect",
    label: "6/6 · CAMBIO PERFECTO",
    hint: "Espera al aviso AHORA y cambia a una pared antes de la barrera.",
  },
];
/** Guided exercises use the actual movement and collision rules, without rewards or record writes. */
export class PracticeController {
  constructor() {
    this.index = 0;
    this.done = false;
    this.pendingRetry = false;
  }
  get stage() {
    return PRACTICE_STAGES[this.index];
  }
  enter(game) {
    game.world.clearObjects();
    game.world.nextPatternZ = -100000;
    this.coins = game.scoreMgr.collectedCoins;
    this.perfects = game.scoreMgr.perfects;
    this.age = 0;
    this.pendingRetry = false;
    if (this.stage.goal === "perfect") {
      game.gravitySys.setSurfaceImmediate("FLOOR");
      game.player.reset();
      game.cameraCtrl.reset(game.gravitySys);
      game.world.spawnSurfaceObstacle("FLOOR", -38, "BARRIER");
      game.world.obstacles.at(-1).safeSurface = "LEFT";
    } else if (this.stage.goal === "coins")
      game.world.spawnEnergyTrail(this.stage.surface, -18, 5, 5);
  }
  fail(game) {
    this.pendingRetry = true;
    game.player.shieldTimer = 0.5;
  }
  update(dt, game) {
    this.age += dt;
    if (this.pendingRetry) {
      this.enter(game);
      return;
    }
    const stage = this.stage;
    const complete =
      stage.goal === "coins"
        ? game.scoreMgr.collectedCoins - this.coins >= stage.target
        : stage.goal === "lateral"
          ? Math.abs(game.gravitySys.targetLateralOffset) >= 2
          : game.scoreMgr.perfects > this.perfects;
    if (complete) {
      if (this.index === PRACTICE_STAGES.length - 1) {
        this.done = true;
        return;
      }
      this.index++;
      this.enter(game);
    } else if (this.age > 8 && stage.goal !== "lateral") this.enter(game);
  }
}
