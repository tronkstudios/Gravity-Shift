import { RigAnimator } from "../graphics/rig-animator.js";
import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { SKINS_CATALOG } from "../data/skins.js";
import { SkinMeshBuilder } from "../graphics/skin-mesh-builder.js";

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.visualGroup = new THREE.Group();
    this.root.add(this.visualGroup);
    this.scene.add(this.root);

    this.runCycleTime = 0;
    this.rigAnimator = new RigAnimator();
    this.isDead = false;
    this.shieldTimer = 0;
    this.currentRig = null;

    this.buildSupportSystems();
    this.applySkin("core");
  }

  buildSupportSystems() {
    const shieldGeo = new THREE.OctahedronGeometry(1.25, 1);
    this.shieldMat = new THREE.MeshBasicMaterial({
      color: PALETTE.CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.visualGroup.add(this.shieldMesh);

    this.suitLight = new THREE.PointLight(PALETTE.CYAN, 1.4, 9.5);
    this.suitLight.position.set(0, 1.2, 0.5);
    this.visualGroup.add(this.suitLight);

    this.buildParticleSystem();
  }

  buildParticleSystem() {
    this.maxParticles = 60;
    this.particlesData = [];
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: PALETTE.CYAN,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
    });

    this.particleSystem = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particleSystem);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particlesData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0,
      });
    }
  }

  emitBurst(count = 20, colorHex = PALETTE.CYAN) {
    this.particleMat.color.setHex(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particlesData[i];
      if (p.life <= 0) {
        p.pos.copy(this.root.position);
        p.vel.set(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.2) * 10,
        );
        p.life = 0.35 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  applySkin(skinId) {
    const skin = SKINS_CATALOG.find((s) => s.id === skinId) || SKINS_CATALOG[0];

    if (this.currentRig && this.currentRig.root) {
      this.visualGroup.remove(this.currentRig.root);
      SkinMeshBuilder.disposeRig(this.currentRig);
    }

    this.currentRig = SkinMeshBuilder.buildCharacterRig(skin);
    this.visualGroup.add(this.currentRig.root);

    this.torso = this.currentRig.torso;
    this.head = this.currentRig.head;
    this.leftArm = this.currentRig.leftArm;
    this.rightArm = this.currentRig.rightArm;
    this.leftLeg = this.currentRig.leftLeg;
    this.rightLeg = this.currentRig.rightLeg;

    this.suitLight.color.setHex(skin.glowColor);
    this.particleMat.color.setHex(skin.glowColor);
  }

  update(dt, speed, gravitySys, isMenuShowcase = false) {
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldMesh.rotation.y += dt * 4;
      this.shieldMesh.rotation.x += dt * 2;
      this.shieldMat.opacity = 0.35 + Math.sin(this.shieldTimer * 18) * 0.2;
    } else {
      this.shieldMat.opacity = 0;
    }

    this.root.position.x = gravitySys.currentPos2D.x;
    this.root.position.y = gravitySys.currentPos2D.y;
    this.root.position.z = 0;
    this.root.quaternion.copy(gravitySys.currentQuat);

    this.elapsed = (this.elapsed || 0) + dt;
    const nowSec = this.elapsed;
    if (this.currentRig && this.currentRig.animExtras) {
      for (let i = 0; i < this.currentRig.animExtras.length; i++) {
        this.currentRig.animExtras[i].update(nowSec, dt);
      }
    }

    if (this.isDead) {
      this.visualGroup.rotation.x += dt * 7.5;
      this.visualGroup.rotation.y += dt * 5.0;
      this.visualGroup.position.z += dt * 6.0;
    } else if (gravitySys.isTransitioning) {
      const progress = Math.min(
        1,
        gravitySys.transitionElapsed / gravitySys.transitionDuration,
      );
      const arc = Math.sin(progress * Math.PI);
      const blend = 1 - Math.exp(-dt * 18);
      this.visualGroup.position.y = THREE.MathUtils.lerp(
        this.visualGroup.position.y,
        0.2 + arc * 0.7,
        blend,
      );
      this.visualGroup.rotation.x = THREE.MathUtils.lerp(
        this.visualGroup.rotation.x,
        -0.22 - arc * 0.45,
        blend,
      );
      this.visualGroup.rotation.z = Math.sin(progress * Math.PI * 2) * 0.18;
      this.torso.rotation.x = -0.3;
      this.head.rotation.x = 0.1;
      this.leftArm.rotation.x = 0.35 + arc * 0.85;
      this.rightArm.rotation.x = -0.35 - arc * 0.6;
      this.leftArm.rotation.z = arc * 0.35;
      this.rightArm.rotation.z = -arc * 0.35;
      this.leftLeg.rotation.x = -0.2 - arc * 0.85;
      this.rightLeg.rotation.x = 0.2 + arc * 0.65;
    } else {
      const blend = 1 - Math.exp(-dt * 16);
      this.visualGroup.rotation.x *= 1 - blend;
      this.visualGroup.rotation.z *= 1 - blend;
      this.visualGroup.rotation.y = THREE.MathUtils.lerp(
        this.visualGroup.rotation.y,
        isMenuShowcase ? 0.2 : 0,
        blend,
      );
      this.visualGroup.position.y *= 1 - blend;
      const cadence = Math.min(21, 9 + speed * 0.2);
      this.runCycleTime += dt * cadence;
      const swing = Math.sin(this.runCycleTime);
      const bob = Math.cos(this.runCycleTime * 2) * 0.065;
      this.torso.position.y = 1.08 + bob;
      this.torso.rotation.x = -0.2 + Math.cos(this.runCycleTime * 2) * 0.045;
      this.torso.rotation.y = swing * 0.11;
      this.torso.rotation.z = swing * 0.045;
      this.head.rotation.x = 0.1 - Math.cos(this.runCycleTime * 2) * 0.025;
      this.head.rotation.y = -swing * 0.07;
      this.leftArm.rotation.x = swing * 0.8;
      this.rightArm.rotation.x = -swing * 0.8;
      this.leftArm.rotation.z = 0.08;
      this.rightArm.rotation.z = -0.08;
      this.leftLeg.rotation.x = -swing * 0.95;
      this.rightLeg.rotation.x = swing * 0.95;
    }

    if (!this.isDead)
      this.rigAnimator.update(
        this.currentRig,
        dt,
        this.runCycleTime,
        gravitySys.isTransitioning,
        gravitySys.transitionElapsed / gravitySys.transitionDuration,
      );

    if (!this.isDead && Math.random() < 1 - Math.exp(-30 * dt)) {
      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particlesData[i];
        if (p.life <= 0) {
          p.pos.copy(this.root.position);
          p.vel.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            10,
          );
          p.life = 0.25;
          break;
        }
      }
    }

    const attr = this.particleSystem.geometry.attributes.position;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlesData[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.addScaledVector(p.vel, dt);
        attr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      } else {
        attr.setXYZ(i, 0, -999, 0);
      }
    }
    attr.needsUpdate = true;
  }

  reset() {
    this.isDead = false;
    this.shieldTimer = 0;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.rotation.set(0, 0, 0);
  }
}
