import { ITEM_TYPES } from "../data/items.js";
import { SKINS_CATALOG } from "../data/skins.js";
import { ACHIEVEMENTS } from "../data/run-content.js";
import { validChallengeDate } from "../game/daily-challenge.js";
export const MAX_BACKUP_BYTES = 512 * 1024;
const number = (value, fallback = 0) =>
  Number.isFinite(value) && value >= 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))
    : fallback;
/** Whitelist imported fields; reject malformed files before changing current progress. */
export function validateProfile(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile) ||
    !Array.isArray(profile.unlockedSkins) ||
    !Number.isFinite(profile.totalEnergy) ||
    profile.totalEnergy < 0
  )
    throw new Error("El archivo no contiene un progreso válido");
  const unlocked = [
    ...new Set([
      "core",
      ...profile.unlockedSkins.filter((id) =>
        SKINS_CATALOG.some((s) => s.id === id),
      ),
    ]),
  ];
  const source = profile.settings || {},
    dailyRecords = {};
  for (const [date, result] of Object.entries(profile.dailyRecords || {})
    .filter(([date]) => validChallengeDate(date))
    .sort()
    .slice(-32)) {
    if (
      result &&
      Number.isFinite(result.score) &&
      Number.isFinite(result.distance) &&
      result.score >= 0 &&
      result.distance >= 0
    )
      dailyRecords[date] = {
        score: number(result.score),
        distance: number(result.distance),
      };
  }
  return {
    bestScore: number(profile.bestScore),
    bestDistance: number(profile.bestDistance),
    totalEnergy: number(profile.totalEnergy),
    totalRuns: number(profile.totalRuns),
    upgrades: Object.fromEntries(
      ITEM_TYPES.map((type) => [
        type,
        Math.min(3, number(profile.upgrades?.[type])),
      ]),
    ),
    inventory: { boards: Math.min(50, number(profile.inventory?.boards)) },
    unlockedSkins: unlocked,
    equippedSkin: unlocked.includes(profile.equippedSkin)
      ? profile.equippedSkin
      : "core",
    achievements: [
      ...new Set(
        (Array.isArray(profile.achievements)
          ? profile.achievements
          : []
        ).filter((id) => ACHIEVEMENTS.some((a) => a.id === id)),
      ),
    ],
    dailyRecords,
    settings: {
      transitionDuration: Number.isFinite(source.transitionDuration)
        ? Math.max(0.12, Math.min(0.35, source.transitionDuration))
        : 0.2,
      cameraMode: source.cameraMode === "HYBRID" ? "HYBRID" : "FULL",
      graphics: ["AUTO", "HIGH", "PERFORMANCE"].includes(source.graphics)
        ? source.graphics
        : "AUTO",
      music: source.music !== false,
      sfx: source.sfx !== false,
      touchpad: source.touchpad !== false,
      haptics: source.haptics === true,
      localMetrics: source.localMetrics === true,
      customSeed:
        typeof source.customSeed === "string"
          ? source.customSeed.slice(0, 18)
          : "",
    },
  };
}
export function exportBackup(profile) {
  return JSON.stringify(
    {
      game: "gravity-shift",
      version: 2,
      exportedAt: new Date().toISOString(),
      profile: validateProfile(profile),
    },
    null,
    2,
  );
}
export function parseBackup(text) {
  if (typeof text !== "string" || text.length > MAX_BACKUP_BYTES)
    throw new Error("El archivo es demasiado grande");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "No se puede leer la copia. Selecciona un JSON exportado por Gravity Shift.",
    );
  }
  if (data.game !== "gravity-shift" || data.version !== 2)
    throw new Error("Formato de copia no compatible");
  return validateProfile(data.profile);
}
