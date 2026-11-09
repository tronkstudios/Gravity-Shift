import { prepareAssets } from "./assets.mjs";
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { build } from "esbuild";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const fontCss = await prepareAssets();
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
const css = fontCss + utilities.css + "\n" + customCss;
const html = template
  .replace("/* BUILD_STYLES */", () => css)
  .replace("/* BUILD_ENGINE */", () => js.replace(/<\/script/gi, "<\\/script"));
await writeFile("game.js", js);
await writeFile("index.html", html);
await writeFile("dist/index.html", html);
await writeFile("dist/game.js", js);
await writeFile("dist/styles.css", css);
console.log("Built Gravity Shift from ES modules; Three.js bundled locally.");

async function list(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? list(dir + "/" + entry.name)
          : dir + "/" + entry.name,
      ),
    )
  ).flat();
}
const files = (await list("dist"))
  .filter((path) => !path.endsWith(".zip"))
  .sort();
const hash = createHash("sha256");
for (const path of files) hash.update(await readFile(path));
const version = hash.digest("hex").slice(0, 14);
const precache = ["./", ...files.map((path) => "./" + path.slice(5))];
const worker = `const CACHE='gravity-shift-${version}';const FILES=${JSON.stringify(precache)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gravity-shift-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>response.ok?response:caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||caches.match('./index.html'))).catch(()=>caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||caches.match('./index.html'))));return;}
 const local='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);
 if(FILES.includes(local))event.respondWith(caches.match(local).then(cached=>cached||fetch(event.request)));
});`;
await writeFile("dist/sw.js", worker);
await writeFile(
  "dist/build-info.json",
  JSON.stringify({ version, files: precache.length }),
);
