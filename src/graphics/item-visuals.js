import * as THREE from "three";
import { ITEM_META } from "../data/items.js";
export function itemMaterials() {
  const materials = {};
  for (const [key, item] of Object.entries(ITEM_META))
    materials[key] = new THREE.MeshStandardMaterial({
      color: item.color,
      emissive: item.color,
      emissiveIntensity: 0.35,
      roughness: 0.5,
      metalness: 0.15,
    });
  materials.trim = new THREE.MeshStandardMaterial({
    color: 0x233243,
    roughness: 0.7,
  });
  return materials;
}
export function createItemVisual(type, materials) {
  const root = new THREE.Group(),
    mat = materials[type],
    trim = materials.trim;
  const add = (geometry, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  if (type === "magnet") {
    const arc = add(
      new THREE.TorusGeometry(0.3, 0.095, 8, 16, Math.PI * 1.45),
      mat,
    );
    arc.rotation.z = -Math.PI * 0.22;
    add(new THREE.BoxGeometry(0.16, 0.13, 0.17), trim, -0.28, 0.02, 0);
    add(new THREE.BoxGeometry(0.16, 0.13, 0.17), trim, 0.28, 0.02, 0);
  } else if (type === "board") {
    add(new THREE.BoxGeometry(0.55, 0.12, 0.72), trim);
    for (const x of [-0.23, 0.23])
      add(new THREE.BoxGeometry(0.05, 0.15, 0.68), mat, x);
  } else if (type === "multiplier") {
    add(new THREE.OctahedronGeometry(0.37, 0), mat);
    for (const x of [-0.15, 0.15])
      add(new THREE.TorusGeometry(0.12, 0.035, 6, 12), trim, x, 0, 0.31);
  } else {
    for (const x of [-0.19, 0.19]) {
      add(new THREE.BoxGeometry(0.22, 0.34, 0.22), mat, x, 0.08);
      add(new THREE.BoxGeometry(0.23, 0.15, 0.4), trim, x, -0.13, 0.08);
    }
  }
  const ring = add(new THREE.TorusGeometry(0.53, 0.025, 6, 24), mat);
  ring.rotation.x = Math.PI / 2;
  return root;
}
