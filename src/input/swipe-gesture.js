/** One action per pointer gesture, emitted as soon as the drag crosses the threshold. */
export class SwipeGesture {
  constructor(threshold = 24) {
    this.threshold = threshold;
    this.cancel();
  }
  begin(id, x, y) {
    if (this.id !== null) {
      this.cancel();
      return;
    }
    this.id = id;
    this.x = x;
    this.y = y;
    this.fired = false;
  }
  move(id, x, y) {
    if (this.id !== id || this.fired) return null;
    const dx = x - this.x,
      dy = y - this.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.threshold) return null;
    this.fired = true;
    return Math.abs(dy) > Math.abs(dx)
      ? dy < 0
        ? "CEILING"
        : "FLOOR"
      : dx < 0
        ? "LEFT"
        : "RIGHT";
  }
  cancel() {
    this.id = null;
    this.fired = false;
  }
}
