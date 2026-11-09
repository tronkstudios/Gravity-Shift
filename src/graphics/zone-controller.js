import * as THREE from "three";
import { zoneForDistance } from "../data/run-content.js";
export class ZoneController {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.zone = zoneForDistance(0);
    this.changed = false;
  }
  update(dt, distance) {
    const next = zoneForDistance(distance);
    this.changed = next.id !== this.zone.id;
    this.zone = next;
    const blend = 1 - Math.exp(-dt * 1.8),
      accent = new THREE.Color(next.color),
      background = new THREE.Color(next.background);
    this.scene.background?.lerp(background, blend);
    this.scene.fog?.color.lerp(background, blend);
    for (const material of Object.values(this.world.surfaceTrimMats)) {
      material.color.lerp(accent, blend);
      material.emissive.lerp(accent, blend);
    }
    this.world.matFloorDeck.color.lerp(
      new THREE.Color(
        next.id === "reactor"
          ? 0x3a2c25
          : next.id === "fracture"
            ? 0x26213f
            : 0x1e2d3d,
      ),
      blend,
    );
    this.world.matBrutalRib.color.lerp(
      new THREE.Color(
        next.id === "reactor"
          ? 0x574335
          : next.id === "fracture"
            ? 0x39324d
            : 0x263747,
      ),
      blend,
    );
    this.world.atmosphere?.warm.color.lerp(
      new THREE.Color(
        next.id === "fracture"
          ? 0xa88aff
          : next.id === "reactor"
            ? 0xff712e
            : 0xffb56e,
      ),
      blend,
    );
    this.world.tunnelSegments.forEach((segment, index) => {
      for (const panel of segment.userData.servicePanels || [])
        panel.rotation.z = THREE.MathUtils.lerp(
          panel.rotation.z,
          next.id === "fracture" ? (index % 2 ? -0.1 : 0.08) : 0,
          blend,
        );
    });
    return this.zone;
  }
}
