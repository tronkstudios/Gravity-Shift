export const ZONES = [
  {
    id: "industrial",
    name: "01 · MUELLE INDUSTRIAL",
    at: 0,
    color: 0x60c9df,
    background: 0x10151d,
    notes: [55, 55, 65.41, 55, 73.42, 65.41, 55, 49],
  },
  {
    id: "reactor",
    name: "02 · NÚCLEO DEL REACTOR",
    at: 250,
    color: 0xffac58,
    background: 0x1b1210,
    notes: [65.41, 82.41, 65.41, 98, 73.42, 82.41, 65.41, 55],
  },
  {
    id: "fracture",
    name: "03 · SECTOR FRACTURADO",
    at: 650,
    color: 0xa291fa,
    background: 0x141020,
    notes: [73.42, 87.31, 110, 87.31, 65.41, 98, 73.42, 55],
  },
];
export const zoneForDistance = (distance) =>
  [...ZONES].reverse().find((zone) => distance >= zone.at) || ZONES[0];
export const RUN_PHRASES = [
  {
    id: "climb",
    name: "ASCENSO",
    route: ["FLOOR", "LEFT", "CEILING"],
    hazards: ["BARRIER", "LASER", "BARRIER"],
  },
  {
    id: "switchback",
    name: "CONTRACURVA",
    route: ["RIGHT", "FLOOR", "LEFT"],
    hazards: ["LASER", "BARRIER", "LASER"],
  },
  {
    id: "return",
    name: "REGRESO",
    route: ["CEILING", "RIGHT", "FLOOR"],
    hazards: ["BARRIER", "LASER", "HAZARD_ZONE"],
  },
];
RUN_PHRASES.push(
  {
    id: "zigzag",
    name: "ZIGZAG",
    route: ["LEFT", "RIGHT", "LEFT"],
    hazards: ["BARRIER", "MOVING", "LASER"],
  },
  {
    id: "precision",
    name: "PRECISIÓN",
    route: ["FLOOR", "RIGHT", "CEILING"],
    hazards: ["LASER", "BARRIER", "LASER"],
  },
  {
    id: "inversion",
    name: "INVERSIÓN",
    route: ["CEILING", "FLOOR", "RIGHT"],
    hazards: ["BARRIER", "LASER", "HAZARD_ZONE"],
  },
);
export const ACHIEVEMENTS = [
  {
    id: "survivor",
    skin: "phantom",
    label: "Sobrevive 60 segundos",
    target: 60,
    metric: "elapsed",
  },
  {
    id: "precision",
    skin: "volt",
    label: "Haz 5 cambios perfectos en una partida",
    target: 5,
    metric: "perfects",
  },
  {
    id: "collector",
    skin: "frost",
    label: "Recoge 50 monedas en una partida",
    target: 50,
    metric: "collectedCoins",
  },
];
