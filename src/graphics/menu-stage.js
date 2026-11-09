import * as THREE from "three";
import { Player } from "../game/player.js";
import { GravitySystem } from "../game/gravity-system.js";
import { ProceduralWorld } from "../game/procedural-world.js";
import { MenuDirector } from "../game/menu-director.js";
import { SeededRNG } from "../core/seeded-rng.js";

/** Isolated cutaway diorama, deliberately composed unlike the chase-camera game. */
export class MenuStage {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#090f1a");
    this.scene.fog = new THREE.Fog("#090f1a", 32, 65);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
    this.camera.position.set(17, 11, 22);
    this.camera.lookAt(0, 0, -4);
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
    // An open architectural model makes every surface and the runner visible.
    this.world.tunnelSegments.forEach((segment) => {
      segment.visible = false;
    });
    this.world.speedDust.visible = false;
    this.world.resetWorld();
    this.director = new MenuDirector();
    this.director.speed = 15;
    const metal = new THREE.MeshStandardMaterial({
      color: 0x26364d,
      metalness: 0.65,
      roughness: 0.35,
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0x37e5ff });
    const railGeo = new THREE.BoxGeometry(0.12, 0.12, 38);
    for (const x of [-7, 7])
      for (const y of [-7, 7]) {
        const rail = new THREE.Mesh(railGeo, glow);
        rail.position.set(x, y, -10);
        this.scene.add(rail);
      }
    for (const z of [-25, -15, -5, 5]) {
      const geometry = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(14, 14, 0.45),
      );
      const frame = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x496580,
          transparent: true,
          opacity: 0.7,
        }),
      );
      frame.position.z = z;
      this.scene.add(frame);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 38), metal);
    deck.position.set(0, -7.2, -10);
    this.scene.add(deck);
    const grid = new THREE.GridHelper(14, 14, 0x35b8d8, 0x263c57);
    grid.position.set(0, -7.08, -3);
    this.scene.add(grid);
    this.skin = "core";
  }
  update(dt, skin) {
    if (skin !== this.skin) {
      this.skin = skin;
      this.player.applySkin(skin);
    }
    this.director.update(dt, this.world, this.gravity, this.player);
    this.gravity.update(dt);
    this.player.update(dt, this.director.speed, this.gravity, true);
    this.world.update(dt, this.director.speed, 0);
  }
  render(renderer, width, height) {
    const left = width >= 900 ? Math.floor(width * 0.43) : 0;
    const top = width >= 900 ? 0 : Math.floor(height * 0.42);
    const viewportHeight = height - top;
    this.camera.aspect = (width - left) / viewportHeight;
    this.camera.updateProjectionMatrix();
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.clear();
    renderer.setViewport(left, 0, width - left, viewportHeight);
    renderer.setScissor(left, 0, width - left, viewportHeight);
    renderer.setScissorTest(true);
    renderer.render(this.scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
  }
}
