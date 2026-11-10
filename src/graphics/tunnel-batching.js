import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Bake fixed segment detail by material; moving service panels stay independent. */
export function batchTunnelSegments(segments) {
  const originals = new Set(),
    cache = new Map();
  let before = 0,
    after = 0;
  for (const segment of segments) {
    const dynamic = new Set(segment.userData.servicePanels || []),
      groups = new Map();
    for (const mesh of [...segment.children]) {
      if (!mesh.isMesh || dynamic.has(mesh) || Array.isArray(mesh.material))
        continue;
      before++;
      mesh.updateMatrix();
      const list = groups.get(mesh.material) || [];
      list.push(mesh);
      groups.set(mesh.material, list);
    }
    for (const [material, meshes] of groups) {
      const key =
        material.uuid +
        meshes
          .map((m) => m.geometry.uuid + ":" + m.matrix.elements.join(","))
          .join("|");
      let geometry = cache.get(key);
      if (!geometry) {
        const parts = meshes.map((mesh) =>
          mesh.geometry.clone().applyMatrix4(mesh.matrix),
        );
        geometry = BufferGeometryUtils.mergeBufferGeometries(parts, false);
        parts.forEach((part) => part.dispose());
        if (!geometry) throw new Error("Incompatible tunnel geometry");
        geometry.computeBoundingSphere();
        cache.set(key, geometry);
      }
      for (const mesh of meshes) {
        originals.add(mesh.geometry);
        segment.remove(mesh);
      }
      const batch = new THREE.Mesh(geometry, material);
      batch.name = "static-tunnel-batch";
      segment.add(batch);
      after++;
    }
  }
  // Original geometry can be shared with a moving panel; retain those resources.
  const retained = new Set();
  for (const segment of segments)
    segment.traverse((n) => {
      if (n.geometry) retained.add(n.geometry);
    });
  for (const geometry of originals)
    if (!retained.has(geometry)) geometry.dispose();
  return { before, after, geometries: cache.size };
}
