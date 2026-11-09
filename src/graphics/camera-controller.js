import * as THREE from "three";

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = "FULL";
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.currentUp = new THREE.Vector3(0, 1, 0);
    this.smoothedPos = new THREE.Vector3(0, -3.5, 7.2);
  }

  triggerShake(duration = 0.35, intensity = 0.45) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  update(dt, player, gravitySys, speed, isMenuShowcase = false) {
    const surf = gravitySys.targetSurface;
    const normal = surf.normal;

    if (isMenuShowcase) {
      const t = performance.now() * 0.0005;
      this.camera.position.set(Math.sin(t) * 1.6, -3.2, 6.2);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(0, -3.5, -18);
      return;
    }

    // Position camera behind player and lifted along surface normal so all 4 tunnel walls remain readable
    const desiredX = gravitySys.currentPos2D.x * 0.56 + normal.x * 2.25;
    const desiredY = gravitySys.currentPos2D.y * 0.56 + normal.y * 2.25;
    const desiredZ = 7.4;

    this.smoothedPos.x = THREE.MathUtils.lerp(
      this.smoothedPos.x,
      desiredX,
      Math.min(1, dt * 8.5),
    );
    this.smoothedPos.y = THREE.MathUtils.lerp(
      this.smoothedPos.y,
      desiredY,
      Math.min(1, dt * 8.5),
    );
    this.smoothedPos.z = THREE.MathUtils.lerp(
      this.smoothedPos.z,
      desiredZ,
      Math.min(1, dt * 8.5),
    );

    this.camera.position.copy(this.smoothedPos);

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    const rollScale = this.mode === "HYBRID" ? 0.65 : 1.0;
    const targetUp = new THREE.Vector3(
      -Math.sin(gravitySys.currentRollAngle * rollScale),
      Math.cos(gravitySys.currentRollAngle * rollScale),
      0,
    ).normalize();

    this.currentUp.lerp(targetUp, Math.min(1, dt * 9.0)).normalize();
    this.camera.up.copy(this.currentUp);

    const lookX = gravitySys.currentPos2D.x * 0.25;
    const lookY = gravitySys.currentPos2D.y * 0.25;
    this.camera.lookAt(lookX, lookY, -28);

    // Dynamic speed FOV
    const targetFov = Math.min(82, 64 + (speed - 30) * 0.35);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 4);
    this.camera.updateProjectionMatrix();
  }
}
