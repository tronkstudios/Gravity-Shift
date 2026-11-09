/** One reward per obstacle; only timed departures to an unobstructed surface count. */
export function judgePerfectShift(obstacles, from, to, speed) {
  if (from === to || speed <= 0) return false;
  const threat = obstacles.find(
    (ob) =>
      !ob.perfectCredited &&
      ob.surfaceKey === from &&
      ob.type !== "ROTATING" &&
      Math.abs(ob.localX || 0) < (ob.halfW ?? Infinity) + 0.35 &&
      ob.mesh.position.z <= -speed * 0.12 &&
      ob.mesh.position.z >= -speed * 0.65,
  );
  const unsafe = obstacles.some(
    (ob) => ob.surfaceKey === to && Math.abs(ob.mesh.position.z) < speed * 0.5,
  );
  if (!threat || unsafe) return false;
  threat.perfectCredited = true;
  return true;
}
