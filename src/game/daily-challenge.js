/** All players use the same calendar day, with rollover at midnight in Madrid. */
export function dailyDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
}
export function validChallengeDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function dailySeed(date) {
  if (!validChallengeDate(date)) throw new Error("Fecha de reto inválida");
  return "DAILY-" + date;
}
export function challengeUrl(origin, date) {
  dailySeed(date);
  const url = new URL(origin);
  url.search = "";
  url.hash = "";
  url.searchParams.set("daily", date);
  return url.href;
}
export function recordDaily(records, date, score, distance) {
  dailySeed(date);
  const previous = records[date]?.score || 0;
  if (score > previous)
    records[date] = {
      score: Math.floor(score),
      distance: Math.floor(distance),
    };
  for (const key of Object.keys(records).sort().slice(0, -32))
    delete records[key];
  return score > previous;
}
