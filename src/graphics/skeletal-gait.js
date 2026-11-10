import * as THREE from "three";
import { sampleFoot, solveLeg } from "./rig-animator.js";

const UP = new THREE.Vector3(0, 1, 0);
/** Aim an imported bone in runner-local coordinates, preserving its existing twist. */
function aim(root, bone, child, direction) {
  root.updateMatrixWorld(true);
  const origin = bone.getWorldPosition(new THREE.Vector3());
  const current = child
    .getWorldPosition(new THREE.Vector3())
    .sub(origin)
    .normalize();
  const desired = direction
    .clone()
    .normalize()
    .applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  const parent = bone.parent
    .getWorldQuaternion(new THREE.Quaternion())
    .invert();
  bone.quaternion.copy(
    parent
      .multiply(new THREE.Quaternion().setFromUnitVectors(current, desired))
      .multiply(world),
  );
  bone.updateMatrixWorld(true);
}
const down = (angle) =>
  new THREE.Vector3(0, -Math.cos(angle), -Math.sin(angle));
const localPosition = (root, bone) =>
  root.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));

/** Anatomical run targets on the actual deforming skeleton, not accessory groups. */
export function applySkeletalGait(
  rig,
  phase,
  airWeight,
  progress,
  landing,
  idle = false,
) {
  const bones = rig.bones,
    root = rig.root;
  // Keep a stance foot reachable: lower the pelvis instead of stretching a knee or floating.
  rig.model.position.y = rig.baseModelY;
  root.updateMatrixWorld(true);
  let drop = 0;
  for (const [side, offset] of [
    ["left", 0],
    ["right", 0.5],
  ]) {
    const foot = idle
      ? { z: 0, contact: true }
      : sampleFoot(phase / (Math.PI * 2) + offset);
    if (!foot.contact) continue;
    const h = localPosition(root, bones[`${side}Leg`]),
      k = localPosition(root, bones[`${side}Knee`]),
      a = localPosition(root, bones[`${side}Ankle`]);
    const reach = (h.distanceTo(k) + k.distanceTo(a)) * 0.97;
    const maxHeight =
      Math.sqrt(Math.max(0.01, reach * reach - (foot.z * 1.45) ** 2)) + 0.045;
    drop = Math.max(drop, h.y - maxHeight);
  }
  rig.model.position.y -= drop * (1 - airWeight) + landing * 0.045;
  root.updateMatrixWorld(true);
  aim(
    root,
    bones.torso,
    bones.chest,
    new THREE.Vector3(Math.sin(phase) * (idle ? 0 : 0.025), 1, idle ? 0 : -0.1),
  );
  aim(root, bones.neck, bones.head, UP);
  const tuck = Math.sin(THREE.MathUtils.clamp(progress, 0, 1) * Math.PI);
  for (const [side, offset, sign] of [
    ["left", 0, -1],
    ["right", 0.5, 1],
  ]) {
    const upper = bones[`${side}Arm`],
      elbow = bones[`${side}Elbow`],
      hand = bones[`${side}Hand`];
    const wave = Math.sin(phase + offset * Math.PI * 2);
    const swing = idle ? 0.04 : wave * 0.55;
    const armAngle = THREE.MathUtils.lerp(swing, -0.12, airWeight);
    const elbowAngle = idle
      ? 0.2
      : THREE.MathUtils.lerp(1.35 + wave * 0.15, 1.05, airWeight);
    const armDirection = down(armAngle);
    armDirection.x = sign * THREE.MathUtils.lerp(0.09, 0.28, airWeight);
    aim(root, upper, elbow, armDirection);
    const forearm = down(armAngle + elbowAngle);
    forearm.x = sign * 0.04;
    aim(root, elbow, hand, forearm);

    const hip = bones[`${side}Leg`],
      knee = bones[`${side}Knee`],
      ankle = bones[`${side}Ankle`],
      toe = bones[`${side}Toe`];
    const h = localPosition(root, hip),
      k = localPosition(root, knee),
      a = localPosition(root, ankle);
    const upperLength = h.distanceTo(k),
      lowerLength = k.distanceTo(a);
    const foot = idle
      ? { z: 0, lift: 0 }
      : sampleFoot(phase / (Math.PI * 2) + offset);
    const pose = solveLeg(
      foot.z * 1.45,
      Math.max(0.1, h.y - 0.045 - foot.lift * 1.2),
      upperLength,
      lowerLength,
    );
    const hipAngle = THREE.MathUtils.lerp(
      pose.hip,
      0.25 + tuck * (side === "left" ? 0.4 : 0.2),
      airWeight,
    );
    const kneeAngle = THREE.MathUtils.lerp(
      pose.knee,
      -0.65 - tuck * 0.55,
      airWeight,
    );
    aim(root, hip, knee, down(hipAngle));
    aim(root, knee, ankle, down(hipAngle + kneeAngle));
    aim(root, ankle, toe, new THREE.Vector3(0, -0.08, -1));
  }
  rig.updateSockets();
}
