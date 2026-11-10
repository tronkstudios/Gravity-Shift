import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
export async function prepareAssets() {
  await cp("public", "dist", { recursive: true });
  await mkdir("dist/licenses", { recursive: true });
  await mkdir("dist/assets/fonts", { recursive: true });
  let css = "";
  for (const [packageName, family] of [
    ["space-grotesk", "Space Grotesk"],
    ["jetbrains-mono", "JetBrains Mono"],
  ]) {
    for (const weight of [400, 500, 600, 700]) {
      const filename = `${packageName}-latin-${weight}-normal.woff2`;
      await cp(
        `node_modules/@fontsource/${packageName}/files/${filename}`,
        `dist/assets/fonts/${filename}`,
      );
      css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('./assets/fonts/${filename}') format('woff2')}\n`;
    }
    await cp(
      `node_modules/@fontsource/${packageName}/LICENSE`,
      `dist/licenses/${packageName}.txt`,
    );
  }
  await mkdir("dist/assets/icons/css", { recursive: true });
  await mkdir("dist/assets/icons/webfonts", { recursive: true });
  await cp(
    "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
    "dist/assets/icons/css/all.min.css",
  );
  for (const name of ["fa-solid-900", "fa-brands-400", "fa-regular-400"])
    await cp(
      `node_modules/@fortawesome/fontawesome-free/webfonts/${name}.woff2`,
      `dist/assets/icons/webfonts/${name}.woff2`,
    );
  await cp(
    "node_modules/@fortawesome/fontawesome-free/LICENSE.txt",
    "dist/licenses/fontawesome.txt",
  );
  await cp("node_modules/three/LICENSE", "dist/licenses/three.txt");
  const svg = await readFile("public/assets/icons/mark.svg");
  for (const size of [192, 512])
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`dist/assets/icons/icon-${size}.png`);
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile("dist/assets/icons/maskable-512.png");
  return css;
}
