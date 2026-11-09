import * as THREE from "three";

/** Distinct silhouettes with real geometry; materials are owned by the character rig. */
export function addArmorDetails(rig, skin) {
  const heavy = ["titan", "sentinel", "omega"].includes(skin.id);
  const stealth = ["phantom", "spectre", "reaper", "void"].includes(skin.id);
  const racer = ["volt", "overdrive", "cyber"].includes(skin.id);
  const celestial = ["nebula", "frost", "aether_valkyrie"].includes(skin.id);
  const family = heavy
    ? "heavy"
    : stealth
      ? "stealth"
      : racer
        ? "racer"
        : celestial
          ? "celestial"
          : "technical";
  rig.designFamily = family;
  const { matPrimary, matSecondary, matGlow } = rig.materials;
  const bevel = (w, h, d, material) =>
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  for (const [arm, sign] of [
    [rig.leftArm, -1],
    [rig.rightArm, 1],
  ]) {
    const shoulder = new THREE.Mesh(
      heavy
        ? new THREE.DodecahedronGeometry(0.24, 0)
        : new THREE.ConeGeometry(stealth ? 0.14 : 0.19, racer ? 0.32 : 0.22, 4),
      matSecondary,
    );
    shoulder.rotation.z = sign * (racer ? 0.75 : 0.3);
    shoulder.position.set(sign * 0.055, 0.015, 0);
    arm.add(shoulder);
    const inlay = bevel(0.045, heavy ? 0.19 : 0.12, 0.025, matGlow);
    inlay.position.set(sign * 0.13, -0.035, -0.1);
    arm.add(inlay);
  }
  for (const [leg, sign] of [
    [rig.leftLeg, -1],
    [rig.rightLeg, 1],
  ]) {
    const knee = leg.userData.joint;
    const guard = bevel(heavy ? 0.26 : 0.2, 0.16, 0.08, matSecondary);
    guard.position.set(0, 0.015, -0.12);
    knee.add(guard);
    const shin = bevel(0.04, 0.2, 0.025, matGlow);
    shin.position.set(0, -0.15, -0.105);
    knee.add(shin);
  }
  for (const sign of [-1, 1]) {
    const chest = bevel(heavy ? 0.23 : 0.17, 0.27, 0.08, matPrimary);
    chest.position.set(sign * 0.13, 0.15, -0.2);
    chest.rotation.z = sign * -0.12;
    rig.torso.add(chest);
    const vent = bevel(0.025, 0.16, 0.025, matGlow);
    vent.position.set(sign * 0.19, 0.15, -0.255);
    rig.torso.add(vent);
    if (stealth) {
      const tail = bevel(0.18, 0.65, 0.045, matSecondary);
      tail.position.set(sign * 0.16, -0.51, 0.19);
      tail.rotation.x = 0.18;
      rig.torso.add(tail);
      rig.animExtras.push({
        update: (t) => {
          tail.rotation.x = 0.18 + Math.sin(t * 6 + sign) * 0.12;
        },
      });
    }
    if (racer) {
      const fin = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.45, 3),
        matPrimary,
      );
      fin.position.set(sign * 0.25, 0.25, 0.3);
      fin.rotation.x = 0.5;
      rig.torso.add(fin);
    }
    if (celestial) {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.1, 0),
        matGlow,
      );
      crystal.position.set(sign * 0.28, 0.48, 0.1);
      rig.torso.add(crystal);
      rig.animExtras.push({
        update: (t) => {
          crystal.position.y = 0.48 + Math.sin(t * 2 + sign) * 0.07;
          crystal.rotation.y = t;
        },
      });
    }
  }
}
