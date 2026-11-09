/** Local diagnostics only. No HTTP calls, player identifiers or automatic upload. */
export class PlaytestMetrics {
  constructor(storage = () => globalThis.localStorage) {
    this.storage = storage;
    this.enabled = false;
    this.runs = [];
    this.reset();
  }
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (this.enabled) {
      try {
        const data = JSON.parse(
          this.storage().getItem("GRAVITY_SHIFT_PLAYTEST_V1") || "[]",
        );
        if (Array.isArray(data)) this.runs = data.slice(-50);
      } catch {}
    } else {
      try {
        this.storage().removeItem("GRAVITY_SHIFT_PLAYTEST_V1");
      } catch {}
    }
  }
  reset() {
    this.frames = [];
    this.inputSamples = [];
    this.pendingInput = null;
    this.rendererInfo = {};
  }
  input(time = performance.now()) {
    this.pendingInput = time;
  }
  frame(seconds, renderer, now = performance.now()) {
    if (seconds <= 0 || seconds > 1) return;
    this.frames.push(seconds * 1000);
    if (this.frames.length > 3600) this.frames.shift();
    if (this.pendingInput !== null) {
      this.inputSamples.push(Math.max(0, now - this.pendingInput));
      this.pendingInput = null;
      if (this.inputSamples.length > 200) this.inputSamples.shift();
    }
    this.rendererInfo = {
      calls: renderer?.info?.render?.calls || 0,
      triangles: renderer?.info?.render?.triangles || 0,
      geometries: renderer?.info?.memory?.geometries || 0,
      textures: renderer?.info?.memory?.textures || 0,
    };
  }
  snapshot() {
    const sorted = [...this.frames].sort((a, b) => a - b),
      sum = this.frames.reduce((a, b) => a + b, 0);
    return {
      frames: this.frames.length,
      meanFps: sum ? Math.round((this.frames.length * 100000) / sum) / 100 : 0,
      p95FrameMs:
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ||
        0,
      meanInputSubmissionMs: this.inputSamples.length
        ? this.inputSamples.reduce((a, b) => a + b, 0) /
          this.inputSamples.length
        : 0,
      ...this.rendererInfo,
    };
  }
  finish(game) {
    const record = {
      mode: game.runMode,
      zone: game.zoneController?.zone.id,
      seconds: Math.round(game.scoreMgr.elapsed),
      distance: Math.floor(game.scoreMgr.distance),
      coins: game.scoreMgr.collectedCoins,
      perfects: game.scoreMgr.perfects,
      cause: game.lastDeath?.type || null,
      surface: game.lastDeath?.surfaceKey || null,
      performance: this.snapshot(),
    };
    this.runs.push(record);
    this.runs = this.runs.slice(-50);
    if (this.enabled) {
      try {
        this.storage().setItem(
          "GRAVITY_SHIFT_PLAYTEST_V1",
          JSON.stringify(this.runs),
        );
      } catch {}
    }
    return record;
  }
  export() {
    return JSON.stringify(
      {
        format: "gravity-shift-playtest",
        version: 1,
        scope:
          "Local measurements; input time ends at renderer submission, not display presentation.",
        current: this.snapshot(),
        runs: this.runs,
      },
      null,
      2,
    );
  }
}
