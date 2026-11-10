import * as THREE from "three";
/** Local, bounded transform recording; playback cannot run scoring, collisions or rewards. */
export class RunReplay {
  constructor(game) {
    this.game = game;
    this.frames = [];
    this.active = false;
  }
  clear() {
    if (this.active) this.stop();
    this.frames = [];
  }
  capture(force = false) {
    const g = this.game,
      time = g.scoreMgr.elapsed;
    if (!force && this.frames.length && time - this.frames.at(-1).time < 1 / 30)
      return;
    const meshes = [
      ...g.world.tunnelSegments,
      ...g.world.obstacles
        .filter((o) => Math.abs(o.mesh.position.z) < 90)
        .map((o) => o.mesh),
      ...(g.world.powerups || [])
        .filter((o) => Math.abs(o.mesh.position.z) < 70)
        .map((o) => o.mesh),
      ...g.world.collectibles
        .filter((o) => Math.abs(o.mesh.position.z) < 70)
        .map((o) => o.mesh),
    ];
    if (force && this.frames.at(-1)?.time === time) this.frames.pop();
    this.frames.push({
      time,
      position: g.player.root.position.clone(),
      quaternion: g.player.root.quaternion.clone(),
      phase: g.player.runCycleTime,
      board: !!g.player.boardActive,
      air: g.gravitySys.isTransitioning || g.player.jumpActive,
      progress: g.gravitySys.isTransitioning
        ? g.gravitySys.transitionElapsed / g.gravitySys.transitionDuration
        : g.player.jumpProgress || 0,
      camera: g.camera.position.clone(),
      up: g.camera.up.clone(),
      fov: g.camera.fov,
      objects: meshes.map((mesh) => ({
        mesh,
        position: mesh.position.clone(),
        quaternion: mesh.quaternion.clone(),
      })),
    });
    this.frames = this.frames
      .filter((frame) => time - frame.time <= 1.05)
      .slice(-40);
  }
  start() {
    const g = this.game;
    if (g.state !== "GAMEOVER" || this.frames.length < 2 || g.adService.busy)
      return false;
    this.active = true;
    this.clock = 0;
    this.duration = this.frames.at(-1).time - this.frames[0].time;
    const objects = new Set(
      this.frames.flatMap((frame) =>
        frame.objects.map((object) => object.mesh),
      ),
    );
    this.restore = [...objects].map((mesh) => ({
      mesh,
      parent: mesh.parent,
      visible: mesh.visible,
      position: mesh.position.clone(),
      quaternion: mesh.quaternion.clone(),
    }));
    for (const { mesh } of this.restore) if (!mesh.parent) g.scene.add(mesh);
    this.saved = {
      position: g.player.root.position.clone(),
      quaternion: g.player.root.quaternion.clone(),
      visualPosition: g.player.visualGroup.position.clone(),
      visualQuaternion: g.player.visualGroup.quaternion.clone(),
      camera: g.camera.position.clone(),
      up: g.camera.up.clone(),
      cameraQuaternion: g.camera.quaternion.clone(),
      fov: g.camera.fov,
      shadow: g.player.contactShadow.visible,
      rival: g.rivals?.active?.player.root,
      board: !!g.player.boardActive,
    };
    if (this.saved.rival) this.saved.rival.visible = false;
    this.marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xff8066, depthTest: false }),
    );
    const point = g.lastDeath?.lastContact || g.player.root.position;
    this.marker.position.copy(point);
    this.marker.renderOrder = 100;
    g.scene.add(this.marker);
    this.box = new THREE.Box3Helper(new THREE.Box3(), 0xff9a71);
    this.box.material.depthTest = false;
    g.scene.add(this.box);
    g.player.rigAnimator.reset();
    g.state = "REPLAY";
    g.ui.clearTransientFeedback();
    document.getElementById("modal-gameover").classList.add("hidden");
    document.getElementById("replay-overlay").hidden = false;
    this.update(0);
    return true;
  }
  update(dt) {
    if (!this.active) return;
    const g = this.game;
    this.clock += dt * 0.6;
    const time = this.frames[0].time + Math.min(this.duration, this.clock);
    let index = this.frames.findIndex((frame) => frame.time >= time);
    if (index < 0) index = this.frames.length - 1;
    const b = this.frames[index],
      a = this.frames[Math.max(0, index - 1)],
      t = b.time > a.time ? (time - a.time) / (b.time - a.time) : 0;
    const before = new Map(a.objects.map((object) => [object.mesh, object])),
      after = new Map(b.objects.map((object) => [object.mesh, object]));
    for (const { mesh } of this.restore) mesh.visible = false;
    for (const mesh of new Set([...before.keys(), ...after.keys()])) {
      const first = before.get(mesh),
        last = after.get(mesh);
      if ((!first && t < 0.5) || (!last && t > 0.5)) continue;
      const from = first || last,
        to = last || first;
      mesh.visible = true;
      mesh.position.lerpVectors(from.position, to.position, t);
      mesh.quaternion.slerpQuaternions(from.quaternion, to.quaternion, t);
    }
    g.player.root.position.lerpVectors(a.position, b.position, t);
    g.player.root.quaternion.slerpQuaternions(a.quaternion, b.quaternion, t);
    g.player.setBoardActive(a.board);
    g.player.contactShadow.visible = !a.air;
    g.player.visualGroup.position.set(0, 0, 0);
    g.player.visualGroup.quaternion.identity();
    g.player.rigAnimator.update(
      g.player.currentRig,
      dt,
      a.phase + (b.phase - a.phase) * t,
      a.air,
      a.progress,
    );
    g.camera.position.lerpVectors(a.camera, b.camera, t);
    g.camera.up.lerpVectors(a.up, b.up, t).normalize();
    g.camera.fov = a.fov + (b.fov - a.fov) * t;
    g.camera.lookAt(
      g.player.root.position
        .clone()
        .add(
          new THREE.Vector3(0, 0.8, 0).applyQuaternion(
            g.player.root.quaternion,
          ),
        ),
    );
    g.camera.updateProjectionMatrix();
    const impact = this.clock >= this.duration - 0.08;
    this.marker.visible = impact;
    const obstacle = g.lastDeath?.mesh;
    this.box.visible = !!obstacle?.parent;
    if (obstacle) this.box.box.setFromObject(obstacle);
    document.getElementById("replay-caption").textContent = impact
      ? "CONTACTO · OBSTÁCULO RESALTADO"
      : "ÚLTIMO SEGUNDO · CÁMARA LENTA";
    if (this.clock > this.duration + 0.45) this.stop();
  }
  stop() {
    if (!this.active) return;
    const g = this.game;
    this.active = false;
    for (const item of this.restore) {
      const { mesh, parent } = item;
      mesh.position.copy(item.position);
      mesh.quaternion.copy(item.quaternion);
      mesh.visible = item.visible;
      if (parent && mesh.parent !== parent) parent.add(mesh);
      else if (!parent) mesh.parent?.remove(mesh);
    }
    g.player.root.position.copy(this.saved.position);
    g.player.root.quaternion.copy(this.saved.quaternion);
    g.player.visualGroup.position.copy(this.saved.visualPosition);
    g.player.visualGroup.quaternion.copy(this.saved.visualQuaternion);
    if (this.saved.rival) this.saved.rival.visible = true;
    g.player.setBoardActive(this.saved.board);
    g.player.contactShadow.visible = this.saved.shadow;
    g.cameraCtrl.shakeTimer = 0;
    g.camera.position.copy(this.saved.camera);
    g.camera.up.copy(this.saved.up);
    g.camera.quaternion.copy(this.saved.cameraQuaternion);
    g.camera.fov = this.saved.fov;
    g.camera.updateProjectionMatrix();
    const frame = this.frames.at(-1);
    g.player.rigAnimator.update(
      g.player.currentRig,
      0,
      frame.phase,
      frame.air,
      frame.progress,
    );
    for (const mesh of [this.marker, this.box]) {
      g.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    g.state = "GAMEOVER";
    g.lastTime = performance.now();
    document.getElementById("replay-overlay").hidden = true;
    document.getElementById("modal-gameover").classList.remove("hidden");
  }
}
