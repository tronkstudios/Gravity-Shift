import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils.js";
import { applySkeletalGait } from "./skeletal-gait.js";
import { addRunnerSuit } from "./runner-suit.js";
let template = null;
export async function loadCapturedCharacter() {
  const loader = new GLTFLoader();
  template = await loader.loadAsync("./assets/characters/runner.glb");
  if (!template.animations.length)
    throw new Error("El modelo no incluye animación");
  return true;
}
export function hasCapturedCharacter() {
  return !!template;
}
const names = {
  torso: "Skeleton_torso_joint_2",
  head: "Skeleton_neck_joint_2",
  leftArm: "Skeleton_arm_joint_L__4_",
  rightArm: "Skeleton_arm_joint_R",
  leftLeg: "leg_joint_L_1",
  rightLeg: "leg_joint_R_1",
  leftElbow: "Skeleton_arm_joint_L__3_",
  rightElbow: "Skeleton_arm_joint_R__2_",
  leftKnee: "leg_joint_L_2",
  rightKnee: "leg_joint_R_2",
  leftAnkle: "leg_joint_L_3",
  rightAnkle: "leg_joint_R_3",
};
export function buildCapturedCharacter(skin, source = template) {
  if (!source) return null;
  const root = new THREE.Group(),
    model = SkeletonUtils.clone(source.scene);
  root.add(model);
  model.rotation.y = Math.PI;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model),
    scale = 1.85 / (bounds.max.y - bounds.min.y);
  model.scale.multiplyScalar(scale);
  model.position.y -= bounds.min.y * scale;
  const primary = new THREE.MeshStandardMaterial({
    color: skin.primaryColor,
    metalness: Math.min(0.25, skin.metalness),
    roughness: Math.max(0.65, skin.roughness),
  });
  // r128 caches shader variants per material: rigid armor must never share the skinned material.
  const bodyMaterial = primary.clone();
  bodyMaterial.color
    .set(skin.secondaryColor)
    .lerp(new THREE.Color(0x17212b), 0.65);
  bodyMaterial.roughness = 0.92;
  bodyMaterial.metalness = 0.03;
  bodyMaterial.skinning = true;
  bodyMaterial.name = "deforming-runner-body";
  const secondary = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    metalness: 0.12,
    roughness: 0.8,
  });
  const glow = new THREE.MeshBasicMaterial({ color: skin.glowColor });
  // The original branded texture is deliberately replaced with our suit material.
  model.traverse((node) => {
    if (node.isMesh) {
      node.geometry = node.geometry.clone();
      node.material = node.isSkinnedMesh ? bodyMaterial : primary;
      node.frustumCulled = false;
    }
  });
  root.updateMatrixWorld(true);
  const rig = {
    root,
    model,
    captured: true,
    clips: source.animations,
    animExtras: [],
    joints: {},
    materials: { matPrimary: primary, matSecondary: secondary, matGlow: glow },
    sockets: [],
    bones: {},
    baseModelY: model.position.y,
  };
  const inverseRoot = new THREE.Quaternion(),
    position = new THREE.Vector3(),
    orientation = new THREE.Quaternion();
  for (const [key, boneName] of Object.entries(names)) {
    const bone = model.getObjectByName(boneName);
    if (!bone) throw new Error("Articulación ausente: " + boneName);
    rig.bones[key] = bone;
    const socket = new THREE.Group();
    root.add(socket);
    bone.getWorldQuaternion(orientation);
    const correction = orientation.clone().invert();
    // Socket axes match the upright game coordinate system in the bind pose.
    rig.sockets.push({ bone, socket, correction });
    if (
      ["torso", "head", "leftArm", "rightArm", "leftLeg", "rightLeg"].includes(
        key,
      )
    )
      rig[key] = socket;
    else rig.joints[key] = socket;
  }
  for (const [key, name] of Object.entries({
    chest: "torso_joint_3",
    neck: "Skeleton_neck_joint_1",
    leftHand: "Skeleton_arm_joint_L__2_",
    rightHand: "Skeleton_arm_joint_R__3_",
    leftToe: "leg_joint_L_5",
    rightToe: "leg_joint_R_5",
  }))
    rig.bones[key] = model.getObjectByName(name);
  rig.leftLeg.userData.joint = rig.joints.leftKnee;
  rig.rightLeg.userData.joint = rig.joints.rightKnee;
  rig.leftArm.userData.joint = rig.joints.leftElbow;
  rig.rightArm.userData.joint = rig.joints.rightElbow;
  rig.leftLeg.userData.endJoint = rig.joints.leftAnkle;
  rig.rightLeg.userData.endJoint = rig.joints.rightAnkle;
  rig.updateSockets = () => {
    root.updateMatrixWorld(true);
    root.getWorldQuaternion(inverseRoot).invert();
    for (const { bone, socket, correction } of rig.sockets) {
      bone.getWorldPosition(position);
      root.worldToLocal(position);
      socket.position.copy(position);
      bone.getWorldQuaternion(orientation);
      socket.quaternion
        .copy(inverseRoot)
        .multiply(orientation)
        .multiply(correction);
    }
    rig.updateSuit?.();
  };
  rig.updateSockets();
  addRunnerSuit(rig, skin);
  return rig;
}

/** Uses the licensed skeletal run clip rather than rotating rigid limbs by hand. */
export class CapturedMotionController {
  bind(rig) {
    this.dispose();
    this.rig = rig;
    this.mixer = new THREE.AnimationMixer(rig.model);
    this.run = this.mixer.clipAction(rig.clips[0]).play();
    this.reset();
  }
  reset() {
    this.airWeight = 0;
    this.wasAirborne = false;
    this.landing = 0;
    this.phase = 0;
    if (this.run) {
      this.run.reset().play();
      this.update(this.rig, 0, 0, false, 0);
    }
  }
  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.rig.model);
      this.mixer = null;
    }
  }
  update(rig, dt, phase, airborne, progress, idle = false) {
    if (!this.mixer) this.bind(rig);
    if (this.wasAirborne && !airborne) this.landing = 1;
    this.wasAirborne = airborne;
    this.landing *= Math.exp(-dt * 12);
    this.airWeight = THREE.MathUtils.lerp(
      this.airWeight,
      airborne ? 1 : 0,
      1 - Math.exp(-dt * 22),
    );
    // Match the same gait clock as the player, including speed and paused transfers.
    this.mixer.setTime(
      idle ? 0.25 : (phase / (Math.PI * 2)) * this.run.getClip().duration,
    );
    applySkeletalGait(rig, phase, this.airWeight, progress, this.landing, idle);
    this.phase = (((phase / (Math.PI * 2)) % 1) + 1) % 1;
  }
}
