import * as THREE from "three";
import { SKINS_CATALOG } from "../data/skins.js";
import { SURFACES, SURFACE_KEYS } from "../config/surfaces.js";
import { GravitySystem } from "./gravity-system.js";
import { Player } from "./player.js";
import { obstacleContact } from "./collision-shapes.js";
export class RareRunners {
  constructor(game, random = () => Math.random()) {
    this.game = game;
    this.random = random;
    this.reset();
  }
  reset() {
    this.despawn();
    this.nextCheck = 180;
    this.seen = false;
  }
  despawn() {
    if (this.active) this.active.player.dispose();
    this.active = null;
  }
  spawn(id) {
    const g = this.game;
    if (g.runMode !== "normal" || this.active || this.seen) return false;
    const skin = SKINS_CATALOG.find((s) => s.id === id);
    if (!skin) return false;
    const player = new Player(g.scene);
    player.applySkin(id);
    player.setParticleBudget(12);
    const gravity = new GravitySystem();
    gravity.transitionDuration = 0.16;
    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.025, 6, 20),
      new THREE.MeshBasicMaterial({ color: 0xffd16a }),
    );
    beacon.position.y = 1.95;
    player.visualGroup.add(beacon);
    this.active = { player, gravity, skin, z: -48, emergencyDodges: 0 };
    this.seen = true;
    g.ui.showToast(
      "CORREDOR RARO · ALCANZA A " + skin.name + " PARA CONSEGUIR SU TRAJE",
      3,
    );
    return true;
  }
  contacts(position, normal, z) {
    return this.game.world.obstacles.some((ob) =>
      obstacleContact(
        {
          ...ob,
          mesh: {
            position: {
              x: ob.mesh.position.x,
              y: ob.mesh.position.y,
              z: ob.mesh.position.z - z,
            },
            rotation: ob.mesh.rotation,
          },
        },
        position,
        normal,
      ),
    );
  }
  tick(dt) {
    const g = this.game;
    if (g.runMode !== "normal" || g.state !== "PLAYING") return;
    if (!this.active) {
      if (!this.seen && g.scoreMgr.distance >= this.nextCheck) {
        this.nextCheck += 120;
        if (this.random() < 0.006) {
          const skins = SKINS_CATALOG.filter(
            (s) => !g.scoreMgr.saveData.unlockedSkins.includes(s.id),
          );
          if (skins.length)
            this.spawn(skins[Math.floor(this.random() * skins.length)].id);
        }
      }
      return;
    }
    const rival = this.active,
      speed = g.currentSpeed * 0.88;
    const threats = g.world.obstacles.filter(
      (ob) =>
        ob.mesh.position.z - rival.z < 2 &&
        ob.mesh.position.z - rival.z > -speed * 1.25,
    );
    const rank = (key) => {
      let cost = key === rival.gravity.targetSurface.id ? -0.1 : 0;
      for (const ob of threats) {
        const eta = Math.max(0, (rival.z - ob.mesh.position.z) / speed);
        if (ob.surfaceKey === key) cost += 10 / (eta + 0.15);
        if (ob.type === "ROTATING") {
          const p = SURFACES[key].basePos,
            normal = SURFACES[key].normal,
            angle = ob.mesh.rotation.z + ob.rotSpeed * eta;
          const proxy = {
            ...ob,
            mesh: { position: { x: 0, y: 0, z: 0 }, rotation: { z: angle } },
          };
          if (obstacleContact(proxy, p, normal)) cost += 12 / (eta + 0.15);
        }
      }
      return cost;
    };
    const best = [...SURFACE_KEYS].sort((a, b) => rank(a) - rank(b))[0];
    if (best === rival.gravity.targetSurface.id) rival.gravity.shiftTo(best);
    if (
      best !== rival.gravity.targetSurface.id &&
      rank(rival.gravity.targetSurface.id) > 0
    )
      rival.gravity.shiftTo(best);
    rival.gravity.update(dt);
    rival.z += (g.currentSpeed - speed) * dt;
    rival.player.place(rival.gravity);
    rival.player.root.position.z = rival.z;
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(
      rival.gravity.currentQuat,
    );
    if (this.contacts(rival.player.root.position, normal, rival.z)) {
      rival.emergencyDodges++;
      const safe = SURFACE_KEYS.find(
        (key) =>
          !this.contacts(SURFACES[key].basePos, SURFACES[key].normal, rival.z),
      );
      if (safe) {
        rival.gravity.setSurfaceImmediate(safe);
        rival.player.place(rival.gravity);
        rival.player.root.position.z = rival.z;
        rival.player.emitBurst(8, 0xffd16a);
      } else {
        rival.player.jumpOffset = 3.8;
        rival.player.jumpActive = true;
        rival.player.jumpProgress = 0.5;
        rival.player.place(rival.gravity);
        rival.player.root.position.z = rival.z;
      }
    } else {
      rival.player.jumpOffset = 0;
      rival.player.jumpActive = false;
    }
    if (
      Math.abs(rival.z) < 1.6 &&
      rival.player.root.position.distanceTo(g.player.root.position) < 2
    ) {
      if (!g.scoreMgr.saveData.unlockedSkins.includes(rival.skin.id)) {
        g.scoreMgr.saveData.unlockedSkins.push(rival.skin.id);
        g.scoreMgr.persist();
        g.ui.showToast(
          "¡ALCANZADO! " + rival.skin.name + " DESBLOQUEADO PARA SIEMPRE",
          3,
        );
        g.player.emitBurst(38, 0xffd16a);
        g.ui.refreshAllUI();
      }
      this.despawn();
      return;
    }
    if (rival.z > 6) this.despawn();
  }
  render(dt) {
    if (!this.active) return;
    const r = this.active;
    r.player.update(dt, this.game.currentSpeed * 0.88, r.gravity);
    r.player.root.position.z = r.z;
  }
}
