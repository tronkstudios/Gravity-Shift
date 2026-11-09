import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { build } from "esbuild";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const result = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  target: "es2020",
  write: false,
  minify: false,
  legalComments: "inline",
});
const js = result.outputFiles[0].text;
const template = await readFile("src/index.template.html", "utf8");
const customCss = await readFile("styles.css", "utf8");
const utilities = await postcss([tailwindcss("./tailwind.config.cjs")]).process(
  await readFile("src/ui/tailwind.css", "utf8"),
  { from: "src/ui/tailwind.css" },
);
const css = utilities.css + "\n" + customCss;
const html = template
  .replace("/* BUILD_STYLES */", () => css)
  .replace("/* BUILD_ENGINE */", () => js.replace(/<\/script/gi, "<\\/script"));
await writeFile("game.js", js);
await writeFile("index.html", html);
await writeFile("dist/index.html", html);
await writeFile("dist/game.js", js);
await writeFile("dist/styles.css", css);
console.log("Built Gravity Shift from ES modules; Three.js bundled locally.");
