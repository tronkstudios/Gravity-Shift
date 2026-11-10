import { createItemVisual, itemMaterials } from "../graphics/item-visuals.js";
import { ITEM_TYPES } from "../data/items.js";
import { batchTunnelSegments } from "../graphics/tunnel-batching.js";
import { obstacleContact } from "./collision-shapes.js";
import { RUN_PHRASES, zoneForDistance } from "../data/run-content.js";
import { addTunnelAtmosphere } from "../graphics/tunnel-atmosphere.js";
import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { TUNNEL } from "../config/palette.js";
import { SURFACES } from "../config/surfaces.js";
import { SURFACE_KEYS } from "../config/surfaces.js";

export class ProceduralWorld {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;

    this.tunnelSegments = [];
    this.obstacles = [];
    this.collectibles = [];
    this.obstaclePool = { BARRIER: [], LASER: [], HAZARD_ZONE: [], MOVING: [] };
    this.coinPool = [];
    this.powerups = [];
    this.powerupPool = Object.fromEntries(ITEM_TYPES.map((type) => [type, []]));
    this.itemMaterials = itemMaterials();

    this.nextSegmentZ = 20;
    this.nextPatternZ = -48;
    this.patternCounter = 0;

    this.activeSurfaceKey = "FLOOR";
    this.shiftPulseTimer = 0;

    this.initSharedMaterials();
    this.initTunnelPool();
    this.atmosphere = addTunnelAtmosphere(this.scene, this.tunnelSegments);
    this.tunnelBatching = batchTunnelSegments(this.tunnelSegments);
    this.initSpeedDust();
  }

  initSharedMaterials() {
    this.orbGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24).rotateX(
      Math.PI / 2,
    );
    this.matFloorDeck = new THREE.MeshStandardMaterial({
      color: 0x1e2d3d,
      metalness: 0.72,
      roughness: 0.35,
    });
    this.matCeilingVault = new THREE.MeshStandardMaterial({
      color: 0x0b0f17,
      metalness: 0.5,
      roughness: 0.65,
    });
    this.matLeftWallPanel = new THREE.MeshStandardMaterial({
      color: 0x16222f,
      metalness: 0.65,
      roughness: 0.42,
    });
    this.matRightWallPanel = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      metalness: 0.7,
      roughness: 0.38,
    });
    this.matBrutalRib = new THREE.MeshStandardMaterial({
      color: PALETTE.STEEL,
      metalness: 0.75,
      roughness: 0.3,
    });

    this.surfaceTrimMats = {
      FLOOR: new THREE.MeshStandardMaterial({
        color: PALETTE.CYAN,
        emissive: PALETTE.CYAN,
        emissiveIntensity: 0.95,
      }),
      CEILING: new THREE.MeshStandardMaterial({
        color: 0x7090b0,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.25,
      }),
      LEFT: new THREE.MeshStandardMaterial({
        color: 0x00a8cc,
        emissive: PALETTE.CYAN,
        emissiveIntensity: 0.3,
      }),
      RIGHT: new THREE.MeshStandardMaterial({
        color: 0xd99b26,
        emissive: 0xffb800,
        emissiveIntensity: 0.3,
      }),
    };

    this.matHazardSolid = new THREE.MeshStandardMaterial({
      color: PALETTE.HAZARD,
      emissive: PALETTE.HAZARD,
      emissiveIntensity: 0.38,
      metalness: 0.5,
      roughness: 0.3,
    });
    this.matLaserBeam = new THREE.MeshBasicMaterial({
      color: PALETTE.HAZARD,
    });
    this.matHazardZone = new THREE.MeshBasicMaterial({
      color: PALETTE.HAZARD,
      transparent: true,
      opacity: 0.75,
    });
    this.matEnergyOrb = new THREE.MeshStandardMaterial({
      color: 0xffca55,
      emissive: 0xffa320,
      emissiveIntensity: 0.45,
      metalness: 0.2,
      roughness: 0.1,
    });
  }

  notifySurfaceShift(surfaceKey) {
    this.activeSurfaceKey = surfaceKey;
    this.shiftPulseTimer = 0.45;
  }

  initTunnelPool() {
    const H = TUNNEL.HALF_SIZE;
    const L = TUNNEL.SEGMENT_LENGTH;

    const baseSlabGeo = new THREE.BoxGeometry(13.8, 0.5, L - 0.3);
    const cornerBevelGeo = new THREE.BoxGeometry(1.5, 1.5, L);

    // 1. FLOOR GEOMETRIES
    const floorTrackRailGeo = new THREE.BoxGeometry(0.32, 0.14, L);
    const floorCenterTieGeo = new THREE.BoxGeometry(3.4, 0.1, 1.2);

    // 2. CEILING GEOMETRIES
    const ceilingGirderGeo = new THREE.BoxGeometry(12.6, 0.95, 1.5);
    const ceilingStrutGeo = new THREE.BoxGeometry(0.9, 1.3, 1.3);
    const ceilingConduitGeo = new THREE.BoxGeometry(0.16, 0.14, L);

    // 3. LEFT WALL GEOMETRIES
    const leftVerticalPillarGeo = new THREE.BoxGeometry(0.28, 11.8, 0.75);
    const leftLightStripGeo = new THREE.BoxGeometry(0.14, 11.4, 0.28);

    // 4. RIGHT WALL GEOMETRIES
    const rightDiagBeamGeo = new THREE.BoxGeometry(0.26, 13.5, 0.65);
    const rightHorizBandGeo = new THREE.BoxGeometry(0.16, 0.3, L);

    for (let i = 0; i < TUNNEL.POOL_SEGMENTS; i++) {
      const seg = new THREE.Group();

      // A. SUELO (FLOOR)
      const floorSlab = new THREE.Mesh(baseSlabGeo, this.matFloorDeck);
      floorSlab.position.set(0, -H - 0.25, 0);
      seg.add(floorSlab);

      [-2.3, 2.3].forEach((rx) => {
        const rail = new THREE.Mesh(
          floorTrackRailGeo,
          this.surfaceTrimMats.FLOOR,
        );
        rail.position.set(rx, -H + 0.04, 0);
        seg.add(rail);
      });

      for (let zOff = -L * 0.35; zOff <= L * 0.35; zOff += L * 0.35) {
        const tie = new THREE.Mesh(floorCenterTieGeo, this.matBrutalRib);
        tie.position.set(0, -H + 0.02, zOff);
        seg.add(tie);
      }

      // B. TECHO (CEILING)
      const ceilingSlab = new THREE.Mesh(baseSlabGeo, this.matCeilingVault);
      ceilingSlab.position.set(0, H + 0.25, 0);
      seg.add(ceilingSlab);

      [-L * 0.25, L * 0.25].forEach((zOff) => {
        const girder = new THREE.Mesh(ceilingGirderGeo, this.matBrutalRib);
        girder.position.set(0, H - 0.35, zOff);
        seg.add(girder);

        [-3.8, 3.8].forEach((sx) => {
          const strut = new THREE.Mesh(ceilingStrutGeo, this.matCeilingVault);
          strut.position.set(sx, H - 0.45, zOff);
          seg.add(strut);
        });
      });

      [-4.8, 4.8].forEach((cx) => {
        const conduit = new THREE.Mesh(
          ceilingConduitGeo,
          this.surfaceTrimMats.CEILING,
        );
        conduit.position.set(cx, H - 0.06, 0);
        seg.add(conduit);
      });

      // C. PARED IZQUIERDA (LEFT WALL)
      const leftSlab = new THREE.Mesh(baseSlabGeo, this.matLeftWallPanel);
      leftSlab.rotation.z = Math.PI / 2;
      leftSlab.position.set(-H - 0.25, 0, 0);
      seg.add(leftSlab);

      [-L * 0.33, 0, L * 0.33].forEach((zOff) => {
        const pilaster = new THREE.Mesh(
          leftVerticalPillarGeo,
          this.matBrutalRib,
        );
        pilaster.position.set(-H + 0.12, 0, zOff);
        seg.add(pilaster);

        const vLight = new THREE.Mesh(
          leftLightStripGeo,
          this.surfaceTrimMats.LEFT,
        );
        vLight.position.set(-H + 0.22, 0, zOff);
        seg.add(vLight);
      });

      // D. PARED DERECHA (RIGHT WALL)
      const rightSlab = new THREE.Mesh(baseSlabGeo, this.matRightWallPanel);
      rightSlab.rotation.z = Math.PI / 2;
      rightSlab.position.set(H + 0.25, 0, 0);
      seg.add(rightSlab);

      [-L * 0.24, L * 0.24].forEach((zOff, idx) => {
        const diag = new THREE.Mesh(rightDiagBeamGeo, this.matBrutalRib);
        diag.position.set(H - 0.12, 0, zOff);
        diag.rotation.x = idx === 0 ? 0.52 : -0.52;
        seg.add(diag);
      });

      [-2.2, 2.2].forEach((hy) => {
        const hBand = new THREE.Mesh(
          rightHorizBandGeo,
          this.surfaceTrimMats.RIGHT,
        );
        hBand.position.set(H - 0.05, hy, 0);
        seg.add(hBand);
      });

      // E. 4 STRUCTURAL CHAMFERED CORNERS
      const corners = [
        [-H, -H],
        [H, -H],
        [-H, H],
        [H, H],
      ];
      corners.forEach(([cx, cy]) => {
        const corner = new THREE.Mesh(cornerBevelGeo, this.matBrutalRib);
        corner.position.set(cx, cy, 0);
        corner.rotation.z = Math.PI / 4;
        seg.add(corner);
      });

      seg.position.z = this.nextSegmentZ;
      this.nextSegmentZ -= L;
      this.scene.add(seg);
      this.tunnelSegments.push(seg);
    }
  }

  initSpeedDust() {
    const count = 140;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12.5;
      pos[i * 3 + 2] = -Math.random() * 260;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: PALETTE.CYAN,
      size: 0.18,
      transparent: true,
      opacity: 0.45,
    });
    this.speedDust = new THREE.Points(geo, mat);
    this.scene.add(this.speedDust);
  }

  releaseMesh(mesh) {
    const geometries = new Set();
    mesh.traverse((child) => {
      if (child.geometry && child.geometry !== this.orbGeometry)
        geometries.add(child.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
    this.scene.remove(mesh);
  }

  recycleObstacle(ob) {
    this.scene.remove(ob.mesh);
    const pool = this.obstaclePool[ob.type];
    if (pool && pool.length < 12) pool.push(ob.mesh);
    else this.releaseMesh(ob.mesh);
  }
  recycleCoin(coin) {
    this.scene.remove(coin.mesh);
    if (this.coinPool.length < 64) this.coinPool.push(coin.mesh);
    else this.releaseMesh(coin.mesh);
  }
  clearObjects() {
    this.obstacles.forEach((ob) => this.recycleObstacle(ob));
    this.collectibles.forEach((coin) => this.recycleCoin(coin));
    this.obstacles = [];
    this.collectibles = [];
    this.powerups.forEach((item) => this.recyclePowerup(item));
    this.powerups = [];
    this.magnetTarget = null;
  }

  resetWorld() {
    this.elapsed = 0;
    this.clearObjects();

    this.nextPatternZ = -52;
    this.patternCounter = 0;
    this.lastSafeSurface = "FLOOR";

    while (this.nextPatternZ > -TUNNEL.VISIBLE_AHEAD) this.spawnNextPattern(0);
  }

  spawnSurfaceObstacle(surfaceKey, zPos, type = "BARRIER") {
    const surf = SURFACES[surfaceKey];
    const cached = this.obstaclePool[type]?.pop();
    const group = cached || new THREE.Group();
    group.position.set(surf.basePos.x, surf.basePos.y, zPos);
    group.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      surf.rollAngle,
    );

    let halfW = 5.4;
    let height = 2.4;
    let halfD = 0.9;

    if (!cached) {
      if (type === "BARRIER") {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(10.8, 2.3, 1.5),
          this.matHazardSolid,
        );
        block.position.y = 1.15;
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(11.0, 0.35, 1.6),
          this.matBrutalRib,
        );
        stripe.position.y = 2.1;
        group.add(block, stripe);
      } else if (type === "LASER") {
        const postL = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 3.0, 0.6),
          this.matBrutalRib,
        );
        postL.position.set(-5.2, 1.5, 0);
        const postR = postL.clone();
        postR.position.set(5.2, 1.5, 0);

        const beam1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 10.4, 8),
          this.matLaserBeam,
        );
        beam1.rotation.z = Math.PI / 2;
        beam1.position.y = 1.1;
        const beam2 = beam1.clone();
        beam2.position.y = 2.2;

        group.add(postL, postR, beam1, beam2);
        height = 2.7;
        halfD = 0.6;
      } else if (type === "HAZARD_ZONE") {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(11.2, 0.35, 7.5),
          this.matHazardZone,
        );
        pad.position.y = 0.18;
        group.add(pad);
        height = 1.1;
        halfD = 3.6;
      } else if (type === "MOVING") {
        const crusher = new THREE.Mesh(
          new THREE.BoxGeometry(4.4, 2.6, 1.6),
          this.matHazardSolid,
        );
        crusher.position.y = 1.3;
        group.add(crusher);
        halfW = 2.3;
        height = 2.6;
      }

      if (type !== "MOVING") {
        const warning = new THREE.Mesh(
          new THREE.BoxGeometry(10.6, 0.055, 0.065),
          this.matLaserBeam,
        );
        warning.position.set(0, 0.45, 1);
        group.add(warning);
      }
    }
    ({ halfW, height, halfD } = {
      BARRIER: { halfW: 5.4, height: 2.4, halfD: 0.9 },
      LASER: { halfW: 5.4, height: 2.7, halfD: 0.6 },
      HAZARD_ZONE: { halfW: 5.4, height: 1.1, halfD: 3.6 },
      MOVING: { halfW: 2.3, height: 2.6, halfD: 0.9 },
    }[type]);
    this.scene.add(group);
    this.obstacles.push({
      type,
      surfaceKey,
      mesh: group,
      halfW,
      height,
      halfD,
      phase: this.rng.range(0, Math.PI * 2),
      localX: 0,
    });
  }

  spawnRotatingBlades(zPos) {
    const group = new THREE.Group();
    group.position.set(0, 0, zPos);

    const hub = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.3, 0),
      this.matBrutalRib,
    );
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(13.2, 1.25, 1.25),
      this.matHazardSolid,
    );
    group.add(hub, arm);

    this.scene.add(group);
    this.obstacles.push({
      type: "ROTATING",
      surfaceKey: "ALL",
      mesh: group,
      rotSpeed: (this.rng.next() > 0.5 ? 1 : -1) * 1.65,
      halfD: 0.9,
    });
  }

  recyclePowerup(item) {
    this.scene.remove(item.mesh);
    const pool = this.powerupPool[item.type];
    if (pool.length < 8) pool.push(item.mesh);
    else this.releaseMesh(item.mesh);
  }
  spawnPowerup(type, surfaceKey, z) {
    const surface = SURFACES[surfaceKey],
      mesh =
        this.powerupPool[type].pop() ||
        createItemVisual(type, this.itemMaterials);
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(
      surface.basePos.x + surface.normal.x * 1.15,
      surface.basePos.y + surface.normal.y * 1.15,
      z,
    );
    this.scene.add(mesh);
    this.powerups.push({
      type,
      surfaceKey,
      mesh,
      base: mesh.position.clone(),
      collected: false,
    });
    return this.powerups.at(-1);
  }
  spawnEnergyTrail(surfaceKey, startZ, count = 4, spacing = 4.2, value = 1) {
    const surf = SURFACES[surfaceKey];
    const orbGeo = this.orbGeometry;
    this.matBonusCoin ??= new THREE.MeshStandardMaterial({
      color: 0xe797ff,
      emissive: 0xb14ee3,
      emissiveIntensity: 0.6,
      metalness: 0.25,
      roughness: 0.2,
    });

    for (let i = 0; i < count; i++) {
      const cached = this.coinPool.pop();
      const mesh = cached || new THREE.Group();
      if (!cached) {
        mesh.add(new THREE.Mesh(orbGeo, this.matEnergyOrb));
        const mint = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.52, 0.04),
          this.matEnergyOrb,
        );
        mint.position.z = 0.085;
        mint.rotation.z = -0.32;
        mesh.add(mint);
      }
      mesh.rotation.set(0, 0, 0);
      mesh.scale.setScalar(value > 1 ? 1.2 : 1);
      mesh.children.forEach((child) => {
        child.material = value > 1 ? this.matBonusCoin : this.matEnergyOrb;
      });
      const pos = new THREE.Vector3(
        surf.basePos.x + surf.normal.x * 1.05,
        surf.basePos.y + surf.normal.y * 1.05,
        startZ - i * spacing,
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.collectibles.push({
        mesh,
        surfaceKey,
        collected: false,
        value,
      });
    }
  }

  /**
   * Solvability-Validated Procedural Pattern Generator:
   * Guarantees at least 1 surface is always 100% open and places guiding energy orbs on a safe surface.
   */
  spawnNextPattern(distance) {
    if (this.patternCounter % 4 === 3) {
      this.spawnEnergyTrail(
        this.lastSafeSurface || "FLOOR",
        this.nextPatternZ + 12,
        8,
        7,
      );
      this.nextPatternZ -= 100;
      this.patternCounter++;
      return;
    }
    const phrase =
      this.patternCounter < 3
        ? RUN_PHRASES[this.patternCounter]
        : this.rng.pick(RUN_PHRASES);
    const start = this.nextPatternZ;
    const predictedDistance = distance + Math.max(0, -start) * 0.45;
    const zone = zoneForDistance(predictedDistance);
    const spacing =
      zone.id === "industrial" ? 52 : zone.id === "reactor" ? 56 : 60;
    const blockedCount =
      zone.id === "industrial" ? 1 : zone.id === "reactor" ? 2 : 3;
    let rowZ = start;
    phrase.route.forEach((safe, beat) => {
      const z = rowZ;
      rowZ -= spacing * (phrase.rhythm?.[beat] || 1);
      const branch =
        phrase.fork && predictedDistance > 300 && beat === 1
          ? SURFACE_KEYS[(SURFACE_KEYS.indexOf(safe) + 2) % 4]
          : null;
      const candidates = SURFACE_KEYS.filter(
        (key) => key !== safe && key !== branch,
      );
      const rowBlockedCount = Math.min(blockedCount, candidates.length);
      // Rotate blocked faces per beat while retaining one verified safe coin path.
      for (let j = 0; j < rowBlockedCount; j++) {
        const face = candidates[(j + beat) % candidates.length];
        const kind =
          zone.id === "fracture" && beat === 1
            ? "MOVING"
            : phrase.hazards[beat];
        this.spawnSurfaceObstacle(face, z, kind);
        const ob = this.obstacles[this.obstacles.length - 1];
        ob.phrase = phrase.name;
        ob.safeSurface = safe;
        ob.safeSurfaces = branch ? [safe, branch] : [safe];
      }
      this.spawnEnergyTrail(safe, z + 18, 4, 4);
      if (this.patternCounter === 0 && beat === 0)
        this.spawnPowerup("magnet", safe, z + 25);
      else if (this.rng.next() < 0.16)
        this.spawnPowerup(this.rng.pick(ITEM_TYPES), safe, z + 27);
      if (branch) this.spawnEnergyTrail(branch, z + 18, 4, 4);
      if (predictedDistance > 120 && beat === 1)
        this.spawnEnergyTrail(
          candidates[beat % candidates.length],
          z + 34,
          3,
          4,
          3,
        );
      this.lastSafeSurface = safe;
    });
    this.patternCounter++;
    this.nextPatternZ = rowZ - 24;
  }

  update(dt, speed, distance) {
    const moveZ = speed * dt;

    // 0. Update Reactive Architectural Surface Lighting
    if (this.shiftPulseTimer > 0) {
      this.shiftPulseTimer = Math.max(0, this.shiftPulseTimer - dt);
    }
    const pulseBoost = this.shiftPulseTimer * 2.2;
    SURFACE_KEYS.forEach((k) => {
      const mat = this.surfaceTrimMats[k];
      const isCurrent = k === this.activeSurfaceKey;
      const targetIntensity = isCurrent ? 0.95 + pulseBoost : 0.24;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        targetIntensity,
        Math.min(1, dt * 10),
      );
    });

    // 1. Recycle Pooled Tunnel Segments
    let furthestZ = 0;
    for (let i = 0; i < this.tunnelSegments.length; i++) {
      if (this.tunnelSegments[i].position.z < furthestZ) {
        furthestZ = this.tunnelSegments[i].position.z;
      }
    }

    for (let i = 0; i < this.tunnelSegments.length; i++) {
      const seg = this.tunnelSegments[i];
      seg.position.z += moveZ;
      if (seg.position.z > TUNNEL.DESPAWN_Z) {
        seg.position.z = furthestZ - TUNNEL.SEGMENT_LENGTH;
        furthestZ = seg.position.z;
      }
    }

    // 2. Update Speed Dust
    const dustAttr = this.speedDust.geometry.attributes.position;
    for (let i = 0; i < dustAttr.count; i++) {
      let z = dustAttr.getZ(i) + moveZ * 1.35;
      if (z > 12) z = -250;
      dustAttr.setZ(i, z);
    }
    dustAttr.needsUpdate = true;

    // 3. Advance & Animate Obstacles
    this.elapsed = (this.elapsed || 0) + dt;
    const nowSec = this.elapsed;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;

      if (obs.type === "ROTATING") {
        obs.mesh.rotation.z += obs.rotSpeed * dt;
      } else if (obs.type === "MOVING") {
        const surf = SURFACES[obs.surfaceKey];
        obs.localX = Math.sin(nowSec * 3.0 + obs.phase) * 3.4;
        obs.mesh.position.x = surf.basePos.x + surf.right.x * obs.localX;
        obs.mesh.position.y = surf.basePos.y + surf.right.y * obs.localX;
      }

      if (obs.mesh.position.z > TUNNEL.DESPAWN_Z) {
        this.recycleObstacle(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // 4. Advance & Rotate Energy Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.mesh.position.z += moveZ;
      if (
        this.magnetTarget &&
        Math.abs(c.mesh.position.z) < 16 &&
        c.mesh.position.distanceToSquared(this.magnetTarget) <
          (this.magnetRadius || 8) ** 2
      )
        c.mesh.position.lerp(this.magnetTarget, 1 - Math.exp(-dt * 12));
      c.mesh.rotation.y += dt * 3.5;
      c.mesh.rotation.x += dt * 2.0;

      if (c.mesh.position.z > TUNNEL.DESPAWN_Z || c.collected) {
        this.recycleCoin(c);
        this.collectibles.splice(i, 1);
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const item = this.powerups[i];
      item.mesh.position.z += moveZ;
      item.mesh.rotation.y += dt * 1.4;
      if (item.collected || item.mesh.position.z > TUNNEL.DESPAWN_Z) {
        this.recyclePowerup(item);
        this.powerups.splice(i, 1);
      }
    }
    // 5. Advance Pattern Horizon
    this.nextPatternZ += moveZ;
    while (this.nextPatternZ > -TUNNEL.VISIBLE_AHEAD) {
      this.spawnNextPattern(distance);
    }
  }

  checkCollisions(
    player,
    gravitySys,
    onOrbPicked,
    onObstacleHit,
    onPowerupPicked = () => {},
  ) {
    const playerPos = player.root.position;

    // 1. Collectibles Check
    for (let i = 0; i < this.collectibles.length; i++) {
      const c = this.collectibles[i];
      if (!c.collected && Math.abs(c.mesh.position.z) < 1.8) {
        const dx = c.mesh.position.x - playerPos.x;
        const dy = c.mesh.position.y - playerPos.y;
        if (dx * dx + dy * dy < 2.4) {
          c.collected = true;
          onOrbPicked(c.mesh.position, c.value || 1);
        }
      }
    }

    for (const item of this.powerups || []) {
      if (
        !item.collected &&
        Math.abs(item.mesh.position.z) < 1.2 &&
        item.mesh.position.distanceToSquared(playerPos) < 3
      ) {
        item.collected = true;
        onPowerupPicked(item.type);
      }
    }
    // Skip hazard collision if emergency shield is active
    if (player.shieldTimer > 0) return;

    // Test the body along its actual orientation, including every transfer step.
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(
      gravitySys.currentQuat,
    );
    for (const obs of this.obstacles) {
      const contact = obstacleContact(obs, playerPos, normal);
      if (contact) {
        obs.lastContact = contact;
        onObstacleHit(obs);
        return;
      }
    }
  }
}
