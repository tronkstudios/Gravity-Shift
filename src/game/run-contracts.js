const CONTRACTS = [
  { metric: "distance", target: 500, label: "RECORRE", unit: "m", reward: 100 },
  {
    metric: "collectedCoins",
    target: 20,
    label: "RECOGE",
    unit: "monedas",
    reward: 75,
  },
  {
    metric: "perfects",
    target: 3,
    label: "ENLAZA",
    unit: "cambios perfectos",
    reward: 125,
  },
];
export function contractFor(index) {
  const base = CONTRACTS[index % CONTRACTS.length],
    round = Math.floor(index / CONTRACTS.length);
  return {
    ...base,
    target:
      base.target +
      round *
        (base.metric === "distance"
          ? 250
          : base.metric === "collectedCoins"
            ? 5
            : 1),
    reward: Math.min(200, base.reward + round * 10),
  };
}
export function contractProgress(score) {
  const c = contractFor(score.contractIndex || 0),
    start = score.contractStart ?? score[c.metric];
  return {
    ...c,
    progress: Math.min(c.target, Math.max(0, score[c.metric] - start)),
  };
}
