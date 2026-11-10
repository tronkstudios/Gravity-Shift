/** Remove the old oversized head, mittens and feet where the fitted suit supplies replacements. */
export function trimSuitBase(mesh) {
  const hidden = new Set([
    "Skeleton_neck_joint_2",
    "Skeleton_torso_joint_2",
    "torso_joint_3",
    "Skeleton_arm_joint_L__2_",
    "Skeleton_arm_joint_R__3_",
    "leg_joint_L_3",
    "leg_joint_R_3",
    "leg_joint_L_5",
    "leg_joint_R_5",
  ]);
  const geometry = mesh.geometry,
    index = geometry.index,
    weights = geometry.attributes.skinWeight,
    joints = geometry.attributes.skinIndex;
  const replaced = new Uint8Array(geometry.attributes.position.count);
  for (let vertex = 0; vertex < replaced.length; vertex++) {
    let best = -1,
      bone = 0;
    for (let component = 0; component < 4; component++) {
      const weight = weights.getComponent
        ? weights.getComponent(vertex, component)
        : [
            weights.getX(vertex),
            weights.getY(vertex),
            weights.getZ(vertex),
            weights.getW(vertex),
          ][component];
      if (weight > best) {
        best = weight;
        bone = [
          joints.getX(vertex),
          joints.getY(vertex),
          joints.getZ(vertex),
          joints.getW(vertex),
        ][component];
      }
    }
    replaced[vertex] = hidden.has(mesh.skeleton.bones[bone].name) ? 1 : 0;
  }
  const kept = [];
  const count = index ? index.count : geometry.attributes.position.count;
  for (let triangle = 0; triangle < count; triangle += 3) {
    const a = index ? index.getX(triangle) : triangle,
      b = index ? index.getX(triangle + 1) : triangle + 1,
      c = index ? index.getX(triangle + 2) : triangle + 2;
    if (!replaced[a] && !replaced[b] && !replaced[c]) kept.push(a, b, c);
  }
  geometry.setIndex(kept);
  geometry.clearGroups();
  geometry.computeBoundingSphere();
  return {
    removedTriangles: (count - kept.length) / 3,
    triangles: kept.length / 3,
  };
}
