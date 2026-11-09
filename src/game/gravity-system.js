import * as THREE from "three";
import { SURFACES } from "../config/surfaces.js";

export class GravitySystem {
  constructor() {
    this.transitionDuration = 0.2;
    this.maxLateralOffset = 4.3;
    this.setSurfaceImmediate("FLOOR");
  }

  setSurfaceImmediate(surfaceKey) {
    const surf = SURFACES[surfaceKey] || SURFACES.FLOOR;
    this.currentSurface = surf;
    this.targetSurface = surf;
    this.lateralOffset = 0;
    this.targetLateralOffset = 0;

    this.isTransitioning = false;
    this.transitionElapsed = 0;

    this.currentPos2D = surf.basePos.clone();
    this.startPos2D = surf.basePos.clone();
    this.targetPos2D = surf.basePos.clone();

    this.currentQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      surf.rollAngle,
    );
    this.startQuat = this.currentQuat.clone();
    this.targetQuat = this.currentQuat.clone();

    this.currentRollAngle = surf.rollAngle;
  }

  shiftTo(surfaceKey) {
    const nextSurf = SURFACES[surfaceKey];
    if (!nextSurf || nextSurf.id === this.targetSurface.id) {
      return false;
    }

    this.targetSurface = nextSurf;
    this.isTransitioning = true;
    this.transitionElapsed = 0;
    this.targetLateralOffset = 0;
    this.lateralOffset = 0;

    this.startPos2D.copy(this.currentPos2D);
    this.targetPos2D.copy(nextSurf.basePos);

    this.startQuat.copy(this.currentQuat);
    this.targetQuat.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      nextSurf.rollAngle,
    );

    return true;
  }

  nudgeLateral(dirSign) {
    if (this.isTransitioning) return;
    this.targetLateralOffset = THREE.MathUtils.clamp(
      this.targetLateralOffset + dirSign * 2.1,
      -this.maxLateralOffset,
      this.maxLateralOffset,
    );
  }

  update(dt) {
    if (this.isTransitioning) {
      this.transitionElapsed += dt;
      const rawT = Math.min(
        1.0,
        this.transitionElapsed / Math.max(0.05, this.transitionDuration),
      );
      // Smooth cubic ease-out
      const easeT = 1 - Math.pow(1 - rawT, 3);

      // Interpolate 2D cross-section position with a slight inward arc toward tunnel center (0,0)
      this.currentPos2D.lerpVectors(this.startPos2D, this.targetPos2D, easeT);
      const midArc = Math.sin(rawT * Math.PI) * 0.28;
      this.currentPos2D.multiplyScalar(1.0 - midArc);

      // Slerp 3D Quaternion orientation smoothly
      THREE.Quaternion.slerp(
        this.startQuat,
        this.targetQuat,
        this.currentQuat,
        easeT,
      );

      // Shortest-angle interpolation for camera roll
      let diff = this.targetSurface.rollAngle - this.currentSurface.rollAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.currentRollAngle = this.currentSurface.rollAngle + diff * easeT;

      if (rawT >= 1.0) {
        this.isTransitioning = false;
        this.currentSurface = this.targetSurface;
        this.currentPos2D.copy(this.targetPos2D);
        this.currentQuat.copy(this.targetQuat);
        this.currentRollAngle = this.targetSurface.rollAngle;
      }
    } else {
      // Smooth lateral movement along the active surface's tangent vector
      this.lateralOffset = THREE.MathUtils.lerp(
        this.lateralOffset,
        this.targetLateralOffset,
        Math.min(1, dt * 14),
      );
      const surf = this.currentSurface;
      this.currentPos2D.set(
        surf.basePos.x + surf.right.x * this.lateralOffset,
        surf.basePos.y + surf.right.y * this.lateralOffset,
      );
      this.currentRollAngle = surf.rollAngle;
    }
  }
}
