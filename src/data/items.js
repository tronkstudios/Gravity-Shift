export const ITEM_TYPES = ["magnet", "board", "multiplier", "boots"];
export const ITEM_META = {
  magnet: {
    name: "IMÁN",
    base: 8,
    color: 0xff72bb,
    description: "Atrae monedas cercanas.",
  },
  board: {
    name: "TABLA",
    base: 12,
    color: 0x5cf1ff,
    description: "Absorbe una colisión y se rompe.",
  },
  multiplier: {
    name: "PUNTOS ×2",
    base: 12,
    color: 0xffcc55,
    description: "Duplica los puntos, sin alterar la energía.",
  },
  boots: {
    name: "SUPERBOTAS",
    base: 10,
    color: 0x9cf06a,
    description: "Saltos más altos para superar barreras.",
  },
};
export const UPGRADE_COSTS = [120, 280, 600];
export function upgradeCost(profile, type) {
  return UPGRADE_COSTS[profile.upgrades?.[type] || 0] ?? null;
}
export function buyUpgrade(profile, type) {
  if (!ITEM_TYPES.includes(type)) return false;
  const cost = upgradeCost(profile, type);
  if (cost === null || profile.totalEnergy < cost) return false;
  profile.totalEnergy -= cost;
  profile.upgrades ??= {};
  profile.upgrades[type] = (profile.upgrades[type] || 0) + 1;
  return true;
}
export function buyBoard(profile) {
  if (profile.totalEnergy < 60 || (profile.inventory?.boards || 0) >= 50)
    return false;
  profile.totalEnergy -= 60;
  profile.inventory ??= { boards: 0 };
  profile.inventory.boards++;
  return true;
}
