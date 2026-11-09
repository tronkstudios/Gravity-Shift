/** Uses sustained frame times and hysteresis; never changes game simulation rules. */
export class AdaptiveQuality {
  constructor(renderer, maxDpr = 1, onChange = () => {}) {
    this.renderer = renderer;
    this.maxDpr = Math.min(2, maxDpr);
    this.onChange = onChange;
    this.mode = "AUTO";
    this.ratio = 0;
    this.resetSamples();
  }
  resetSamples() {
    this.seconds = 0;
    this.frames = 0;
    this.slow = 0;
    this.fast = 0;
  }
  setMode(mode) {
    this.mode = ["AUTO", "HIGH", "PERFORMANCE"].includes(mode) ? mode : "AUTO";
    this.resetSamples();
    this.apply(
      this.mode === "HIGH"
        ? this.maxDpr
        : this.mode === "PERFORMANCE"
          ? Math.min(1, this.maxDpr)
          : Math.min(1.5, this.maxDpr),
      true,
    );
  }
  apply(ratio, force = false) {
    ratio = Math.max(0.75, Math.min(this.maxDpr, ratio));
    const changed = Math.abs(ratio - this.ratio) >= 0.01;
    if (!changed && !force) return;
    this.ratio = ratio;
    if (changed) this.renderer.setPixelRatio(ratio);
    this.onChange({
      particles:
        this.mode === "HIGH"
          ? 60
          : this.mode === "PERFORMANCE"
            ? 24
            : ratio < 1.1
              ? 24
              : ratio < 1.5
                ? 40
                : 60,
      label:
        this.mode === "AUTO"
          ? ratio < 1.1
            ? "AUTO · FLUIDEZ"
            : "AUTO · EQUILIBRADA"
          : this.mode === "HIGH"
            ? "CALIDAD ALTA"
            : "RENDIMIENTO",
    });
  }
  update(dt) {
    if (this.mode !== "AUTO" || dt <= 0 || dt > 1) return;
    this.seconds += Math.min(0.25, dt);
    this.frames++;
    if (this.seconds < 1) return;
    const fps = this.frames / this.seconds;
    this.slow = fps < 48 ? this.slow + this.seconds : 0;
    this.fast = fps > 58 ? this.fast + this.seconds : 0;
    this.seconds = 0;
    this.frames = 0;
    if (this.slow >= 2) {
      this.apply(this.ratio - 0.25);
      this.slow = 0;
      this.fast = 0;
    } else if (this.fast >= 8) {
      this.apply(this.ratio + 0.25);
      this.fast = 0;
    }
  }
}
