import * as THREE from "three";

function roundedPlate(w, h, d, r = 0.018) {
  const s = new THREE.Shape(),
    x = -w / 2,
    y = -h / 2;
  r = Math.min(r, w / 3, h / 3);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 3,
  });
  g.translate(0, 0, -d / 2);
  return g;
}
function visorGeometry() {
  const vertices = [],
    indices = [];
  const cols = 16;
  for (let row = 0; row < 2; row++)
    for (let i = 0; i <= cols; i++) {
      const a = -1.12 + (i / cols) * 2.24;
      vertices.push(
        Math.sin(a) * 0.129,
        0.025 + (row ? -0.038 : 0.038),
        -Math.cos(a) * 0.126,
      );
    }
  for (let i = 0; i < cols; i++) {
    const a = i,
      b = i + cols + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Fitted hard-surface suit; its frames follow anatomical bone pairs, not bind-pose offsets. */
export function addRunnerSuit(rig, skin) {
  const heavy = ["titan", "sentinel", "omega"].includes(skin.id),
    stealth = ["phantom", "spectre", "reaper", "void"].includes(skin.id),
    racer = ["volt", "overdrive", "cyber"].includes(skin.id),
    celestial = ["nebula", "frost", "aether_valkyrie"].includes(skin.id);
  rig.designFamily = heavy
    ? "heavy"
    : stealth
      ? "stealth"
      : racer
        ? "racer"
        : celestial
          ? "celestial"
          : "technical";
  const {
    matPrimary: armor,
    matSecondary: trim,
    matGlow: light,
  } = rig.materials;
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x111c26,
    roughness: 0.94,
    metalness: 0.03,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x07121c,
    roughness: 0.25,
    metalness: 0.45,
    side: THREE.DoubleSide,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0b1118,
    roughness: 1,
  });
  const suit = new THREE.Group();
  suit.name = "fitted-runner-suit";
  rig.root.add(suit);
  const links = [],
    frames = {};
  const mesh = (parent, geometry, material, pos = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...pos);
    parent.add(m);
    return m;
  };
  const plate = (parent, w, h, d, material, pos) =>
    mesh(parent, roundedPlate(w, h, d), material, pos);
  const frame = (name, start, end) => {
    const group = new THREE.Group();
    group.name = name;
    suit.add(group);
    links.push({ group, start, end });
    frames[name] = group;
    return group;
  };
  const bulk = heavy ? 1.16 : stealth ? 0.93 : 1;
  const chest = frame("carapace", "torso", "chest");
  const profile = [
    new THREE.Vector2(0.105, 0),
    new THREE.Vector2(0.12, 0.055),
    new THREE.Vector2(0.166 * bulk, 0.225),
    new THREE.Vector2(0.155 * bulk, 0.285),
    new THREE.Vector2(0.115, 0.315),
  ];
  const shell = mesh(
    chest,
    new THREE.LatheGeometry(profile, 20),
    armor,
    [0, 0.008, 0],
  );
  shell.scale.z = 0.69;
  // Front has a sternum inset; back has a compact spine battery, rather than floating slabs.
  plate(chest, 0.13, 0.16, 0.023, trim, [0, 0.19, -0.118]);
  plate(chest, 0.014, 0.09, 0.009, light, [0, 0.19, -0.135]);
  plate(chest, 0.12, 0.205, 0.045, trim, [0, 0.165, 0.11]);
  for (const sign of [-1, 1]) {
    plate(chest, 0.028, 0.15, 0.016, armor, [sign * 0.078, 0.165, 0.12]);
    plate(chest, 0.009, 0.065, 0.007, light, [sign * 0.078, 0.19, 0.133]);
  }
  const belt = mesh(
    chest,
    new THREE.CylinderGeometry(0.12, 0.115, 0.052, 18),
    trim,
    [0, 0.022, 0],
  );
  belt.scale.z = 0.72;
  plate(chest, 0.042, 0.033, 0.015, armor, [0, 0.025, -0.095]);
  const collar = frame("collar", "neck", "head");
  const collarRing = mesh(
    collar,
    new THREE.CylinderGeometry(0.078, 0.094, 0.045, 16),
    fabric,
    [0, 0.005, 0],
  );
  collarRing.name = "neck-seal";
  for (const side of ["left", "right"]) {
    const arm = frame(side + "-upper-arm", side + "Arm", side + "Elbow");
    const shoulder = mesh(
      arm,
      new THREE.CylinderGeometry(0.063 * bulk, 0.072 * bulk, 0.105, 12),
      armor,
      [0, 0.055, 0],
    );
    shoulder.scale.z = 0.85;
    const sleeve = mesh(
      arm,
      new THREE.CylinderGeometry(0.047, 0.058, 0.12, 12),
      trim,
      [0, 0.16, 0],
    );
    sleeve.scale.z = 0.9;
    plate(arm, 0.012, 0.055, 0.008, light, [0, 0.075, 0.061]);
    const forearm = frame(side + "-forearm", side + "Elbow", side + "Hand");
    mesh(forearm, new THREE.SphereGeometry(0.052, 12, 8), fabric);
    const bracer = mesh(
      forearm,
      new THREE.CylinderGeometry(0.045, 0.057, 0.145, 12),
      armor,
      [0, 0.115, 0],
    );
    bracer.scale.z = 0.85;
    plate(forearm, 0.038, 0.08, 0.012, trim, [0, 0.11, -0.05]);
    const thigh = frame(side + "-thigh", side + "Leg", side + "Knee");
    const thighShell = mesh(
      thigh,
      new THREE.CylinderGeometry(0.062, 0.078, 0.19, 14),
      trim,
      [0, 0.115, 0],
    );
    thighShell.scale.z = 0.92;
    plate(thigh, 0.072, 0.14, 0.022, armor, [0, 0.105, -0.059]);
    const shin = frame(side + "-shin", side + "Knee", side + "Ankle");
    mesh(shin, new THREE.SphereGeometry(0.055, 12, 8), fabric);
    plate(shin, 0.09 * bulk, 0.073, 0.028, armor, [0, 0.016, -0.047]);
    const calf = mesh(
      shin,
      new THREE.CylinderGeometry(0.045, 0.058, 0.205, 14),
      trim,
      [0, 0.16, 0],
    );
    calf.scale.z = 0.88;
    plate(shin, 0.072, 0.17, 0.025, armor, [0, 0.155, -0.047]);
    plate(shin, 0.012, 0.11, 0.008, light, [0, 0.16, 0.051]);
    const glove = frame(side + "-glove", side + "Hand", null);
    mesh(
      glove,
      new THREE.SphereGeometry(1, 12, 8),
      fabric,
      [0, -0.02, -0.012],
    ).scale.set(0.043, 0.065, 0.035);
    const boot = frame(side + "-boot", side + "Ankle", null);
    plate(boot, 0.12, 0.075, 0.205, trim, [0, -0.032, -0.029]);
    plate(boot, 0.126, 0.021, 0.217, rubber, [0, -0.077, -0.029]);
    plate(boot, 0.095, 0.035, 0.065, armor, [0, -0.025, -0.106]);
  }
  const helmet = frame("helmet", "head", null);
  helmet.userData.stabilized = true;
  const head = mesh(
    helmet,
    new THREE.SphereGeometry(1, 20, 14),
    armor,
    [0, 0.074, 0],
  );
  head.scale.set(heavy ? 0.143 : 0.128, 0.154, 0.133);
  plate(helmet, 0.105, 0.055, 0.08, trim, [0, -0.025, -0.055]);
  const visor = mesh(helmet, visorGeometry(), glass, [0, 0.074, 0]);
  visor.name = "panoramic-dark-visor";
  plate(helmet, 0.065, 0.008, 0.008, light, [0, 0.073, -0.132]);
  for (const sign of [-1, 1]) {
    mesh(helmet, new THREE.CylinderGeometry(0.032, 0.032, 0.018, 12), trim, [
      sign * 0.128,
      0.065,
      0,
    ]).rotation.z = Math.PI / 2;
    plate(helmet, 0.012, 0.056, 0.01, trim, [sign * 0.052, 0.085, 0.125]);
  }
  if (stealth) {
    const hood = mesh(
      helmet,
      new THREE.SphereGeometry(1, 12, 10, 0, Math.PI * 2, 0, 1.45),
      trim,
      [0, 0.074, 0],
    );
    hood.scale.set(0.139, 0.164, 0.14);
  } else if (heavy) {
    plate(chest, 0.16, 0.06, 0.045, armor, [0, 0.27, 0.12]);
    plate(helmet, 0.085, 0.04, 0.04, trim, [0, 0.19, -0.04]);
  } else if (racer) {
    for (const sign of [-1, 1]) {
      const fin = plate(chest, 0.018, 0.15, 0.065, armor, [
        sign * 0.13,
        0.22,
        0.095,
      ]);
      fin.rotation.z = sign * 0.15;
    }
  } else if (celestial) {
    for (const sign of [-1, 1]) {
      const badge = mesh(chest, new THREE.OctahedronGeometry(0.025, 0), light, [
        sign * 0.09,
        0.23,
        -0.105,
      ]);
      badge.scale.z = 0.4;
    }
  }
  const position = new THREE.Vector3(),
    endPosition = new THREE.Vector3(),
    y = new THREE.Vector3(),
    x = new THREE.Vector3(),
    z = new THREE.Vector3(),
    basis = new THREE.Matrix4();
  const local = (bone) => {
    bone.getWorldPosition(position);
    return rig.root.worldToLocal(position);
  };
  rig.updateSuit = () => {
    for (const { group, start, end } of links) {
      group.position.copy(local(rig.bones[start]));
      if (end) {
        rig.bones[end].getWorldPosition(endPosition);
        rig.root.worldToLocal(endPosition);
        y.copy(endPosition).sub(group.position).normalize();
        x.crossVectors(y, new THREE.Vector3(0, 0, 1)).normalize();
        z.crossVectors(x, y).normalize();
        basis.makeBasis(x, y, z);
        group.quaternion.setFromRotationMatrix(basis);
      } else if (start.endsWith("Ankle")) {
        const toe = rig.bones[start.replace("Ankle", "Toe")];
        toe.getWorldPosition(endPosition);
        rig.root.worldToLocal(endPosition).sub(group.position);
        group.rotation.set(
          THREE.MathUtils.clamp(
            Math.atan2(-endPosition.z, -endPosition.y) - 0.445,
            -0.5,
            0.5,
          ),
          0,
          0,
        );
      } else group.quaternion.identity();
    }
  };
  rig.suitFrames = frames;
  rig.updateSuit();
  return suit;
}
