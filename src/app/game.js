import { ZoneController } from "../graphics/zone-controller.js";
import { judgePerfectShift } from "../game/shift-judge.js";
import { SURFACES } from "../config/surfaces.js";
import { MenuStage } from "../graphics/menu-stage.js";
import * as THREE from "three";
import { PALETTE } from "../config/palette.js";
import { RewardedAdService } from "../services/rewarded-ads.js";
import { SeededRNG } from "../core/seeded-rng.js";
import { AudioManager } from "../services/audio.js";
import { ScoreManager } from "../state/score-manager.js";
import { GravitySystem } from "../game/gravity-system.js";
import { Player } from "../game/player.js";
import { CameraController } from "../graphics/camera-controller.js";
import { ProceduralWorld } from "../game/procedural-world.js";
import { HangarPreviewStudio } from "../graphics/hangar-preview.js";
import { GameUI } from "../ui/game-ui.js";
import { InputController } from "../ui/input-controller.js";

export class GravityShiftGame {
  constructor({
    rendererFactory = (options) => new THREE.WebGLRenderer(options),
    hangarFactory = () => new HangarPreviewStudio(),
  } = {}) {
    this.rendererFactory = rendererFactory;
    this.state = "MENU";
    this.countdownRemaining = 0;
    this.fixedAccumulator = 0;
    this.scoreMgr = new ScoreManager();
    this.audio = new AudioManager();
    this.adService = new RewardedAdService();
    this.hangarStudio = hangarFactory();
    this.rng = new SeededRNG(this.scoreMgr.saveData.settings.customSeed);

    this.ui = new GameUI(this);

    this.baseSpeed = 30.0;
    this.maxSpeed = 68.0;
    this.currentSpeed = this.baseSpeed;

    this.initThreeScene();
    this.gravitySys = new GravitySystem();
    this.player = new Player(this.scene);
    this.cameraCtrl = new CameraController(this.camera);
    this.world = new ProceduralWorld(this.scene, this.rng);
    this.menuStage = new MenuStage();
    this.world.resetWorld();
    this.zoneController = new ZoneController(this.scene, this.world);

    this.applySavedSettings();
    this.input = new InputController(this);
    this.input.bind();
    this.ui.refreshAllUI();

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThreeScene() {
    const container = document.getElementById("canvas-container");
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.VOID);
    this.scene.fog = new THREE.FogExp2(PALETTE.VOID, 0.0085);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      340,
    );

    this.renderer = this.rendererFactory({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0x88aacc, 0.78);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xf2f4f5, 0.95);
    dirLight.position.set(8, 16, 14);
    this.scene.add(dirLight);

    const coreLight = new THREE.PointLight(PALETTE.CYAN, 1.1, 95);
    coreLight.position.set(0, 0, -35);
    this.scene.add(coreLight);
  }

  applySavedSettings() {
    const s = this.scoreMgr.saveData.settings;
    this.gravitySys.transitionDuration =
      parseFloat(s.transitionDuration) || 0.2;
    this.cameraCtrl.mode = s.cameraMode || "FULL";
    this.audio.musicEnabled = !!s.music;
    this.audio.sfxEnabled = !!s.sfx;

    const maxDpr =
      s.graphics === "PERFORMANCE"
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(maxDpr);

    const touchPad = document.getElementById("touch-controls");
    if (touchPad) {
      touchPad.classList.toggle("hidden", !s.touchpad);
    }

    this.player.applySkin(this.scoreMgr.saveData.equippedSkin);
  }

  triggerSurfaceShift(surfaceKey) {
    const shifted = this.gravitySys.shiftTo(surfaceKey);
    if (shifted) {
      this.audio.playShiftSound(surfaceKey);
      this.player.emitBurst(18, PALETTE.CYAN);
      this.world.notifySurfaceShift(surfaceKey);
      this.ui.flashScreen("rgba(0, 217, 255, 0.14)");
      this.ui.updateCompassUI(surfaceKey);
    }
  }

  startNewRun({ instant = false } = {}) {
    this.ui.clearTransientFeedback();
    this.runId = (this.runId || 0) + 1;
    this.lastDeath = null;
    this.lastShiftSequence = 0;
    this.rng.setSeed(this.scoreMgr.saveData.settings.customSeed);
    this.scoreMgr.resetRun();
    this.currentSpeed = this.baseSpeed;
    this.gravitySys.setSurfaceImmediate("FLOOR");
    this.player.reset();
    this.cameraCtrl.reset(this.gravitySys);
    this.world.resetWorld();
    this.zoneController.update(100, 0);
    this.audio.setZone(this.zoneController.zone);
    this.world.notifySurfaceShift("FLOOR");

    this.state = "COUNTDOWN";
    this.countdownRemaining = instant ? 0 : 3;
    this.fixedAccumulator = 0;
    document.getElementById("countdown-number").textContent = "3";
    document.getElementById("countdown").classList.remove("hidden");
    document.getElementById("danger-cue").classList.add("hidden");
    document.getElementById("top-nav-bar").classList.add("hidden");
    document.getElementById("screen-main-menu").classList.add("hidden");
    document.getElementById("modal-pause").classList.add("hidden");
    document.getElementById("modal-gameover").classList.add("hidden");
    document.getElementById("screen-hud").classList.remove("hidden");

    document.getElementById("hud-seed-badge").textContent =
      "SEED: " + this.rng.seedLabel;
    this.ui.updateCompassUI("FLOOR");
    this.ui.updateHUD();
    if (instant) {
      this.state = "PLAYING";
      document.getElementById("countdown").classList.add("hidden");
      this.audio.startMusic();
    }
  }

  continueRun({ useEnergy = false } = {}) {
    if (this.state !== "GAMEOVER" || this.scoreMgr.reviveUsed) return false;
    if (useEnergy && this.scoreMgr.saveData.totalEnergy < 50) return false;
    if (useEnergy) this.scoreMgr.saveData.totalEnergy -= 50;
    this.ui.clearTransientFeedback();
    this.scoreMgr.reviveUsed = true;
    this.scoreMgr.persist();
    this.player.reset();
    this.player.shieldTimer = 3.5;
    // Move past the collision instead of returning directly into it.
    this.world.obstacles
      .filter((ob) => Math.abs(ob.mesh.position.z) < 12)
      .forEach((ob) => {
        ob.mesh.position.z = 30;
      });
    this.state = "PLAYING";
    this.lastTime = performance.now();
    this.fixedAccumulator = 0;
    document.getElementById("modal-gameover").classList.add("hidden");
    document.getElementById("screen-hud").classList.remove("hidden");
    this.audio.startMusic();
    this.ui.refreshAllUI();
    this.ui.showToast("CONTINÚA · ESCUDO DE 3.5 s");
    return true;
  }

  pauseGame() {
    if (this.state !== "PLAYING") return;
    this.ui.clearTransientFeedback();
    this.state = "PAUSED";
    document.getElementById("danger-cue").classList.add("hidden");
    this.audio.stopMusic();
    document.getElementById("modal-pause").classList.remove("hidden");
  }

  resumeGame() {
    if (this.state !== "PAUSED") return;
    this.state = "PLAYING";
    document.getElementById("modal-pause").classList.add("hidden");
    this.lastTime = performance.now();
    this.fixedAccumulator = 0;
    this.audio.startMusic();
  }

  returnToMainMenu() {
    this.ui.clearTransientFeedback();
    this.state = "MENU";
    document.getElementById("countdown").classList.add("hidden");
    document.getElementById("danger-cue").classList.add("hidden");
    this.scoreMgr.persist();
    this.audio.stopMusic();
    this.gravitySys.setSurfaceImmediate("FLOOR");
    this.player.reset();
    this.world.notifySurfaceShift("FLOOR");

    document.getElementById("screen-hud").classList.add("hidden");
    document.getElementById("modal-pause").classList.add("hidden");
    document.getElementById("modal-gameover").classList.add("hidden");
    document.getElementById("top-nav-bar").classList.remove("hidden");
    document.getElementById("screen-main-menu").classList.remove("hidden");
    this.ui.refreshAllUI();
  }

  handleGameOver() {
    if (this.state !== "PLAYING") return;
    document.getElementById("danger-cue").classList.add("hidden");
    this.ui.clearTransientFeedback();
    this.state = "GAMEOVER";
    const obstacleName = {
      LASER: "un láser",
      BARRIER: "una barrera",
      HAZARD_ZONE: "una zona de peligro",
      MOVING: "un bloque móvil",
      ROTATING: "una barra giratoria",
    };
    const reason = this.lastDeath
      ? `Colisión con ${obstacleName[this.lastDeath.type] || "un obstáculo"} en ${SURFACES[this.lastDeath.surfaceKey]?.label || "el túnel"}.`
      : "Colisión con un obstáculo.";
    document.getElementById("go-reason").textContent =
      reason + " Sigue las monedas hacia otra superficie.";
    document.getElementById("go-perfects").textContent =
      `${this.scoreMgr.perfects} cambios perfectos · ${Math.floor(this.scoreMgr.elapsed)} s`;
    const adButton = document.getElementById("btn-reward-continue");
    adButton.hidden =
      !this.adService.isProviderAvailable() || this.scoreMgr.reviveUsed;
    adButton.disabled = false;
    this.player.isDead = true;
    this.audio.stopMusic();
    this.audio.playImpactCrash();
    this.player.emitBurst(45, PALETTE.HAZARD);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      this.cameraCtrl.triggerShake(0.45, 0.65);
    this.ui.flashScreen("rgba(255, 101, 74, 0.42)");

    const isNewRecord = this.scoreMgr.finalizeRun();

    document.getElementById("screen-hud").classList.add("hidden");
    document.getElementById("modal-gameover").classList.remove("hidden");

    document.getElementById("go-score").textContent = Math.floor(
      this.scoreMgr.score,
    ).toLocaleString();
    document.getElementById("go-distance").textContent =
      Math.floor(this.scoreMgr.distance) + " m";
    document.getElementById("go-energy").textContent =
      "+" + this.scoreMgr.runEnergy;
    document.getElementById("go-best").textContent =
      this.scoreMgr.saveData.bestScore.toLocaleString();

    const recBadge = document.getElementById("go-new-record-badge");
    recBadge.classList.toggle("hidden", !isNewRecord);

    const reviveBtn = document.getElementById("btn-revive-shield");
    const canRevive =
      this.scoreMgr.saveData.totalEnergy >= 50 && !this.scoreMgr.reviveUsed;
    reviveBtn.classList.toggle("opacity-40", !canRevive);
    reviveBtn.classList.toggle("cursor-not-allowed", !canRevive);

    this.ui.refreshAllUI();
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.hangarStudio && this.hangarStudio.isActive) {
      this.hangarStudio.updateAndRender(dt);
    }

    if (this.state === "MENU") {
      this.menuStage.update(dt, this.scoreMgr.saveData.equippedSkin);
      document.getElementById("demo-coins").textContent =
        this.menuStage.director.coins;
      document.getElementById("demo-dodges").textContent =
        this.menuStage.director.dodges;
    } else if (this.state === "COUNTDOWN") {
      this.countdownRemaining -= dt;
      document.getElementById("countdown-number").textContent = Math.max(
        1,
        Math.ceil(this.countdownRemaining),
      );
      if (this.countdownRemaining <= 0) {
        this.state = "PLAYING";
        document.getElementById("countdown").classList.add("hidden");
        this.audio.startMusic();
        this.ui.showToast("SUBE AL TECHO · CORRE POR LAS PAREDES");
      }
    } else if (this.state === "PLAYING") {
      this.fixedAccumulator += dt;
      const step = 1 / 120;
      while (this.fixedAccumulator >= step && this.state === "PLAYING") {
        let perfectShift = false;
        const hadMission = this.scoreMgr.missionCompleted;
        this.currentSpeed = Math.min(
          this.maxSpeed,
          this.baseSpeed + this.scoreMgr.distance * 0.025,
        );
        this.scoreMgr.updateFrame(step, this.currentSpeed);
        this.gravitySys.update(step);
        if (
          this.gravitySys.shiftSequence !== undefined &&
          this.gravitySys.shiftSequence !== this.lastShiftSequence
        ) {
          this.lastShiftSequence = this.gravitySys.shiftSequence;
          if (
            judgePerfectShift(
              this.world.obstacles,
              this.gravitySys.lastDepartureSurface,
              this.gravitySys.targetSurface.id,
              this.currentSpeed,
            )
          ) {
            perfectShift = true;
          }
        }
        this.player.update(step, this.currentSpeed, this.gravitySys, false);
        this.world.update(step, this.currentSpeed, this.scoreMgr.distance);
        this.world.checkCollisions(
          this.player,
          this.gravitySys,
          () => {
            const previous = this.scoreMgr.multiplier;
            this.scoreMgr.collectOrb();
            this.audio.playEnergyPickup(this.scoreMgr.multiplier);
            this.player.emitBurst(10, 0xffca55);
            if (this.scoreMgr.multiplier > previous)
              this.ui.showToast(
                "COMBO ×" + this.scoreMgr.multiplier.toFixed(1),
              );
          },
          (obstacle) => {
            this.lastDeath = obstacle;
            this.handleGameOver();
          },
        );
        if (perfectShift && this.state === "PLAYING") {
          this.scoreMgr.awardPerfect();
          this.audio.playPerfect();
          this.player.emitBurst(20, 0xffd16c);
          this.ui.showToast(
            "CAMBIO PERFECTO · ×" + this.scoreMgr.multiplier.toFixed(1),
          );
          document
            .getElementById("perfect-feedback")
            .classList.remove("hidden");
          this.perfectUntil = now + 650;
        }
        if (
          this.state === "PLAYING" &&
          !hadMission &&
          this.scoreMgr.missionCompleted
        )
          this.ui.showToast("RETO COMPLETADO · +75 DE ENERGÍA");
        this.fixedAccumulator -= step;
      }
      this.cameraCtrl.update(
        dt,
        this.player,
        this.gravitySys,
        this.currentSpeed,
        false,
      );
      const zone = this.zoneController?.update(dt, this.scoreMgr.distance);
      if (zone) {
        this.audio?.setZone(zone);
        document.getElementById("hud-zone").textContent = zone.name;
      }
      if (this.state === "PLAYING" && this.zoneController?.changed)
        this.ui.showToast(zone.name);
      if (now > (this.perfectUntil || 0))
        document.getElementById("perfect-feedback").classList.add("hidden");
      while (this.state === "PLAYING" && this.scoreMgr.newUnlocks.length) {
        const skin = this.scoreMgr.newUnlocks.shift();
        this.ui.showToast("PERSONAJE DESBLOQUEADO · " + skin.toUpperCase());
      }
      this.ui.updateHUD();
    } else if (this.state === "GAMEOVER") {
      this.player.update(dt, 0, this.gravitySys, false);
      this.cameraCtrl.update(dt, this.player, this.gravitySys, 0, false);
    }

    if (this.state === "MENU") {
      this.menuStage.render(
        this.renderer,
        window.innerWidth,
        window.innerHeight,
      );
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
