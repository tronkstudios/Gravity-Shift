import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
export class HapticFeedback {
  constructor({
    vibrate = (pattern) => globalThis.navigator?.vibrate?.(pattern),
    now = () => performance.now(),
  } = {}) {
    this.vibrate = vibrate;
    this.now = now;
    this.enabled = false;
    this.last = -Infinity;
  }
  async play(kind) {
    if (!this.enabled || this.now() - this.last < 100) return false;
    this.last = this.now();
    try {
      if (Capacitor.isNativePlatform()) {
        if (kind === "crash")
          await Haptics.notification({ type: NotificationType.Warning });
        else
          await Haptics.impact({
            style: kind === "perfect" ? ImpactStyle.Medium : ImpactStyle.Light,
          });
      } else
        this.vibrate(
          kind === "perfect" ? [12, 25, 12] : kind === "crash" ? [30] : [8],
        );
      return true;
    } catch {
      return false;
    }
  }
}
