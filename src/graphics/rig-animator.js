import * as THREE from "three";
const clamp = THREE.MathUtils.clamp;
const smooth = (t) => t * t * (3 - 2 * t);

/** Two-bone IK in the sagittal plane. The runner faces -Z: knees bend toward +Z. */
export function solveLeg(z, down, upper = 0.36, lower = 0.36) {
  const distance = clamp(Math.hypot(z, down), 0.08, upper + lower - 0.001);
  const knee = -Math.acos(
    clamp(
      (distance * distance - upper * upper - lower * lower) /
        (2 * upper * lower),
      -1,
      1,
    ),
  );
  const hip =
    Math.atan2(-z, down) -
    Math.atan2(lower * Math.sin(knee), upper + lower * Math.cos(knee));
  return { hip, knee, ankle: -hip - knee };
}
export function sampleFoot(cycle) {
  const t = ((cycle % 1) + 1) % 1;
  if (t < 0.58) return { z: -0.23 + (0.46 * t) / 0.58, lift: 0, contact: true };
  const u = (t - 0.58) / 0.42;
  return {
    z: 0.23 - 0.46 * smooth(u),
    lift: Math.sin(Math.PI * u) * 0.2,
    contact: false,
  };
}

/** Contact-driven gait, anatomical joint directions and restrained airborne poses. */
export class RigAnimator {
  constructor() {
    this.wasAirborne = false;
    this.landing = 0;
  }
  update(rig, dt, phase, airborne, progress = 0) {
    if (this.wasAirborne && !airborne) this.landing = 1;
    this.wasAirborne = airborne;
    this.landing = Math.max(0, this.landing - dt * 4.5);
    const follow = 1 - Math.exp(-dt * 28);
    const set = (node, axis, value) => {
      if (node)
        node.rotation[axis] = THREE.MathUtils.lerp(
          node.rotation[axis],
          value,
          follow,
        );
    };
    const cycle = phase / (Math.PI * 2);
    const bounce = airborne ? 0 : Math.cos(phase * 2) * 0.012;
    rig.torso.position.y = 1.13 + bounce - this.landing * 0.045;
    set(rig.torso, "x", airborne ? -0.08 : -0.1);
    set(rig.torso, "y", airborne ? 0 : Math.sin(phase) * 0.035);
    set(rig.torso, "z", airborne ? 0 : Math.sin(phase) * 0.018);
    set(rig.head, "x", 0.08);
    set(rig.head, "y", -Math.sin(phase) * 0.02);
    for (const [side, offset] of [
      ["left", 0],
      ["right", 0.5],
    ]) {
      const foot = sampleFoot(cycle + offset);
      const pose = solveLeg(
        foot.z,
        0.66 + bounce - foot.lift - this.landing * 0.035,
      );
      const tuck = Math.sin(clamp(progress, 0, 1) * Math.PI);
      const hip = airborne
        ? 0.12 + tuck * (side === "left" ? 0.32 : 0.16)
        : pose.hip;
      const knee = airborne ? -0.3 - tuck * 0.45 : pose.knee;
      const ankle = airborne ? -0.05 : pose.ankle;
      const arm = side === "left" ? rig.leftArm : rig.rightArm;
      const leg = side === "left" ? rig.leftLeg : rig.rightLeg;
      set(leg, "x", hip);
      set(leg, "z", side === "left" ? -0.015 : 0.015);
      // Contralateral arm swing; elbows flex forward instead of bending backward.
      set(arm, "x", airborne ? -0.15 : -pose.hip * 0.5 - 0.12);
      set(arm, "z", side === "left" ? 0.05 : -0.05);
      set(rig.joints?.[`${side}Knee`], "x", knee);
      set(
        rig.joints?.[`${side}Elbow`],
        "x",
        airborne ? 0.85 : 0.95 + Math.sin(phase + offset * Math.PI * 2) * 0.12,
      );
      set(rig.joints?.[`${side}Ankle`], "x", ankle);
    }
  }
}
