import * as THREE from "three";

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = "FULL";
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.currentUp = new THREE.Vector3(0, 1, 0);
    this.smoothedPos = new THREE.Vector3(0, -3.5, 7.4);
    this.normal = new THREE.Vector3(0, 1, 0);
    this.desired = new THREE.Vector3();
    this.smoothedRoll = 0;
  }
  triggerShake(duration = 0.35, intensity = 0.45) {
    this.shakeTimer = duration;
    this.shakeDuration = duration;
    this.shakeIntensity = Math.min(0.16, intensity);
  }
  reset(gravity) {
    this.shakeTimer = 0;
    this.smoothedRoll =
      gravity.currentRollAngle * (this.mode === "HYBRID" ? 0.65 : 1);
    this.normal.set(0, 1, 0).applyQuaternion(gravity.currentQuat);
    this.smoothedPos.set(
      gravity.currentPos2D.x * 0.56 + this.normal.x * 0.75,
      gravity.currentPos2D.y * 0.56 + this.normal.y * 0.75,
      7.4,
    );
    this.camera.position.copy(this.smoothedPos);
    this.currentUp.set(
      -Math.sin(this.smoothedRoll),
      Math.cos(this.smoothedRoll),
      0,
    );
    this.camera.up.copy(this.currentUp);
    this.camera.lookAt(
      gravity.currentPos2D.x * 0.5,
      gravity.currentPos2D.y * 0.5,
      -28,
    );
    this.camera.fov = 64;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
  update(dt, player, gravity, speed, isMenuShowcase = false) {
    if (isMenuShowcase) {
      this.camera.position.set(0, 0.8, 16);
      this.camera.up.set(0, 1, 0);
      this.camera.fov = 58;
      this.camera.lookAt(-4.8, 0, -8);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld(true);
      return;
    }
    // Follow the current orientation, not the destination wall before takeoff.
    this.normal.set(0, 1, 0).applyQuaternion(gravity.currentQuat);
    this.desired.set(
      gravity.currentPos2D.x * 0.56 + this.normal.x * 0.75,
      gravity.currentPos2D.y * 0.56 + this.normal.y * 0.75,
      7.4,
    );
    this.smoothedPos.lerp(this.desired, 1 - Math.exp(-dt * 8.5));
    this.camera.position.copy(this.smoothedPos);
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      const age = this.shakeDuration - this.shakeTimer,
        amplitude =
          (this.shakeIntensity * this.shakeTimer) / this.shakeDuration;
      this.camera.position.x += Math.sin(age * 47) * amplitude;
      this.camera.position.y += Math.sin(age * 61) * amplitude * 0.6;
    }
    const targetRoll =
      gravity.currentRollAngle * (this.mode === "HYBRID" ? 0.65 : 1);
    const difference = Math.atan2(
      Math.sin(targetRoll - this.smoothedRoll),
      Math.cos(targetRoll - this.smoothedRoll),
    );
    this.smoothedRoll += difference * (1 - Math.exp(-dt * 9));
    this.currentUp.set(
      -Math.sin(this.smoothedRoll),
      Math.cos(this.smoothedRoll),
      0,
    );
    this.camera.up.copy(this.currentUp);
    this.camera.lookAt(
      gravity.currentPos2D.x * 0.5,
      gravity.currentPos2D.y * 0.5,
      -28,
    );
    const fov = Math.min(82, 64 + Math.max(0, speed - 30) * 0.35);
    this.camera.fov = THREE.MathUtils.lerp(
      this.camera.fov,
      fov,
      1 - Math.exp(-dt * 4),
    );
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
}
