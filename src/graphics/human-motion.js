import * as THREE from "three";
import { RigAnimator } from "./rig-animator.js";

const BONES = ["torso", "head", "leftArm", "rightArm", "leftLeg", "rightLeg"];
const JOINTS = [
  "leftElbow",
  "rightElbow",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
];
/** Bake the contact-driven human gait into reusable, smoothly blended animation clips. */
export function createHumanClips() {
  const sample = { joints: {} };
  for (const bone of BONES) sample[bone] = new THREE.Group();
  for (const joint of JOINTS) sample.joints[joint] = new THREE.Group();
  const bake = (name, airborne) => {
    const tracks = [],
      time = Array.from({ length: 61 }, (_, i) => i / 60),
      poses = [];
    const animator = new RigAnimator();
    for (const t of time) {
      animator.update(sample, 1, t * Math.PI * 2, airborne, t);
      poses.push(
        Object.fromEntries(
          [
            ...BONES.map((key) => [key, sample[key]]),
            ...JOINTS.map((key) => [key, sample.joints[key]]),
          ].map(([key, node]) => [
            key,
            {
              x: node.rotation.x,
              y: node.rotation.y,
              z: node.rotation.z,
              height: node.position.y,
            },
          ]),
        ),
      );
    }
    for (const bone of [...BONES, ...JOINTS])
      for (const axis of ["x", "y", "z"])
        tracks.push(
          new THREE.NumberKeyframeTrack(
            `motion_${bone}.rotation[${axis}]`,
            time,
            poses.map((p) => p[bone][axis]),
          ),
        );
    tracks.push(
      new THREE.NumberKeyframeTrack(
        "motion_torso.position[y]",
        time,
        poses.map((p) => p.torso.height),
      ),
    );
    return new THREE.AnimationClip(name, 1, tracks);
  };
  const landing = new THREE.AnimationClip(
    "landing",
    0.28,
    [
      new THREE.NumberKeyframeTrack(
        "motion_torso.position[y]",
        [0, 0.07, 0.28],
        [0, -0.035, 0],
      ),
      ...["leftKnee", "rightKnee"].map(
        (j) =>
          new THREE.NumberKeyframeTrack(
            `motion_${j}.rotation[x]`,
            [0, 0.07, 0.28],
            [0, -0.12, 0],
          ),
      ),
    ],
    THREE.AdditiveAnimationBlendMode,
  );
  return {
    run: bake("human-run", false),
    transfer: bake("surface-transfer", true),
    landing,
  };
}
let clips;
export class HumanMotionController {
  bind(rig) {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.root);
    }
    this.root = rig.root;
    for (const bone of BONES) rig[bone].name = `motion_${bone}`;
    for (const joint of JOINTS) rig.joints[joint].name = `motion_${joint}`;
    clips ??= createHumanClips();
    this.mixer = new THREE.AnimationMixer(rig.root);
    this.run = this.mixer.clipAction(clips.run).play();
    this.transfer = this.mixer.clipAction(clips.transfer).play();
    this.transfer.paused = true;
    this.land = this.mixer.clipAction(clips.landing).setLoop(THREE.LoopOnce, 1);
    this.weight = 0;
    this.wasAirborne = false;
    this.transfer.setEffectiveWeight(0);
    this.mixer.update(0);
  }
  reset() {
    if (!this.mixer) return;
    this.run.time = 0;
    this.weight = 0;
    this.wasAirborne = false;
    this.land.stop();
    this.transfer.setEffectiveWeight(0);
    this.run.setEffectiveWeight(1);
  }
  update(rig, dt, phase, airborne, progress) {
    if (!this.mixer) this.bind(rig);
    if (this.wasAirborne && !airborne) this.land.reset().play();
    this.wasAirborne = airborne;
    this.weight = THREE.MathUtils.lerp(
      this.weight,
      airborne ? 1 : 0,
      1 - Math.exp(-dt * 28),
    );
    this.transfer.time = THREE.MathUtils.clamp(progress || 0, 0, 1);
    this.transfer.setEffectiveWeight(this.weight);
    this.run.setEffectiveWeight(1 - this.weight);
    this.run.time = (phase / (Math.PI * 2)) % 1;
    this.run.paused = true;
    this.mixer.update(dt);
  }
}
