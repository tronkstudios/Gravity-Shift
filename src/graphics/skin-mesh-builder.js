import * as THREE from "three";

export class SkinMeshBuilder {
  static disposeRig(rig) {
    if (!rig?.root) return;
    const geometries = new Set(),
      materials = new Set();
    rig.root.traverse((child) => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material)
        (Array.isArray(child.material)
          ? child.material
          : [child.material]
        ).forEach((mat) => materials.add(mat));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }

  static buildCharacterRig(skinConfig) {
    const rig = {
      root: new THREE.Group(),
      torso: new THREE.Group(),
      head: new THREE.Group(),
      leftArm: new THREE.Group(),
      rightArm: new THREE.Group(),
      leftLeg: new THREE.Group(),
      rightLeg: new THREE.Group(),
      animExtras: [],
    };

    const matPrimary = new THREE.MeshStandardMaterial({
      color: skinConfig.primaryColor,
      metalness: skinConfig.metalness,
      roughness: skinConfig.roughness,
      transparent: !!skinConfig.transparent,
      opacity: skinConfig.opacity || 1.0,
    });
    const matSecondary = new THREE.MeshStandardMaterial({
      color: skinConfig.secondaryColor,
      metalness: Math.min(0.95, skinConfig.metalness + 0.1),
      roughness: Math.max(0.1, skinConfig.roughness),
      transparent: !!skinConfig.transparent,
      opacity: skinConfig.opacity
        ? Math.min(1, skinConfig.opacity + 0.15)
        : 1.0,
    });
    const matGlow = new THREE.MeshBasicMaterial({
      color: skinConfig.glowColor,
    });
    const matAccentGold = new THREE.MeshStandardMaterial({
      color: 0xf5d061,
      metalness: 0.92,
      roughness: 0.12,
    });

    rig.materials = { matPrimary, matSecondary, matGlow };

    rig.torso.position.y = 1.05;
    rig.root.add(rig.torso);

    rig.head.position.set(0, 0.58, 0);
    rig.torso.add(rig.head);

    const isHeavy = skinConfig.id === "titan";
    const shoulderX = isHeavy ? 0.46 : 0.38;
    rig.leftArm.position.set(-shoulderX, 0.34, 0);
    rig.rightArm.position.set(shoulderX, 0.34, 0);
    rig.torso.add(rig.leftArm);
    rig.torso.add(rig.rightArm);

    const hipX = isHeavy ? 0.2 : 0.16;
    rig.leftLeg.position.set(-hipX, -0.38, 0);
    rig.rightLeg.position.set(hipX, -0.38, 0);
    rig.torso.add(rig.leftLeg);
    rig.torso.add(rig.rightLeg);

    SkinMeshBuilder.populateBaseBody(
      rig,
      skinConfig,
      matPrimary,
      matSecondary,
      matGlow,
    );
    SkinMeshBuilder.populateSkinSpecificGeometry(
      rig,
      skinConfig,
      matPrimary,
      matSecondary,
      matGlow,
      matAccentGold,
    );

    return rig;
  }

  static populateBaseBody(rig, skin, matPrimary, matSecondary, matGlow) {
    const id = skin.id;

    if (id === "titan") {
      const chest = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.36, 0.72, 8),
        matPrimary,
      );
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const reactor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.42, 8),
        matGlow,
      );
      reactor.rotation.x = Math.PI / 2;
      reactor.position.set(0, 0.12, 0.02);
      rig.torso.add(reactor);
    } else if (id === "chrome" || id === "nebula") {
      const chest = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.22, 0.68, 16),
        matPrimary,
      );
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const belt = new THREE.Mesh(
        new THREE.TorusGeometry(0.23, 0.04, 8, 20),
        matGlow,
      );
      belt.rotation.x = Math.PI / 2;
      belt.position.y = -0.18;
      rig.torso.add(belt);
    } else if (id === "cyber") {
      const coreRibs = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.34, 0.28),
        matPrimary,
      );
      coreRibs.position.y = 0.2;
      rig.torso.add(coreRibs);

      for (let i = 0; i < 4; i++) {
        const vert = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.09, 0.34),
          matGlow,
        );
        vert.position.set(0, -0.22 + i * 0.14, 0);
        rig.torso.add(vert);
      }
    } else {
      const chest = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.66, 0.33),
        matPrimary,
      );
      chest.position.y = 0.08;
      rig.torso.add(chest);

      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.52, 0.36),
        matGlow,
      );
      spine.position.y = 0.08;
      rig.torso.add(spine);
    }

    const pelvis = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.2, 0.27),
      matSecondary,
    );
    pelvis.position.y = -0.32;
    rig.torso.add(pelvis);

    const armWidth = id === "titan" ? 0.22 : id === "chrome" ? 0.14 : 0.15;
    const legWidth = id === "titan" ? 0.26 : 0.19;
    const useRoundLimbs =
      id === "chrome" || id === "nebula" || id === "spectre";

    SkinMeshBuilder.populateLimb(
      rig.leftArm,
      armWidth,
      0.58,
      armWidth,
      useRoundLimbs,
      matPrimary,
      matSecondary,
      matGlow,
    );
    SkinMeshBuilder.populateLimb(
      rig.rightArm,
      armWidth,
      0.58,
      armWidth,
      useRoundLimbs,
      matPrimary,
      matSecondary,
      matGlow,
    );
    SkinMeshBuilder.populateLimb(
      rig.leftLeg,
      legWidth,
      0.72,
      legWidth,
      useRoundLimbs,
      matPrimary,
      matSecondary,
      matGlow,
    );
    SkinMeshBuilder.populateLimb(
      rig.rightLeg,
      legWidth,
      0.72,
      legWidth,
      useRoundLimbs,
      matPrimary,
      matSecondary,
      matGlow,
    );
  }

  static populateLimb(
    group,
    w,
    h,
    d,
    isRound,
    matPrimary,
    matSecondary,
    matGlow,
  ) {
    const upperGeo = isRound
      ? new THREE.CylinderGeometry(w * 0.5, w * 0.45, h * 0.52, 12)
      : new THREE.BoxGeometry(w, h * 0.52, d);
    const upper = new THREE.Mesh(upperGeo, matSecondary);
    upper.position.y = -h * 0.25;
    group.add(upper);

    const jointGeo = isRound
      ? new THREE.SphereGeometry(w * 0.56, 10, 10)
      : new THREE.BoxGeometry(w * 1.08, h * 0.12, d * 1.08);
    const joint = new THREE.Mesh(jointGeo, matGlow);
    joint.position.y = -h * 0.5;
    group.add(joint);

    const lowerGeo = isRound
      ? new THREE.CylinderGeometry(w * 0.46, w * 0.38, h * 0.5, 12)
      : new THREE.BoxGeometry(w * 0.92, h * 0.5, d * 0.92);
    const lower = new THREE.Mesh(lowerGeo, matPrimary);
    lower.position.y = -h * 0.75;
    group.add(lower);
  }

  static populateSkinSpecificGeometry(
    rig,
    skin,
    matPrimary,
    matSecondary,
    matGlow,
    matGold,
  ) {
    const id = skin.id;

    switch (id) {
      case "core": {
        const helm = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.38, 0.42),
          matPrimary,
        );
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.14, 0.32),
          matGlow,
        );
        visor.position.set(0, 0.03, -0.08);
        rig.head.add(helm, visor);

        [-0.14, 0.14].forEach((x) => {
          const thruster = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.09, 0.36, 8),
            matSecondary,
          );
          thruster.position.set(x, 0.12, 0.22);
          thruster.rotation.x = 0.2;
          const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.07, 0.08, 8),
            matGlow,
          );
          nozzle.position.y = -0.2;
          thruster.add(nozzle);
          rig.torso.add(thruster);
        });
        break;
      }

      case "phantom": {
        const hood = new THREE.Mesh(
          new THREE.ConeGeometry(0.31, 0.48, 4),
          matPrimary,
        );
        hood.rotation.y = Math.PI / 4;
        hood.position.y = 0.06;
        const eyeSlit = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.06, 0.3),
          matGlow,
        );
        eyeSlit.position.set(0, -0.02, -0.08);
        rig.head.add(hood, eyeSlit);

        [-0.18, 0.18].forEach((x) => {
          const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.65, 0.28),
            matSecondary,
          );
          fin.position.set(x, -0.05, 0.26);
          fin.rotation.x = 0.28;
          rig.torso.add(fin);
        });

        [rig.leftArm, rig.rightArm].forEach((arm, idx) => {
          const sign = idx === 0 ? -1 : 1;
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.42, 0.12),
            matGlow,
          );
          blade.position.set(sign * 0.11, -0.38, -0.08);
          arm.add(blade);
        });
        break;
      }

      case "titan": {
        const dome = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.26, 0.36, 8),
          matPrimary,
        );
        const slit = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.08, 0.34),
          matGlow,
        );
        slit.position.set(0, 0.02, -0.08);
        rig.head.add(dome, slit);

        [rig.leftArm, rig.rightArm].forEach((arm, idx) => {
          const sign = idx === 0 ? -1 : 1;
          const pauldron = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.32, 0.38),
            matPrimary,
          );
          pauldron.position.set(sign * 0.08, 0.04, 0);
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.06, 0.4),
            matGlow,
          );
          trim.position.y = 0.08;
          pauldron.add(trim);
          arm.add(pauldron);
        });

        const backPack = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.5, 0.28),
          matSecondary,
        );
        backPack.position.set(0, 0.12, 0.26);
        rig.torso.add(backPack);
        break;
      }

      case "spectre": {
        const headPrism = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.24, 0),
          matPrimary,
        );
        headPrism.scale.set(0.9, 1.35, 0.9);
        rig.head.add(headPrism);

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.025, 8, 24),
          matGlow,
        );
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.3;
        rig.head.add(halo);

        rig.animExtras.push({
          mesh: halo,
          update: (t) => {
            halo.position.y = 0.28 + Math.sin(t * 4) * 0.04;
            halo.rotation.z = t * 2;
          },
        });
        break;
      }

      case "volt": {
        const helm = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.36, 0.38),
          matPrimary,
        );
        rig.head.add(helm);
        [-0.14, 0.14].forEach((x) => {
          const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.32, 4),
            matGlow,
          );
          horn.position.set(x, 0.28, -0.05);
          horn.rotation.z = x > 0 ? -0.35 : 0.35;
          rig.head.add(horn);
        });

        [
          [-0.22, 0.28],
          [0.22, 0.28],
          [-0.22, -0.04],
          [0.22, -0.04],
        ].forEach(([cx, cy]) => {
          const coil = new THREE.Group();
          const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8),
            matSecondary,
          );
          const ring1 = new THREE.Mesh(
            new THREE.TorusGeometry(0.09, 0.02, 6, 12),
            matGlow,
          );
          ring1.rotation.x = Math.PI / 2;
          ring1.position.y = 0.06;
          const ring2 = ring1.clone();
          ring2.position.y = 0.14;
          coil.add(rod, ring1, ring2);
          coil.position.set(cx, cy, 0.22);
          coil.rotation.x = 0.45;
          rig.torso.add(coil);
        });
        break;
      }

      case "sentinel": {
        const helm = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.38, 0.4),
          matPrimary,
        );
        const crest = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.16, 0.46),
          matGlow,
        );
        crest.position.set(0, 0.22, 0);
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.12, 0.26),
          matGlow,
        );
        visor.position.set(0, 0.02, -0.1);
        rig.head.add(helm, crest, visor);

        const shield = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.52, 0.34),
          matGlow,
        );
        shield.position.set(-0.14, -0.36, -0.04);
        const shieldFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.56, 0.12),
          matSecondary,
        );
        shieldFrame.position.set(-0.13, -0.36, -0.04);
        rig.leftArm.add(shield, shieldFrame);
        break;
      }

      case "glitch": {
        const h1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.16, 0.34),
          matPrimary,
        );
        h1.position.set(0.03, 0.1, 0);
        const h2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.16, 0.34),
          matGlow,
        );
        h2.position.set(-0.04, -0.06, -0.03);
        rig.head.add(h1, h2);

        const glitchGroup = new THREE.Group();
        rig.torso.add(glitchGroup);
        for (let i = 0; i < 8; i++) {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.11, 0.11),
            i % 2 === 0 ? matGlow : matPrimary,
          );
          const angle = (i / 8) * Math.PI * 2;
          cube.position.set(
            Math.cos(angle) * 0.48,
            (i - 3.5) * 0.14,
            Math.sin(angle) * 0.38,
          );
          glitchGroup.add(cube);
        }
        rig.animExtras.push({
          mesh: glitchGroup,
          update: (t) => {
            glitchGroup.rotation.y = t * 2.2;
            glitchGroup.children.forEach((c, idx) => {
              c.position.x = Math.cos(t * 3 + idx) * (0.44 + (idx % 2) * 0.08);
            });
          },
        });
        break;
      }

      case "nebula": {
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 16),
          matGlow,
        );
        const collar = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.045, 8, 20),
          matPrimary,
        );
        collar.rotation.x = Math.PI / 2;
        collar.position.y = -0.14;
        rig.head.add(dome, collar);

        const ringA = new THREE.Mesh(
          new THREE.TorusGeometry(0.56, 0.022, 8, 32),
          matGlow,
        );
        ringA.rotation.x = 1.1;
        ringA.rotation.y = 0.4;
        ringA.position.y = 0.08;
        rig.torso.add(ringA);

        const ringB = new THREE.Mesh(
          new THREE.TorusGeometry(0.46, 0.018, 8, 32),
          matPrimary,
        );
        ringB.rotation.x = -1.1;
        ringB.rotation.y = -0.4;
        ringB.position.y = 0.08;
        rig.torso.add(ringB);

        rig.animExtras.push({
          mesh: ringA,
          update: (t) => {
            ringA.rotation.z = t * 1.8;
            ringB.rotation.z = -t * 2.4;
          },
        });
        break;
      }

      case "overdrive": {
        const aeroHelm = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.56, 6),
          matPrimary,
        );
        aeroHelm.rotation.x = -Math.PI / 2 + 0.35;
        aeroHelm.position.set(0, 0.05, 0.08);
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.1, 0.3),
          matGlow,
        );
        visor.position.set(0, 0.0, -0.12);
        rig.head.add(aeroHelm, visor);

        [-1, 1].forEach((sign) => {
          const wing = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.14, 0.05),
            matPrimary,
          );
          wing.position.set(sign * 0.38, 0.18, 0.22);
          wing.rotation.z = -sign * 0.35;
          wing.rotation.y = sign * 0.25;
          const tip = new THREE.Mesh(
            new THREE.BoxGeometry(0.58, 0.04, 0.06),
            matGlow,
          );
          tip.position.y = -0.06;
          wing.add(tip);
          rig.torso.add(wing);
        });
        break;
      }

      case "reaper": {
        const skull = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.36, 0.36),
          matPrimary,
        );
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.08, 0.28),
          matGlow,
        );
        visor.position.set(0, 0.02, -0.09);
        rig.head.add(skull, visor);

        [-0.15, 0.15].forEach((x) => {
          const horn = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.36, 5),
            matSecondary,
          );
          horn.position.set(x, 0.3, 0.04);
          horn.rotation.x = -0.35;
          rig.head.add(horn);
        });

        [-1, 1].forEach((sign) => {
          const scytheArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.72, 0.08),
            matSecondary,
          );
          scytheArm.position.set(sign * 0.26, 0.28, 0.24);
          scytheArm.rotation.z = -sign * 0.55;
          const scytheBlade = new THREE.Mesh(
            new THREE.ConeGeometry(0.14, 0.58, 3),
            matGlow,
          );
          scytheBlade.position.set(sign * 0.18, 0.3, 0);
          scytheBlade.rotation.z = -sign * 1.25;
          scytheArm.add(scytheBlade);
          rig.torso.add(scytheArm);
        });
        break;
      }

      case "chrome": {
        const sphereHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 20, 20),
          matPrimary,
        );
        const cyclops = new THREE.Mesh(
          new THREE.CylinderGeometry(0.225, 0.225, 0.07, 20),
          matGlow,
        );
        cyclops.position.y = 0.02;
        rig.head.add(sphereHead, cyclops);

        [-0.36, 0.36].forEach((x) => {
          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 16, 16),
            matPrimary,
          );
          orb.position.set(x, 0.36, 0);
          rig.torso.add(orb);
        });
        break;
      }

      case "void": {
        const monolith = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.46, 0.32),
          matPrimary,
        );
        const edgeFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.48, 0.34),
          new THREE.MeshBasicMaterial({
            color: skin.glowColor,
            wireframe: true,
          }),
        );
        rig.head.add(monolith, edgeFrame);

        const voidCore = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.18, 0),
          matGlow,
        );
        voidCore.position.set(0, 0.15, 0.32);
        rig.torso.add(voidCore);

        rig.animExtras.push({
          mesh: voidCore,
          update: (t) => {
            voidCore.rotation.y = t * 3.0;
            voidCore.rotation.x = t * 2.0;
          },
        });
        break;
      }

      case "cyber": {
        const headBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.34, 0.36),
          matPrimary,
        );
        const eyeBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.08, 0.28),
          matGlow,
        );
        eyeBar.position.set(0, 0.04, -0.08);
        rig.head.add(headBox, eyeBar);

        [-0.13, 0.13].forEach((x) => {
          const antenna = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.28, 0.08),
            matGlow,
          );
          antenna.position.set(x, 0.24, 0.06);
          antenna.rotation.x = -0.3;
          rig.head.add(antenna);
        });
        break;
      }

      case "frost": {
        const helm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 0.38, 6),
          matPrimary,
        );
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.12, 0.3),
          matGlow,
        );
        visor.position.set(0, 0.02, -0.08);
        rig.head.add(helm, visor);

        [-1, 1].forEach((sign) => {
          for (let k = 0; k < 2; k++) {
            const crystal = new THREE.Mesh(
              new THREE.ConeGeometry(0.08, 0.38 + k * 0.1, 5),
              matGlow,
            );
            crystal.position.set(
              sign * (0.28 + k * 0.08),
              0.38,
              0.12 + k * 0.08,
            );
            crystal.rotation.z = -sign * (0.4 + k * 0.2);
            rig.torso.add(crystal);
          }
        });
        break;
      }

      case "omega": {
        const helm = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.24, 1),
          matPrimary,
        );
        const crown = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.03, 6, 6),
          matGlow,
        );
        crown.rotation.x = Math.PI / 2;
        crown.position.y = 0.2;
        rig.head.add(helm, crown);

        const wingsGroup = new THREE.Group();
        wingsGroup.position.set(0, 0.18, 0.26);
        rig.torso.add(wingsGroup);

        for (let i = 0; i < 3; i++) {
          [-1, 1].forEach((sign) => {
            const blade = new THREE.Mesh(
              new THREE.BoxGeometry(0.58 - i * 0.08, 0.09, 0.04),
              matGlow,
            );
            blade.position.set(sign * (0.36 + i * 0.04), 0.22 - i * 0.2, 0);
            blade.rotation.z = sign * (0.35 - i * 0.28);
            wingsGroup.add(blade);
          });
        }

        rig.animExtras.push({
          mesh: wingsGroup,
          update: (t) => {
            wingsGroup.position.y = 0.18 + Math.sin(t * 3.5) * 0.05;
            wingsGroup.children.forEach((w, idx) => {
              const sign = idx % 2 === 0 ? -1 : 1;
              w.rotation.y = Math.sin(t * 4 + idx) * 0.18 * sign;
            });
          },
        });
        break;
      }

      case "aether_valkyrie": {
        const helm = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.38, 0.38),
          matPrimary,
        );
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.12, 0.3),
          matGlow,
        );
        visor.position.set(0, 0.02, -0.08);
        rig.head.add(helm, visor);

        [-1, 1].forEach((sign) => {
          const earWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.34, 0.22),
            matGold,
          );
          earWing.position.set(sign * 0.2, 0.14, 0.04);
          earWing.rotation.x = 0.45;
          earWing.rotation.z = -sign * 0.22;
          rig.head.add(earWing);
        });

        const solarHalo = new THREE.Group();
        solarHalo.position.set(0, 0.26, 0.3);
        rig.torso.add(solarHalo);

        const haloRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.46, 0.03, 8, 24),
          matGold,
        );
        solarHalo.add(haloRing);

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const ray = new THREE.Mesh(
            new THREE.ConeGeometry(0.055, 0.28, 4),
            i % 2 === 0 ? matGlow : matGold,
          );
          ray.position.set(Math.cos(angle) * 0.58, Math.sin(angle) * 0.58, 0);
          ray.rotation.z = angle - Math.PI / 2;
          solarHalo.add(ray);
        }

        const droneGroup = new THREE.Group();
        rig.torso.add(droneGroup);
        [-0.62, 0.62].forEach((x) => {
          const drone = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.48, 6),
            matGlow,
          );
          drone.rotation.x = -Math.PI / 2;
          drone.position.set(x, 0.36, 0.1);
          droneGroup.add(drone);
        });

        rig.animExtras.push({
          mesh: solarHalo,
          update: (t) => {
            solarHalo.rotation.z = t * 1.4;
            droneGroup.position.y = Math.sin(t * 4.2) * 0.06;
          },
        });
        break;
      }
    }
  }
}
