import * as THREE from "three";

/** Secondary joint animation: counter-swing, foot recovery and landing compression. */
export class RigAnimator {
  constructor() {
    this.wasAirborne = false;
    this.landing = 0;
  }
  update(rig, dt, phase, airborne, progress = 0) {
    const smooth = 1 - Math.exp(-dt * 18);
    if (this.wasAirborne && !airborne) this.landing = 1;
    this.wasAirborne = airborne;
    this.landing = Math.max(0, this.landing - dt * 5);
    for (const [side, offset] of [
      ["left", 0],
      ["right", Math.PI],
    ]) {
      const limbPhase = phase + offset;
      const recovery = Math.max(0, Math.sin(limbPhase));
      const knee = airborne
        ? 0.65 + Math.sin(progress * Math.PI) * 0.8
        : 0.12 + recovery * 1.2 + this.landing * 0.55;
      const elbow = airborne ? 1.05 : 0.65 + Math.sin(limbPhase) * 0.22;
      const ankle = airborne
        ? -0.2
        : -Math.sin(limbPhase) * 0.25 - this.landing * 0.15;
      for (const [name, target] of [
        [`${side}Knee`, knee],
        [`${side}Elbow`, -elbow],
        [`${side}Ankle`, ankle],
      ]) {
        const joint = rig.joints?.[name];
        if (joint)
          joint.rotation.x = THREE.MathUtils.lerp(
            joint.rotation.x,
            target,
            smooth,
          );
      }
    }
    rig.torso.position.y -= this.landing * 0.09;
  }
}
