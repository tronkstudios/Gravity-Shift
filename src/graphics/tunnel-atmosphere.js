import * as THREE from "three";

/** Installs reusable architectural detail on the existing recycled tunnel segments. */
export function addTunnelAtmosphere(scene, segments) {
  const cool = new THREE.MeshBasicMaterial({ color: 0x5fa9bc });
  const warm = new THREE.MeshBasicMaterial({ color: 0xffb56e });
  const panel = new THREE.MeshStandardMaterial({
    color: 0x253542,
    metalness: 0.35,
    roughness: 0.75,
  });
  const strip = new THREE.BoxGeometry(0.055, 0.1, 9);
  const panelGeo = new THREE.BoxGeometry(0.06, 2.1, 3.6);
  const ventGeo = new THREE.BoxGeometry(0.07, 0.04, 2.8);
  const frameGeo = new THREE.BoxGeometry(13.3, 0.065, 0.065);
  const vent = new THREE.MeshStandardMaterial({
    color: 0x0c1720,
    roughness: 0.9,
  });
  segments.forEach((segment, index) => {
    for (const sign of [-1, 1]) {
      const wall = new THREE.Mesh(panelGeo, panel);
      wall.position.set(sign * 6.91, -2.2, -2);
      segment.add(wall);
      for (let i = 0; i < 5; i++) {
        const slit = new THREE.Mesh(ventGeo, vent);
        slit.position.set(sign * 6.85, -2.9 + i * 0.3, -2);
        segment.add(slit);
      }
      const floorLight = new THREE.Mesh(strip, cool);
      floorLight.position.set(sign * 5.7, -6.85, -1);
      segment.add(floorLight);
      const service = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.45, 0.7),
        warm,
      );
      service.position.set(sign * 6.83, 1.8, 4);
      segment.add(service);
    }
    const lintel = new THREE.Mesh(frameGeo, index % 3 === 0 ? warm : cool);
    lintel.position.set(0, 6.8, 5);
    segment.add(lintel);
  });
  scene.add(new THREE.HemisphereLight(0x7aa7bf, 0x152034, 0.55));
  const fill = new THREE.PointLight(0xffbb85, 0.65, 42, 2);
  fill.position.set(3, 3, -18);
  scene.add(fill);
}
