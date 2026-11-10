/** Bounded feedback: important messages can preempt minor ones; duplicates coalesce. */
export class NotificationQueue {
  constructor(
    render,
    {
      schedule = (fn, ms) => globalThis.setTimeout(fn, ms),
      cancel = (id) => globalThis.clearTimeout(id),
    } = {},
  ) {
    this.render = render;
    this.schedule = schedule;
    this.cancel = cancel;
    this.items = [];
    this.active = null;
  }
  push(text, priority = 1) {
    if (
      this.active?.text === text ||
      this.items.some((item) => item.text === text)
    )
      return;
    const item = { text, priority };
    if (this.active && priority > this.active.priority) {
      this.cancel(this.timer);
      this.active = null;
    }
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority);
    this.items = this.items.slice(0, 4);
    this.next();
  }
  next() {
    if (this.active) return;
    this.active = this.items.shift() || null;
    if (!this.active) {
      this.render(null);
      return;
    }
    this.render(this.active.text);
    this.timer = this.schedule(
      () => {
        this.active = null;
        this.next();
      },
      this.active.priority >= 2 ? 1900 : 1100,
    );
    this.timer?.unref?.();
  }
  clear() {
    this.cancel(this.timer);
    this.items = [];
    this.active = null;
    this.render(null);
  }
}
