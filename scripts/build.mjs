import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
const template=await readFile('src/index.template.html','utf8');
const css=await readFile('styles.css','utf8');
const js=await readFile('game.js','utf8');
const html=template.replace('/* BUILD_STYLES */',()=>css).replace('/* BUILD_ENGINE */',()=>js.replace(/<\/script/gi,'<\\/script'));
await mkdir('dist',{recursive:true});
await writeFile('index.html',html);
await writeFile('dist/index.html',html);
await writeFile('dist/game.js',js);
await writeFile('dist/styles.css',css);
console.log('Built Gravity Shift: standalone index.html + dist/');

await cp('vendor','dist/vendor',{recursive:true});
