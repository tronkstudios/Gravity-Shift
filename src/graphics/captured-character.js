import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils.js";
import { addArmorDetails } from "./armor-details.js";
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
export function buildCapturedCharacter(skin) {
  if (!template) return null;
  const root = new THREE.Group(),
    model = SkeletonUtils.clone(template.scene);
  root.add(model);
  model.rotation.y = Math.PI;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model),
    scale = 1.85 / (bounds.max.y - bounds.min.y);
  model.scale.multiplyScalar(scale);
  model.position.y -= bounds.min.y * scale;
  const primary = new THREE.MeshStandardMaterial({
    color: skin.primaryColor,
    metalness: Math.min(0.55, skin.metalness),
    roughness: Math.max(0.42, skin.roughness),
  });
  const secondary = new THREE.MeshStandardMaterial({
    color: skin.secondaryColor,
    metalness: 0.3,
    roughness: 0.65,
  });
  const glow = new THREE.MeshBasicMaterial({ color: skin.glowColor });
  // The original branded texture is deliberately replaced with our suit material.
  model.traverse((node) => {
    if (node.isMesh) {
      node.geometry = node.geometry.clone();
      node.material = primary;
      node.frustumCulled = false;
    }
  });
  root.updateMatrixWorld(true);
  const rig = {
    root,
    model,
    captured: true,
    clips: template.animations,
    animExtras: [],
    joints: {},
    materials: { matPrimary: primary, matSecondary: secondary, matGlow: glow },
    sockets: [],
  };
  const inverseRoot = new THREE.Quaternion(),
    position = new THREE.Vector3(),
    orientation = new THREE.Quaternion();
  for (const [key, boneName] of Object.entries(names)) {
    const bone = model.getObjectByName(boneName);
    if (!bone) throw new Error("Articulación ausente: " + boneName);
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
  rig.leftLeg.userData.joint = rig.joints.leftKnee;
  rig.rightLeg.userData.joint = rig.joints.rightKnee;
  rig.leftArm.userData.joint = rig.joints.leftElbow;
  rig.rightArm.userData.joint = rig.joints.rightElbow;
  rig.leftLeg.userData.endJoint = rig.joints.leftAnkle;
  rig.rightLeg.userData.endJoint = rig.joints.rightAnkle;
  addArmorDetails(rig, skin);
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 16, 12),
    secondary,
  );
  helmet.scale.set(1, 1.1, 1);
  helmet.position.y = 0.06;
  rig.head.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.065, 0.025), glow);
  visor.position.set(0, 0.07, -0.16);
  rig.head.add(visor);
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
  };
  rig.updateSockets();
  return rig;
}

/** Uses the licensed skeletal run clip rather than rotating rigid limbs by hand. */
export class CapturedMotionController {
  bind(rig) {
    this.dispose();
    this.rig = rig;
    this.mixer = new THREE.AnimationMixer(rig.model);
    this.run = this.mixer.clipAction(rig.clips[0]).play();
    this.airWeight = 0;
    this.wasAirborne = false;
    this.phase = 0;
  }
  reset() {
    if (this.run) {
      this.run.reset().play();
      this.phase = 0;
    }
    this.airWeight = 0;
  }
  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.rig.model);
      this.mixer = null;
    }
  }
  update(rig, dt, phase, airborne, progress) {
    if (!this.mixer) this.bind(rig);
    this.airWeight = THREE.MathUtils.lerp(
      this.airWeight,
      airborne ? 1 : 0,
      1 - Math.exp(-dt * 18),
    );
    this.run.setEffectiveTimeScale(airborne ? 0.22 : 1.1);
    this.mixer.update(dt);
    rig.updateSockets();
    this.phase = this.run.time / this.run.getClip().duration;
  }
}
