const { test } = require("node:test");
const assert = require("node:assert/strict");
async function runner() {
  const [
    { loadRunnerFixture },
    { buildCapturedCharacter, CapturedMotionController },
    { SKINS_CATALOG },
    THREE,
  ] = await Promise.all([
    import("./helpers/runner-fixture.mjs"),
    import("../src/graphics/captured-character.js"),
    import("../src/data/skins.js"),
    import("three"),
  ]);
  const rig = buildCapturedCharacter(
    SKINS_CATALOG[0],
    await loadRunnerFixture(),
  );
  const motion = new CapturedMotionController();
  motion.bind(rig);
  return { rig, motion, THREE };
}
test("body shader is separate from rigid armor and the first pose already bends elbows", async () => {
  const { rig, THREE } = await runner();
  const rigid = new Set();
  let body;
  rig.root.traverse((n) => {
    if (n.isSkinnedMesh) body = n;
    else if (n.isMesh) rigid.add(n.material);
  });
  assert.equal(body.material.skinning, true);
  assert.equal(rigid.has(body.material), false);
  for (const mat of rigid) assert.equal(!!mat.skinning, false);
  const pos = (n) => n.getWorldPosition(new THREE.Vector3());
  for (const side of ["left", "right"]) {
    const upper = pos(rig.bones[side + "Elbow"]).sub(
      pos(rig.bones[side + "Arm"]),
    );
    const lower = pos(rig.bones[side + "Hand"]).sub(
      pos(rig.bones[side + "Elbow"]),
    );
    assert.ok(
      upper.angleTo(lower) > 0.9,
      "elbow must visibly flex in initial pose",
    );
    assert.ok(
      upper.angleTo(new THREE.Vector3(0, -1, 0)) < 0.8,
      "upper arm must point down, not sideways",
    );
  }
});
test("running joints retain anatomical bend directions and paired limbs alternate", async () => {
  const { rig, motion, THREE } = await runner();
  const { sampleFoot } = await import("../src/graphics/rig-animator.js");
  const pos = (n) =>
    rig.root.worldToLocal(n.getWorldPosition(new THREE.Vector3()));
  let motionRange = [];
  for (let i = 0; i < 24; i++) {
    motion.update(rig, 1 / 60, (i / 24) * Math.PI * 2, false, 0);
    for (const side of ["left", "right"]) {
      const h = pos(rig.bones[side + "Leg"]),
        k = pos(rig.bones[side + "Knee"]),
        a = pos(rig.bones[side + "Ankle"]);
      const upper = k.clone().sub(h),
        lower = a.clone().sub(k);
      assert.ok(
        upper.angleTo(lower) < 2.5,
        "knee remains within flexion limits",
      );
      assert.ok(
        upper.y * lower.z - upper.z * lower.y < 0.0001,
        "knee must not hyperextend",
      );
      assert.ok(a.y > -0.1, "ankle cannot pass through the floor");
      const foot = sampleFoot(i / 24 + (side === "left" ? 0 : 0.5));
      if (foot.contact)
        assert.ok(
          Math.abs(a.y - 0.095) < 0.015,
          "stance ankle stays at sole height instead of floating",
        );
    }
    motionRange.push(pos(rig.bones.leftHand).z - pos(rig.bones.rightHand).z);
  }
  assert.ok(Math.max(...motionRange) > 0.1);
  assert.ok(Math.min(...motionRange) < -0.1);
});
test("air pose and landing settle without T-pose or invalid transforms after rapid changes", async () => {
  const { rig, motion } = await runner();
  for (let i = 0; i < 120; i++) {
    const airborne = i < 30 || (i >= 35 && i < 65);
    motion.update(rig, 1 / 60, i * 0.15, airborne, (i % 30) / 30);
    rig.root.traverse((n) =>
      assert.ok(
        [...n.position.toArray(), ...n.quaternion.toArray()].every(
          Number.isFinite,
        ),
      ),
    );
  }
  assert.ok(motion.landing < 0.001);
  assert.ok(motion.airWeight < 0.001);
  motion.reset();
  assert.equal(motion.wasAirborne, false);
  assert.equal(motion.landing, 0);
});
