import { SURFACES } from "../config/surfaces.js";
/** Slab intersection for the centre line of a forgiving 0.18 m body capsule. */
export function segmentBox(a, b, box, radius = 0.18) {
  let enter = 0,
    exit = 1;
  for (const axis of ["x", "y"]) {
    const lo = box[axis][0] - radius,
      hi = box[axis][1] + radius,
      d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-8) {
      if (a[axis] < lo || a[axis] > hi) return null;
      continue;
    }
    const t1 = (lo - a[axis]) / d,
      t2 = (hi - a[axis]) / d;
    enter = Math.max(enter, Math.min(t1, t2));
    exit = Math.min(exit, Math.max(t1, t2));
    if (enter > exit) return null;
  }
  return {
    x: Math.max(box.x[0], Math.min(box.x[1], a.x + (b.x - a.x) * enter)),
    y: Math.max(box.y[0], Math.min(box.y[1], a.y + (b.y - a.y) * enter)),
  };
}
export function obstacleContact(ob, position, normal) {
  if (
    Math.abs(ob.mesh.position.z) >
    (ob.type === "LASER" ? 0.3 : ob.type === "ROTATING" ? 0.625 : ob.halfD) +
      0.18
  )
    return null;
  const angle =
    ob.type === "ROTATING"
      ? ob.mesh.rotation.z
      : SURFACES[ob.surfaceKey]?.rollAngle;
  if (!Number.isFinite(angle)) return null;
  const cos = Math.cos(angle),
    sin = Math.sin(angle),
    origin = ob.mesh.position;
  const local = (height) => {
    const x = position.x + normal.x * height - origin.x,
      y = position.y + normal.y * height - origin.y;
    return { x: cos * x + sin * y, y: -sin * x + cos * y };
  };
  const a = local(0.22),
    b = local(1.32);
  const boxes =
    ob.type === "ROTATING"
      ? [{ x: [-6.6, 6.6], y: [-0.625, 0.625] }]
      : ob.type === "LASER"
        ? [
            { x: [-5.2, 5.2], y: [0.96, 1.24] },
            { x: [-5.2, 5.2], y: [2.06, 2.34] },
            { x: [-5.5, -4.9], y: [0, 3] },
            { x: [4.9, 5.5], y: [0, 3] },
          ]
        : [
            {
              x: [-ob.halfW, ob.halfW],
              y: [0, ob.type === "HAZARD_ZONE" ? 0.35 : ob.height || 2.4],
            },
          ];
  for (const box of boxes) {
    const hit = segmentBox(a, b, box);
    if (hit)
      return {
        x: origin.x + cos * hit.x - sin * hit.y,
        y: origin.y + sin * hit.x + cos * hit.y,
        z: Math.max(origin.z - ob.halfD, Math.min(origin.z + ob.halfD, 0)),
      };
  }
  return null;
}
