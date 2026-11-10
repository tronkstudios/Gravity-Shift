import { ITEM_TYPES } from "../data/items.js";
import { contractFor } from "../game/run-contracts.js";
import { validChallengeDate } from "../game/daily-challenge.js";
import { ACHIEVEMENTS } from "../data/run-content.js";
import { BrowserSaveStore } from "../persistence/browser-save-store.js";
import { SKINS_CATALOG } from "../data/skins.js";

export class ScoreManager {
  constructor(store = new BrowserSaveStore()) {
    this.store = store;
    this.mode = "normal";
    this.storageKey = "GRAVITY_SHIFT_SAVE_V2";
    this.resetRun();
    this.loadSaveData();
  }

  resetRun() {
    this.elapsed = 0;
    this.perfects = 0;
    this.collectedCoins = 0;
    this.newUnlocks = [];
    this.runFinalized = false;
    this.distance = 0;
    this.score = 0;
    this.scoreBoost = 1;
    this.runEnergy = 0;
    this.multiplier = 1.0;
    this.streakProgress = 0;
    this.reviveUsed = false;
    this.missionCompleted = false;
    this.contractIndex = 0;
    this.contractStart = null;
    this.contractEvents = [];
  }

  loadSaveData() {
    const defaults = {
      dailyRecords: {},
      achievements: [],
      upgrades: { magnet: 0, board: 0, multiplier: 0, boots: 0 },
      inventory: { boards: 0 },
      totalRuns: 0,
      bestScore: 0,
      bestDistance: 0,
      totalEnergy: 350,
      unlockedSkins: ["core"],
      equippedSkin: "core",
      settings: {
        transitionDuration: 0.2,
        cameraMode: "FULL",
        graphics: "AUTO",
        music: true,
        sfx: true,
        touchpad: true,
        haptics: false,
        localMetrics: false,
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
        this.saveData.upgrades = Object.fromEntries(
          ITEM_TYPES.map((type) => [
            type,
            Number.isInteger(parsed.upgrades?.[type])
              ? Math.max(0, Math.min(3, parsed.upgrades[type]))
              : 0,
          ]),
        );
        this.saveData.inventory = {
          boards: Number.isInteger(parsed.inventory?.boards)
            ? Math.max(0, Math.min(50, parsed.inventory.boards))
            : 0,
        };
        this.saveData.dailyRecords = {};
        for (const [date, result] of Object.entries(parsed.dailyRecords || {})
          .filter(([date]) => validChallengeDate(date))
          .sort()
          .slice(-32)) {
          if (
            result &&
            Number.isFinite(result.score) &&
            result.score >= 0 &&
            Number.isFinite(result.distance) &&
            result.distance >= 0
          )
            this.saveData.dailyRecords[date] = {
              score: Math.floor(result.score),
              distance: Math.floor(result.distance),
            };
        }
        this.saveData.achievements = Array.isArray(parsed.achievements)
          ? parsed.achievements.filter((id) =>
              ACHIEVEMENTS.some((a) => a.id === id),
            )
          : [];
        this.saveData.totalRuns = Number.isFinite(parsed.totalRuns)
          ? Math.max(0, Math.floor(parsed.totalRuns))
          : 0;
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
      this.saveStatus = "corrupt";
    }
  }

  persist() {
    try {
      const ok = this.store.write(JSON.stringify(this.saveData)) !== false;
      this.saveStatus = ok ? "saved" : "error";
      return ok;
    } catch {
      this.saveStatus = "error";
      return false;
    }
  }

  updateFrame(dt, speed) {
    this.elapsed += dt;
    this.checkAchievements();
    const dMeters = speed * dt * 0.45;
    this.distance += dMeters;
    if (
      this.mode === "normal" &&
      !this.missionCompleted &&
      this.distance >= 250
    ) {
      this.missionCompleted = true;
      this.runEnergy += 75;
      this.saveData.totalEnergy += 75;
      this.persist();
    }
    this.checkContracts();
    this.score += dMeters * 12 * this.multiplier * this.scoreBoost;

    if (this.streakProgress > 0) {
      this.streakProgress = Math.max(0, this.streakProgress - dt * 0.14);
      if (this.streakProgress === 0 && this.multiplier > 1.0) {
        this.multiplier = Math.max(1.0, +(this.multiplier - 0.5).toFixed(1));
        this.streakProgress = this.multiplier > 1.0 ? 0.5 : 0;
      }
    }
  }

  checkContracts() {
    if (this.mode !== "normal" || !this.missionCompleted) return;
    const contract = contractFor(this.contractIndex);
    if (this.contractStart === null) this.contractStart = this[contract.metric];
    if (this[contract.metric] - this.contractStart < contract.target) return;
    this.runEnergy += contract.reward;
    this.saveData.totalEnergy += contract.reward;
    this.contractEvents.push(
      `OBJETIVO ${this.contractIndex + 2} · +${contract.reward} ENERGÍA`,
    );
    this.contractIndex++;
    this.contractStart = this[contractFor(this.contractIndex).metric];
    this.persist();
  }
  collectOrb(value = 1) {
    this.collectedCoins++;
    this.checkAchievements();
    this.runEnergy += value;
    if (this.mode === "normal") this.saveData.totalEnergy += value;
    this.streakProgress += 0.38;
    if (this.streakProgress >= 1.0) {
      this.streakProgress = 0.25;
      this.multiplier = Math.min(5.0, +(this.multiplier + 0.5).toFixed(1));
    }
    this.score += 75 * this.multiplier * value * this.scoreBoost;
    this.checkContracts();
  }

  checkAchievements() {
    if (this.mode !== "normal") return;
    for (const achievement of ACHIEVEMENTS) {
      if (
        this[achievement.metric] >= achievement.target &&
        !this.saveData.achievements.includes(achievement.id)
      ) {
        this.saveData.achievements.push(achievement.id);
        if (!this.saveData.unlockedSkins.includes(achievement.skin))
          this.saveData.unlockedSkins.push(achievement.skin);
        this.newUnlocks.push(achievement.skin);
        this.persist();
      }
    }
  }
  awardPerfect() {
    this.perfects++;
    this.multiplier = Math.min(5, this.multiplier + 0.5);
    this.streakProgress = 1;
    this.score += 150 * this.multiplier * this.scoreBoost;
    this.checkAchievements();
    this.checkContracts();
  }
  finalizeRun() {
    if (this.mode !== "normal") return false;
    if (!this.runFinalized) {
      this.saveData.totalRuns++;
      this.runFinalized = true;
    }

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
