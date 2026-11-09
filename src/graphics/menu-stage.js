import { ZoneController } from "./zone-controller.js";
import { CameraController } from "./camera-controller.js";
import * as THREE from "three";
import { Player } from "../game/player.js";
import { GravitySystem } from "../game/gravity-system.js";
import { ProceduralWorld } from "../game/procedural-world.js";
import { MenuDirector } from "../game/menu-director.js";
import { SeededRNG } from "../core/seeded-rng.js";

/** Independent attract-mode game using the original interior chase perspective. */
export class MenuStage {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#090f1a");
    this.scene.fog = new THREE.Fog("#090f1a", 32, 65);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
    this.camera.position.set(0, -3.2, 6.2);
    this.cameraController = new CameraController(this.camera);
    this.camera.lookAt(0, -3.5, -18);
    this.scene.add(new THREE.HemisphereLight(0xb9eeff, 0x17182d, 1.2));
    const key = new THREE.DirectionalLight(0xe5f6ff, 1.5);
    key.position.set(8, 12, 12);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x9567ff, 3, 45);
    rim.position.set(-6, 4, -6);
    this.scene.add(rim);
    this.gravity = new GravitySystem();
    this.gravity.transitionDuration = 0.62;
    this.player = new Player(this.scene);
    this.world = new ProceduralWorld(this.scene, new SeededRNG("MENU-STAGE"));
    this.world.resetWorld();
    this.demoDistance = 0;
    this.zoneController = new ZoneController(this.scene, this.world);
    this.director = new MenuDirector();
    this.director.speed = 22;
    this.respawn = 0;
    this.skin = "core";
  }
  update(dt, skin) {
    if (skin !== this.skin) {
      this.skin = skin;
      this.player.applySkin(skin);
    }
    if (this.director.crashed) {
      this.player.isDead = true;
      this.respawn += dt;
      this.player.update(dt, 0, this.gravity, true);
      if (this.respawn > 0.9) {
        this.player.reset();
        this.gravity.setSurfaceImmediate("FLOOR");
        this.world.resetWorld();
        this.demoDistance = 0;
        this.director.crashed = false;
        this.respawn = 0;
      }
      return;
    }
    this.cameraController.update(
      dt,
      this.player,
      this.gravity,
      this.director.speed,
      false,
    );
    this.director.update(dt, this.world, this.gravity, this.player);
    this.gravity.update(dt);
    this.player.update(dt, this.director.speed, this.gravity, true);
    this.demoDistance += dt * this.director.speed * 0.45;
    this.zoneController.update(dt, this.demoDistance);
    this.world.update(dt, this.director.speed, this.demoDistance);
  }
  render(renderer, width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.render(this.scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
  }
}
