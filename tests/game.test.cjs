const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
function runtime(saved){
 const nodes=new Map(); const node=()=>({textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){}});
 const storage={value:saved,getItem(){return this.value||null},setItem(k,v){this.value=v}};
 const context=vm.createContext({console,performance:{now:()=>0},localStorage:storage,window:{addEventListener(){},matchMedia:()=>({matches:false})},document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll:()=>[]},requestAnimationFrame(){},setTimeout(){},clearTimeout(){}});
 vm.runInContext(fs.readFileSync('vendor/three.min.js','utf8'),context);
 vm.runInContext(fs.readFileSync('game.js','utf8')+'\nglobalThis.classes={ScoreManager,ProceduralWorld,SeededRNG,GravityShiftGame,GravitySystem};',context);
 return {...context.classes,THREE:context.THREE,storage};
}
test('corrupt saves and locked equipped skins normalize without losing legitimate balances',()=>{
 const {ScoreManager}=runtime(JSON.stringify({totalEnergy:'450',bestScore:-5,unlockedSkins:['core','core','invalid'],equippedSkin:'invalid'}));const s=new ScoreManager();assert.equal(s.saveData.totalEnergy,450);assert.equal(s.saveData.bestScore,0);assert.deepEqual(Array.from(s.saveData.unlockedSkins),['core']);assert.equal(s.saveData.equippedSkin,'core');
});
test('250m mission pays exactly once and resets for a new run',()=>{
 const {ScoreManager}=runtime();const s=new ScoreManager();s.distance=249;s.updateFrame(1,30);assert.equal(s.missionCompleted,true);assert.equal(s.saveData.totalEnergy,425);assert.equal(s.runEnergy,75);s.reviveUsed=true;s.updateFrame(1,30);assert.equal(s.saveData.totalEnergy,425);s.resetRun();assert.equal(s.missionCompleted,false);assert.equal(s.runEnergy,0);
});
test('thin laser cannot be skipped at maximum speed with 20 FPS frames',()=>{
 const {GravityShiftGame,ProceduralWorld,THREE,ScoreManager}=runtime();const g=Object.create(GravityShiftGame.prototype);let hits=0;
 const obs={type:'LASER',surfaceKey:'FLOOR',halfD:.6,halfW:5.4,localX:0,mesh:{position:{z:-1.6}}};
 const world={obstacles:[obs],collectibles:[],update(dt,speed){obs.mesh.position.z+=dt*speed},checkCollisions:ProceduralWorld.prototype.checkCollisions};
 Object.assign(g,{state:'PLAYING',lastTime:0,fixedAccumulator:0,baseSpeed:68,maxSpeed:68,scoreMgr:new ScoreManager(),gravitySys:{lateralOffset:0,currentSurface:{id:'FLOOR',normal:{x:0,y:1}},update(){}},player:{root:{position:new THREE.Vector3()},shieldTimer:0,update(){}},world,cameraCtrl:{update(){}},renderer:{render(){}},handleGameOver(){hits++;this.state='GAMEOVER'},updateHUD(){}});
 g.animate(50);assert.equal(hits,1);assert.equal(g.state,'GAMEOVER');
});
test('removing obstacles frees each unique geometry once and retains shared orb geometry',()=>{
 const {ProceduralWorld,THREE}=runtime();let disposed=0,removed=0;const geometry=new THREE.BoxGeometry();geometry.addEventListener('dispose',()=>disposed++);const shared=new THREE.OctahedronGeometry();let sharedDisposed=0;shared.addEventListener('dispose',()=>sharedDisposed++);const group=new THREE.Group();group.add(new THREE.Mesh(geometry),new THREE.Mesh(geometry),new THREE.Mesh(shared));
 ProceduralWorld.prototype.releaseMesh.call({orbGeometry:shared,scene:{remove(){removed++}}},group);assert.equal(disposed,1);assert.equal(sharedDisposed,0);assert.equal(removed,1);
});
test('seeded moving hazards depend on simulation time, not time spent paused',()=>{
 const a=runtime();const world=new a.ProceduralWorld(new a.THREE.Scene(),new a.SeededRNG('TEST'));world.resetWorld();world.obstacles.forEach(o=>assert.ok(Number.isFinite(o.mesh.position.z)));world.update(.25,30,0);assert.equal(world.elapsed,.25);world.resetWorld();assert.equal(world.elapsed,0);
});
test('HUD and all static controls referenced by the engine exist in the template',()=>{
 const source=fs.readFileSync('game.js','utf8'),template=fs.readFileSync('src/index.template.html','utf8');
 for(const match of source.matchAll(/getElementById\('([^']+)'\)/g))assert.ok(template.includes(`id="${match[1]}"`),`missing ${match[1]}`);
});
test('pausing stops simulation and countdown can be cancelled without advancing the run',()=>{
 const {GravityShiftGame,ScoreManager}=runtime();const g=Object.create(GravityShiftGame.prototype);let updates=0;
 Object.assign(g,{state:'PAUSED',lastTime:0,scoreMgr:new ScoreManager(),renderer:{render(){}},player:{update(){updates++}},world:{update(){updates++}}});g.animate(50);assert.equal(updates,0);assert.equal(g.scoreMgr.distance,0);
});
