import fs from "node:fs";
import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
export async function loadRunnerFixture() {
  const bytes = fs.readFileSync(
    new URL("../../public/assets/characters/runner.glb", import.meta.url),
  );
  const n = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + n));
  delete doc.images;
  delete doc.textures;
  delete doc.materials;
  for (const m of doc.meshes) for (const p of m.primitives) delete p.material;
  const json = Buffer.from(
    JSON.stringify(doc).padEnd(
      Math.ceil(JSON.stringify(doc).length / 4) * 4,
      " ",
    ),
  );
  const bin = bytes.subarray(20 + n);
  const out = Buffer.alloc(20 + json.length + bin.length);
  bytes.copy(out, 0, 0, 12);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(json.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  json.copy(out, 20);
  bin.copy(out, 20 + json.length);
  const gltf = await new Promise((resolve, reject) =>
    new GLTFLoader().parse(
      out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength),
      "",
      resolve,
      reject,
    ),
  );
  return gltf;
}
