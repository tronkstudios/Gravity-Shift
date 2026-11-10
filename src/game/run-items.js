import { ITEM_META } from "../data/items.js";
export class RunItems {
  constructor(game) {
    this.game = game;
    this.reset();
  }
  reset() {
    this.active = { magnet: 0, board: 0, multiplier: 0, boots: 0 };
    this.jumpTime = 0;
    this.jumpHeight = 0;
  }
  duration(type) {
    const level =
      this.game.runMode === "normal"
        ? this.game.scoreMgr.saveData.upgrades?.[type] || 0
        : 0;
    return ITEM_META[type].base + level * 2;
  }
  collect(type) {
    if (!ITEM_META[type]) return;
    this.active[type] = this.duration(type);
    this.game.ui.showToast(
      ITEM_META[type].name + " · " + ITEM_META[type].description,
      2,
    );
    this.game.audio.playTone(580, "sine", 0.18, 0.06, 950);
    this.game.player.emitBurst(18, ITEM_META[type].color);
  }
  useBoard() {
    const g = this.game;
    if (
      g.state !== "PLAYING" ||
      g.runMode !== "normal" ||
      this.active.board > 0 ||
      !(g.scoreMgr.saveData.inventory?.boards > 0)
    )
      return false;
    g.scoreMgr.saveData.inventory.boards--;
    g.scoreMgr.persist();
    this.collect("board");
    return true;
  }
  jump() {
    const g = this.game;
    if (
      g.state !== "PLAYING" ||
      this.jumpTime > 0 ||
      g.gravitySys.isTransitioning
    )
      return false;
    this.jumpTime = 0.001;
    this.jumpHeight = this.active.boots > 0 ? 3.5 : 1.65;
    g.audio.playTone(230, "sine", 0.1, 0.04, 420);
    return true;
  }
  cancelJump() {
    this.jumpTime = 0;
    this.game.player.jumpOffset = 0;
    this.game.player.jumpActive = false;
  }
  tick(dt) {
    const g = this.game;
    for (const key of Object.keys(this.active))
      this.active[key] = Math.max(0, this.active[key] - dt);
    if (this.jumpTime > 0) {
      this.jumpTime += dt;
      if (this.jumpTime >= 0.8) {
        this.jumpTime = 0;
        g.audio.playLanding();
      }
    }
    const progress = this.jumpTime / 0.8;
    g.player.jumpActive = this.jumpTime > 0;
    g.player.jumpProgress = progress;
    g.player.jumpOffset = this.jumpTime
      ? Math.sin(progress * Math.PI) * this.jumpHeight
      : 0;
    g.player.setBoardActive(this.active.board > 0);
    g.player.setBootsActive(this.active.boots > 0);
    g.scoreMgr.scoreBoost = this.active.multiplier > 0 ? 2 : 1;
    const normal = g.player.upDirection
      .clone()
      .set(0, 1, 0)
      .applyQuaternion(g.gravitySys.currentQuat);
    g.world.magnetTarget =
      this.active.magnet > 0
        ? g.player.root.position.clone().addScaledVector(normal, 0.8)
        : null;
    g.world.magnetRadius =
      8 +
      (g.runMode === "normal"
        ? (g.scoreMgr.saveData.upgrades?.magnet || 0) * 0.6
        : 0);
  }
  absorb(obstacle) {
    const g = this.game;
    if (this.active.board <= 0) return false;
    this.active.board = 0;
    g.player.setBoardActive(false);
    g.player.shieldTimer = 0.8;
    obstacle.mesh.position.z = 30;
    g.player.emitBurst(30, 0x5cf1ff);
    g.audio.playTone(110, "triangle", 0.2, 0.08, 55);
    g.ui.showToast("TABLA ROTA · TE HA SALVADO", 3);
    return true;
  }
}
