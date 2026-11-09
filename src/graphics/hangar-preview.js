import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { SkinMeshBuilder } from "./skin-mesh-builder.js";

export class HangarPreviewStudio {
  constructor() {
    this.canvas = document.getElementById("hangar-preview-canvas");
    this.viewport = document.getElementById("hangar-preview-viewport");
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.pedestalGroup = null;
    this.previewRig = null;
    this.isActive = false;
    this.poseMode = "RUN";
    this.userYaw = 0.35;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.animTime = 0;

    this.bindInteraction();
  }

  ensureInitialized() {
    if (this.renderer) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
    this.camera.position.set(0, 1.25, 3.55);
    this.camera.lookAt(0, 0.98, 0);

    const amb = new THREE.AmbientLight(0x99bbdd, 0.85);
    this.scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(3, 5, 4);
    this.scene.add(keyLight);

    this.rimLight = new THREE.PointLight(PALETTE.CYAN, 1.6, 8);
    this.rimLight.position.set(-2, 2.2, -2);
    this.scene.add(this.rimLight);

    this.pedestalGroup = new THREE.Group();
    this.scene.add(this.pedestalGroup);

    const baseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.08, 0.14, 16),
      new THREE.MeshStandardMaterial({
        color: PALETTE.STEEL_DARK,
        metalness: 0.8,
        roughness: 0.3,
      }),
    );
    baseDisc.position.y = -0.07;
    this.pedestalGroup.add(baseDisc);

    this.pedestalRingMat = new THREE.MeshBasicMaterial({ color: PALETTE.CYAN });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.96, 0.025, 8, 32),
      this.pedestalRingMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    this.pedestalGroup.add(ring);
  }

  bindInteraction() {
    if (!this.viewport) return;
    const startDrag = (clientX) => {
      this.isDragging = true;
      this.lastMouseX = clientX;
    };
    const moveDrag = (clientX) => {
      if (!this.isDragging) return;
      const dx = clientX - this.lastMouseX;
      this.lastMouseX = clientX;
      this.userYaw += dx * 0.012;
    };
    const endDrag = () => {
      this.isDragging = false;
    };

    this.viewport.addEventListener("mousedown", (e) => startDrag(e.clientX));
    window.addEventListener("mousemove", (e) => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);

    this.viewport.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 0) startDrag(e.touches[0].clientX);
      },
      { passive: true },
    );
    this.viewport.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
      },
      { passive: true },
    );
    this.viewport.addEventListener("touchend", endDrag, { passive: true });
  }

  loadSkinModel(skinConfig) {
    this.ensureInitialized();
    this.resize();

    if (this.previewRig && this.previewRig.root) {
      this.pedestalGroup.remove(this.previewRig.root);
      SkinMeshBuilder.disposeRig(this.previewRig);
    }

    this.previewRig = SkinMeshBuilder.buildCharacterRig(skinConfig);
    this.pedestalGroup.add(this.previewRig.root);
    this.pedestalRingMat.color.setHex(skinConfig.glowColor);
    this.rimLight.color.setHex(skinConfig.glowColor);
  }

  resize() {
    if (!this.renderer || !this.viewport) return;
    const w = Math.max(200, this.viewport.clientWidth);
    const h = Math.max(180, this.viewport.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  updateAndRender(dt) {
    if (!this.isActive || !this.renderer || !this.previewRig) return;

    this.animTime += dt;
    if (!this.isDragging) {
      this.userYaw += dt * 0.65;
    }
    this.pedestalGroup.rotation.y = this.userYaw;

    if (this.previewRig.animExtras) {
      for (let i = 0; i < this.previewRig.animExtras.length; i++) {
        this.previewRig.animExtras[i].update(this.animTime, dt);
      }
    }

    if (this.poseMode === "RUN") {
      const t = this.animTime * 7.5;
      const swing = Math.sin(t);
      const bob = Math.abs(Math.cos(t)) * 0.08;
      this.previewRig.torso.position.y = 1.05 + bob;
      this.previewRig.torso.rotation.x = -0.16;
      this.previewRig.torso.rotation.y = swing * 0.12;
      this.previewRig.leftArm.rotation.x = swing * 0.85;
      this.previewRig.rightArm.rotation.x = -swing * 0.85;
      this.previewRig.leftLeg.rotation.x = -swing * 0.95;
      this.previewRig.rightLeg.rotation.x = swing * 0.95;
    } else {
      const breath = Math.sin(this.animTime * 2.5) * 0.03;
      this.previewRig.torso.position.y = 1.05 + breath;
      this.previewRig.torso.rotation.set(0, 0, 0);
      this.previewRig.leftArm.rotation.x = -0.12;
      this.previewRig.rightArm.rotation.x = 0.12;
      this.previewRig.leftLeg.rotation.x = 0;
      this.previewRig.rightLeg.rotation.x = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
