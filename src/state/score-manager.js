import { BrowserSaveStore } from "../persistence/browser-save-store.js";
import { SKINS_CATALOG } from "../data/skins.js";

export class ScoreManager {
  constructor(store = new BrowserSaveStore()) {
    this.store = store;
    this.storageKey = "GRAVITY_SHIFT_SAVE_V2";
    this.resetRun();
    this.loadSaveData();
  }

  resetRun() {
    this.distance = 0;
    this.score = 0;
    this.runEnergy = 0;
    this.multiplier = 1.0;
    this.streakProgress = 0;
    this.reviveUsed = false;
    this.missionCompleted = false;
  }

  loadSaveData() {
    const defaults = {
      bestScore: 0,
      bestDistance: 0,
      totalEnergy: 350,
      unlockedSkins: ["core"],
      equippedSkin: "core",
      settings: {
        transitionDuration: 0.2,
        cameraMode: "FULL",
        graphics: "HIGH",
        music: true,
        sfx: true,
        touchpad: true,
        customSeed: "",
      },
    };

    try {
      const raw = this.store.read();
      if (raw) {
        const parsed = JSON.parse(raw);
        this.saveData = {
          ...defaults,
          ...parsed,
          settings: { ...defaults.settings, ...(parsed.settings || {}) },
        };
        for (const key of ["bestScore", "bestDistance", "totalEnergy"]) {
          const value = Number(this.saveData[key]);
          this.saveData[key] = Number.isFinite(value)
            ? Math.max(0, Math.floor(value))
            : defaults[key];
        }
        this.saveData.unlockedSkins = Array.isArray(parsed.unlockedSkins)
          ? [
              ...new Set(
                parsed.unlockedSkins.filter((id) =>
                  SKINS_CATALOG.some((s) => s.id === id),
                ),
              ),
            ]
          : ["core"];
        if (!this.saveData.unlockedSkins.includes(this.saveData.equippedSkin))
          this.saveData.equippedSkin = "core";
        if (!SKINS_CATALOG.some((s) => s.id === this.saveData.equippedSkin)) {
          this.saveData.equippedSkin = "core";
        }
        if (!this.saveData.unlockedSkins.includes("core")) {
          this.saveData.unlockedSkins.push("core");
        }
      } else {
        this.saveData = defaults;
      }
    } catch (e) {
      this.saveData = defaults;
    }
  }

  persist() {
    try {
      this.store.write(JSON.stringify(this.saveData));
    } catch (e) {
      // Ignore storage quota errors in restricted frames
    }
  }

  updateFrame(dt, speed) {
    const dMeters = speed * dt * 0.45;
    this.distance += dMeters;
    if (!this.missionCompleted && this.distance >= 250) {
      this.missionCompleted = true;
      this.runEnergy += 75;
      this.saveData.totalEnergy += 75;
      this.persist();
    }
    this.score += dMeters * 12 * this.multiplier;

    if (this.streakProgress > 0) {
      this.streakProgress = Math.max(0, this.streakProgress - dt * 0.14);
      if (this.streakProgress === 0 && this.multiplier > 1.0) {
        this.multiplier = Math.max(1.0, +(this.multiplier - 0.5).toFixed(1));
        this.streakProgress = this.multiplier > 1.0 ? 0.5 : 0;
      }
    }
  }

  collectOrb() {
    this.runEnergy += 1;
    this.saveData.totalEnergy += 1;
    this.streakProgress += 0.38;
    if (this.streakProgress >= 1.0) {
      this.streakProgress = 0.25;
      this.multiplier = Math.min(5.0, +(this.multiplier + 0.5).toFixed(1));
    }
    this.score += 75 * this.multiplier;
  }

  finalizeRun() {
    const finalScore = Math.floor(this.score);
    const finalDist = Math.floor(this.distance);
    let isNewRecord = false;

    if (finalScore > this.saveData.bestScore) {
      this.saveData.bestScore = finalScore;
      isNewRecord = true;
    }
    if (finalDist > this.saveData.bestDistance) {
      this.saveData.bestDistance = finalDist;
    }
    this.persist();
    return isNewRecord;
  }
}
