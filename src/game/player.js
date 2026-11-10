import { CapturedMotionController } from "../graphics/captured-character.js";
import { HumanMotionController } from "../graphics/human-motion.js";
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
    this.rigAnimator = new HumanMotionController();
    this.isDead = false;
    this.shieldTimer = 0;
    this.currentRig = null;

    this.upDirection = new THREE.Vector3(0, 1, 0);
    this.jumpOffset = 0;
    this.jumpActive = false;
    this.buildSupportSystems();
    this.applySkin("core");
  }

  buildSupportSystems() {
    this.board = new THREE.Group();
    this.board.visible = false;
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.055, 0.75),
      new THREE.MeshStandardMaterial({
        color: 0x172938,
        roughness: 0.6,
        metalness: 0.35,
      }),
    );
    deck.position.y = -0.025;
    this.board.add(deck);
    const rails = new THREE.MeshBasicMaterial({ color: 0x5cf1ff });
    for (const x of [-0.17, 0.17]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.018, 0.69),
        rails,
      );
      rail.position.set(x, -0.01, 0);
      this.board.add(rail);
    }
    this.visualGroup.add(this.board);

    this.contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x02070c,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.012;
    this.contactShadow.scale.y = 0.7;
    this.visualGroup.add(this.contactShadow);

    const shieldGeo = new THREE.OctahedronGeometry(1.25, 1);
    this.shieldMat = new THREE.MeshBasicMaterial({
      color: PALETTE.CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.visualGroup.add(this.shieldMesh);

    this.suitLight = new THREE.PointLight(PALETTE.CYAN, 0.4, 6);
    this.suitLight.position.set(0, 1.2, 0.5);
    this.visualGroup.add(this.suitLight);

    this.buildParticleSystem();
  }

  buildParticleSystem() {
    this.maxParticles = 60;
    this.particleBudget = 60;
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

    this.particleMat.depthWrite = false;
    this.particleSystem = new THREE.Points(geo, this.particleMat);
    this.particleSystem.frustumCulled = false;
    this.scene.add(this.particleSystem);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particlesData.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        life: 0,
      });
    }
  }

  setParticleBudget(count) {
    this.particleBudget = count;
    this.particleSystem.geometry.setDrawRange(0, count);
  }

  emitBurst(count = 20, colorHex = PALETTE.CYAN) {
    this.particleMat.color.setHex(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.particleBudget && spawned < count; i++) {
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

    this.rigAnimator.dispose?.();
    this.currentRig = SkinMeshBuilder.buildCharacterRig(skin);
    this.rigAnimator = this.currentRig.captured
      ? new CapturedMotionController()
      : new HumanMotionController();

    this.visualGroup.add(this.currentRig.root);
    this.rigAnimator.bind(this.currentRig);
    this.bootEffects = [];
    const bootsMaterial = new THREE.MeshBasicMaterial({ color: 0x9cf06a });
    for (const joint of ["leftAnkle", "rightAnkle"]) {
      if (this.currentRig.joints[joint]) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.09, 0.012, 6, 14),
          bootsMaterial,
        );
        ring.rotation.x = Math.PI / 2;
        ring.visible = false;
        this.currentRig.joints[joint].add(ring);
        this.bootEffects.push(ring);
      }
    }

    this.torso = this.currentRig.torso;
    this.head = this.currentRig.head;
    this.leftArm = this.currentRig.leftArm;
    this.rightArm = this.currentRig.rightArm;
    this.leftLeg = this.currentRig.leftLeg;
    this.rightLeg = this.currentRig.rightLeg;

    this.suitLight.color.setHex(skin.glowColor);
    this.particleMat.color.setHex(skin.glowColor);
  }

  setBootsActive(active) {
    for (const mesh of this.bootEffects || []) mesh.visible = active;
  }
  setBoardActive(active) {
    this.board.visible = active;
    this.boardActive = active;
    if (this.currentRig) this.currentRig.boardActive = active;
  }
  place(gravitySys) {
    this.upDirection.set(0, 1, 0).applyQuaternion(gravitySys.currentQuat);
    this.root.position
      .set(gravitySys.currentPos2D.x, gravitySys.currentPos2D.y, 0)
      .addScaledVector(
        this.upDirection,
        (this.jumpOffset || 0) + (this.boardActive ? 0.07 : 0),
      );
    this.root.quaternion.copy(gravitySys.currentQuat);
  }
  advancePhysics(dt, speed, gravity) {
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (!this.isDead && !gravity.isTransitioning && !this.jumpActive)
      this.runCycleTime +=
        dt * Math.PI * 2 * Math.min(2.15, 1.35 + speed * 0.018);
  }
  update(dt, speed, gravitySys, isMenuShowcase = false) {
    this.contactShadow.visible =
      !gravitySys.isTransitioning && !this.jumpActive;
    if (!this.physicsClocked)
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.shieldMesh.visible = this.shieldTimer > 0;
    if (this.shieldTimer > 0) {
      this.shieldMesh.rotation.y += dt * 4;
      this.shieldMesh.rotation.x += dt * 2;
      this.shieldMat.opacity = 0.35 + Math.sin(this.shieldTimer * 18) * 0.2;
    } else {
      this.shieldMat.opacity = 0;
    }

    this.place(gravitySys);

    this.elapsed = (this.elapsed || 0) + dt;
    const nowSec = this.elapsed;
    if (this.currentRig && this.currentRig.animExtras) {
      for (let i = 0; i < this.currentRig.animExtras.length; i++) {
        this.currentRig.animExtras[i].update(nowSec, dt);
      }
    }

    if (this.isDead) {
      const settle = 1 - Math.exp(-dt * 7);
      this.visualGroup.rotation.x = THREE.MathUtils.lerp(
        this.visualGroup.rotation.x,
        -0.85,
        settle,
      );
      this.visualGroup.rotation.z = THREE.MathUtils.lerp(
        this.visualGroup.rotation.z,
        0.2,
        settle,
      );
      this.visualGroup.position.y = THREE.MathUtils.lerp(
        this.visualGroup.position.y,
        -0.18,
        settle,
      );
      this.visualGroup.position.z = THREE.MathUtils.lerp(
        this.visualGroup.position.z,
        0.25,
        settle,
      );
    } else {
      // World travel supplies the jump arc: do not add a second floating bounce.
      const follow = 1 - Math.exp(-dt * 20);
      const airborne = gravitySys.isTransitioning || this.jumpActive;
      const progress = airborne
        ? Math.min(
            1,
            gravitySys.isTransitioning
              ? gravitySys.transitionElapsed / gravitySys.transitionDuration
              : this.jumpProgress || 0,
          )
        : 0;
      this.visualGroup.position.y = THREE.MathUtils.lerp(
        this.visualGroup.position.y,
        airborne ? Math.sin(progress * Math.PI) ** 2 * 0.035 : 0,
        follow,
      );
      this.visualGroup.rotation.x *= 1 - follow;
      this.visualGroup.rotation.y *= 1 - follow;
      this.visualGroup.rotation.z = THREE.MathUtils.lerp(
        this.visualGroup.rotation.z,
        this.boardActive
          ? THREE.MathUtils.clamp(
              (gravitySys.targetLateralOffset - gravitySys.lateralOffset) *
                -0.055,
              -0.12,
              0.12,
            )
          : 0,
        follow,
      );
      if (!airborne && !this.physicsClocked)
        this.runCycleTime +=
          dt * Math.PI * 2 * Math.min(2.15, 1.35 + speed * 0.018);
    }

    if (!this.isDead)
      this.rigAnimator.update(
        this.currentRig,
        dt,
        this.runCycleTime,
        gravitySys.isTransitioning || this.jumpActive,
        gravitySys.isTransitioning
          ? gravitySys.transitionElapsed / gravitySys.transitionDuration
          : this.jumpProgress || 0,
      );

    if (
      !this.isDead &&
      Math.random() < 1 - Math.exp((-30 * dt * this.particleBudget) / 60)
    ) {
      for (let i = 0; i < this.particleBudget; i++) {
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

  dispose() {
    const geometries = new Set(),
      materials = new Set();
    this.root.traverse((node) => {
      if (node.isSkinnedMesh) node.skeleton.dispose?.();
      if (node.geometry) geometries.add(node.geometry);
      if (node.material)
        (Array.isArray(node.material)
          ? node.material
          : [node.material]
        ).forEach((mat) => materials.add(mat));
    });
    geometries.add(this.particleSystem.geometry);
    materials.add(this.particleMat);
    for (const geo of geometries) geo.dispose();
    for (const mat of materials) mat.dispose();
    this.scene.remove(this.root);
    this.scene.remove(this.particleSystem);
  }
  reset() {
    this.jumpOffset = 0;
    this.jumpActive = false;
    this.setBoardActive(false);
    this.rigAnimator.reset();
    this.runCycleTime = 0;
    this.isDead = false;
    this.shieldTimer = 0;
    this.visualGroup.position.set(0, 0, 0);
    this.visualGroup.rotation.set(0, 0, 0);
  }
}
