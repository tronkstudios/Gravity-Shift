import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const svg = await readFile("public/assets/icons/mark.svg");
for (const [density, size] of Object.entries({
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
})) {
  for (const name of [
    "ic_launcher",
    "ic_launcher_round",
    "ic_launcher_foreground",
  ])
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`android/app/src/main/res/mipmap-${density}/${name}.png`);
}
await writeFile(
  "android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml",
  `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#0b1423" android:pathData="M0,0h108v108h-108z"/><path android:fillColor="#00d9ee" android:pathData="M27,32h28v9h-19v26h12v-9h-8v-9h17v27h-30zM76,32h10l-16,28h11v-11h9v27h-9v-7h-25z"/></vector>`,
);
await sharp(svg)
  .resize(1024, 1024)
  .flatten({ background: "#0b1423" })
  .png()
  .toFile("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png");
console.log("Native launcher icons generated.");
// Keep platform image dimensions while replacing generated Capacitor splash art.
import { readdir } from "node:fs/promises";
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith(".png") && e.name.startsWith("splash"))
      out.push(p);
  }
  return out;
}
for (const file of [
  ...(await walk("android/app/src/main/res")),
  ...(await walk("ios/App/App/Assets.xcassets/Splash.imageset")),
]) {
  const { width, height } = await sharp(file).metadata();
  const size = Math.round(Math.min(width, height) * 0.23);
  const mark = await sharp(svg).resize(size, size).png().toBuffer();
  const output = await sharp({
    create: { width, height, channels: 4, background: "#0b1423" },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
  await writeFile(file, output);
}
