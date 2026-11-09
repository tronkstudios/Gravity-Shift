import { MenuDirector } from "../game/menu-director.js";
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
    this.menuDirector = new MenuDirector();
    this.world.resetWorld();

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

  startNewRun() {
    this.rng.setSeed(this.scoreMgr.saveData.settings.customSeed);
    this.scoreMgr.resetRun();
    this.currentSpeed = this.baseSpeed;
    this.gravitySys.setSurfaceImmediate("FLOOR");
    this.player.reset();
    this.world.resetWorld();
    this.world.notifySurfaceShift("FLOOR");

    this.state = "COUNTDOWN";
    this.countdownRemaining = 3;
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
  }

  pauseGame() {
    if (this.state !== "PLAYING") return;
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
    this.state = "GAMEOVER";
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
      this.menuDirector.update(dt, this.world, this.gravitySys, this.player);
      this.world.update(dt, this.menuDirector.speed, 0);
      this.gravitySys.update(dt);
      this.player.update(dt, this.menuDirector.speed, this.gravitySys, true);
      this.cameraCtrl.update(dt, this.player, this.gravitySys, 18.0, true);
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
        const hadMission = this.scoreMgr.missionCompleted;
        this.currentSpeed = Math.min(
          this.maxSpeed,
          this.baseSpeed + this.scoreMgr.distance * 0.025,
        );
        this.scoreMgr.updateFrame(step, this.currentSpeed);
        this.gravitySys.update(step);
        this.player.update(step, this.currentSpeed, this.gravitySys, false);
        this.world.update(step, this.currentSpeed, this.scoreMgr.distance);
        this.world.checkCollisions(
          this.player,
          this.gravitySys,
          () => {
            const previous = this.scoreMgr.multiplier;
            this.scoreMgr.collectOrb();
            this.audio.playEnergyPickup(this.scoreMgr.multiplier);
            this.player.emitBurst(10, PALETTE.CYAN);
            if (this.scoreMgr.multiplier > previous)
              this.ui.showToast(
                "COMBO ×" + this.scoreMgr.multiplier.toFixed(1),
              );
          },
          () => this.handleGameOver(),
        );
        if (!hadMission && this.scoreMgr.missionCompleted)
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
      this.ui.updateHUD();
    } else if (this.state === "GAMEOVER") {
      this.player.update(dt, 0, this.gravitySys, false);
      this.cameraCtrl.update(dt, this.player, this.gravitySys, 0, false);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
