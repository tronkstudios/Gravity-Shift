const STYLES = {
  technical: {
    family: "technical",
    label: "TÉCNICO · MODULAR",
    bulk: 1,
    limb: 1,
    helmet: 1,
  },
  heavy: {
    family: "heavy",
    label: "PESADO · BLINDAJE",
    bulk: 1.32,
    limb: 1.22,
    helmet: 1.08,
  },
  stealth: {
    family: "stealth",
    label: "SIGILO · CAPUCHA",
    bulk: 0.9,
    limb: 1,
    helmet: 0.96,
  },
  racer: {
    family: "racer",
    label: "CORREDOR · AERODINÁMICO",
    bulk: 0.97,
    limb: 1,
    helmet: 0.98,
  },
  celestial: {
    family: "celestial",
    label: "CELESTIAL · FACETADO",
    bulk: 1.08,
    limb: 1.1,
    helmet: 1.04,
  },
};
export function styleForSkin(id) {
  return STYLES[
    ["titan", "sentinel", "omega"].includes(id)
      ? "heavy"
      : ["phantom", "spectre", "reaper", "void"].includes(id)
        ? "stealth"
        : ["volt", "overdrive", "cyber"].includes(id)
          ? "racer"
          : ["nebula", "frost", "aether_valkyrie"].includes(id)
            ? "celestial"
            : "technical"
  ];
}
