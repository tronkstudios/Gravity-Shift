import { Capacitor } from "@capacitor/core";
import {
  enableNativeTestAds,
  reviewAdPrivacy,
} from "../native/admob-provider.js";
import { SwipeGesture } from "../input/swipe-gesture.js";
import { dailyDate } from "../game/daily-challenge.js";
import { MAX_BACKUP_BYTES } from "../persistence/save-backup.js";
export class InputController {
  constructor(game) {
    this.game = game;
  }
  bind() {
    document.getElementById("btn-cancel-countdown").onclick = () =>
      this.game.state === "RESUMING"
        ? this.game.cancelResume()
        : this.game.returnToMainMenu();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.swipe?.cancel();
        if (this.game.state === "RESUMING") this.game.cancelResume();
        if (this.game.state === "PLAYING") this.game.pauseGame();
        if (this.game.state === "COUNTDOWN") this.game.returnToMainMenu();
        this.game.scoreMgr.persist();
      }
      this.game.lastTime = performance.now();
      this.game.fixedAccumulator = 0;
    });
    window.addEventListener("blur", () => {
      this.swipe?.cancel();
      if (this.game.state === "PLAYING") this.game.pauseGame();
      if (this.game.state === "RESUMING") this.game.cancelResume();
    });
    window.addEventListener("resize", () => {
      this.game.camera.aspect = window.innerWidth / window.innerHeight;
      this.game.camera.updateProjectionMatrix();
      this.game.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.game.hangarStudio.isActive) {
        this.game.hangarStudio.resize();
      }
    });

    // Keyboard Controls (W/S/A/D + Arrow Keys for 4 Surfaces, Q/E for lateral adjustment, ESC for Pause)
    window.addEventListener("keydown", (e) => {
      if (e.target?.matches?.("input,select,textarea") || e.repeat) return;
      const code = e.code;
      if (code === "Escape") {
        if (this.game.state === "RESUMING") {
          this.game.cancelResume();
          return;
        }
        if (this.game.state === "COUNTDOWN") {
          this.game.returnToMainMenu();
          return;
        }
        if (this.game.state === "PLAYING") this.game.pauseGame();
        else if (this.game.state === "PAUSED") this.game.resumeGame();
        return;
      }

      if (this.game.state !== "PLAYING") return;

      if (code === "KeyW" || code === "ArrowUp") {
        e.preventDefault();
        this.game.triggerSurfaceShift("CEILING");
      } else if (code === "KeyS" || code === "ArrowDown") {
        e.preventDefault();
        this.game.triggerSurfaceShift("FLOOR");
      } else if (code === "KeyA" || code === "ArrowLeft") {
        e.preventDefault();
        this.game.triggerSurfaceShift("LEFT");
      } else if (code === "KeyD" || code === "ArrowRight") {
        e.preventDefault();
        this.game.triggerSurfaceShift("RIGHT");
      } else if (code === "KeyQ") {
        this.game.gravitySys.nudgeLateral(-1);
      } else if (code === "KeyE") {
        this.game.gravitySys.nudgeLateral(1);
      }
    });

    this.swipe = new SwipeGesture();
    const canvasEl = this.game.renderer.domElement;
    if (canvasEl.style) canvasEl.style.touchAction = "none";
    canvasEl.addEventListener("pointerdown", (event) => {
      if (
        this.game.state !== "PLAYING" ||
        (event.pointerType === "mouse" && event.button !== 0)
      )
        return;
      this.swipe.begin(event.pointerId, event.clientX, event.clientY);
      try {
        canvasEl.setPointerCapture?.(event.pointerId);
      } catch {}
    });
    canvasEl.addEventListener("pointermove", (event) => {
      if (this.game.state !== "PLAYING") {
        this.swipe.cancel();
        return;
      }
      const surface = this.swipe.move(
        event.pointerId,
        event.clientX,
        event.clientY,
      );
      if (surface) this.game.triggerSurfaceShift(surface);
    });
    canvasEl.addEventListener("pointerup", (event) => {
      if (this.game.state === "PLAYING") {
        const surface = this.swipe.move(
          event.pointerId,
          event.clientX,
          event.clientY,
        );
        if (surface) this.game.triggerSurfaceShift(surface);
      }
      this.swipe.cancel();
    });
    canvasEl.addEventListener("pointercancel", () => this.swipe.cancel());
    canvasEl.addEventListener("lostpointercapture", () => this.swipe.cancel());
    document.querySelectorAll("[data-nudge]").forEach((button) =>
      button.addEventListener("click", () => {
        if (this.game.state === "PLAYING")
          this.game.gravitySys.nudgeLateral(Number(button.dataset.nudge));
      }),
    );

    // On-Screen 4G Directional Pad Buttons
    document.querySelectorAll(".surface-pad-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const surfKey = btn.getAttribute("data-surface");
        if (this.game.state === "PLAYING" && surfKey) {
          this.game.triggerSurfaceShift(surfKey);
        }
      });
    });

    // Main Menu & Gameplay Buttons
    document.getElementById("btn-start-game").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.startNewRun();
    });

    document.getElementById("btn-pause-game").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.pauseGame();
    });

    document.getElementById("btn-resume-game").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.resumeGame();
    });

    document
      .getElementById("btn-restart-pause")
      .addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.game.startNewRun({
          mode: this.game.runMode,
          challengeDate: this.game.challengeDate,
        });
      });

    document.getElementById("btn-quit-pause").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.returnToMainMenu();
    });

    document.getElementById("btn-retry-game").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.startNewRun({
        instant: true,
        mode: this.game.runMode,
        challengeDate: this.game.challengeDate,
      });
    });

    document
      .getElementById("btn-gameover-menu")
      .addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.game.returnToMainMenu();
      });

    // Emergency Shield Revive
    document
      .getElementById("btn-revive-shield")
      .addEventListener("click", () => {
        if (!this.game.continueRun({ useEnergy: true }))
          this.game.ui.showToast("NECESITAS 50 DE ENERGÍA O YA HAS CONTINUADO");
      });

    document
      .getElementById("btn-reward-continue")
      .addEventListener("click", () => {
        if (this.game.state !== "GAMEOVER" || this.game.scoreMgr.reviveUsed)
          return;
        const runId = this.game.runId,
          button = document.getElementById("btn-reward-continue");
        button.disabled = true;
        this.game.adService.requestRewardedAd({
          placementName: "continue_run",
          onRewardGranted: () => {
            if (this.game.runId === runId) this.game.continueRun();
            button.disabled = false;
          },
          onAdDismissed: () => {
            button.disabled = false;
          },
          onProviderUnavailable: () => {
            button.disabled = false;
            this.game.ui.showToast("ANUNCIO NO DISPONIBLE");
          },
        });
      });

    // 3D Hangar Shop Modal & Controls
    document.getElementById("btn-open-shop").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.ui.openHangarModal();
    });

    document.getElementById("btn-close-shop").addEventListener("click", () => {
      this.game.audio.playUIClick();
      this.game.hangarStudio.isActive = false;
      document.getElementById("modal-shop").classList.add("hidden");
      this.game.ui.refreshAllUI();
    });

    document
      .getElementById("btn-preview-pose")
      .addEventListener("click", (e) => {
        this.game.audio.playUIClick();
        this.game.hangarStudio.poseMode =
          this.game.hangarStudio.poseMode === "RUN" ? "IDLE" : "RUN";
        e.currentTarget.textContent = `POSE: ${this.game.hangarStudio.poseMode === "RUN" ? "CARRERA" : "INSPECCIÓN"}`;
      });

    document.querySelectorAll(".shop-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.game.ui.activeShopFilter =
          btn.getAttribute("data-filter") || "ALL";
        document.querySelectorAll(".shop-filter-btn").forEach((b) => {
          b.classList.remove(
            "bg-cyan/20",
            "border-cyan",
            "text-cyan",
            "font-bold",
          );
        });
        btn.classList.add(
          "bg-cyan/20",
          "border-cyan",
          "text-cyan",
          "font-bold",
        );
        this.game.ui.renderShopItems();
      });
    });

    document
      .getElementById("btn-practice")
      .addEventListener("click", () =>
        this.game.startNewRun({ mode: "practice" }),
      );
    document.getElementById("btn-daily").addEventListener("click", () =>
      this.game.startNewRun({
        mode: "daily",
        challengeDate: this.game.linkChallenge
          ? this.game.challengeDate
          : dailyDate(),
      }),
    );
    document
      .getElementById("btn-share-daily")
      .addEventListener("click", () => this.game.ui.shareDaily());
    document
      .getElementById("btn-share-result")
      .addEventListener("click", () => this.game.ui.shareDaily());
    document.getElementById("btn-close-share").addEventListener("click", () => {
      document.getElementById("share-panel").hidden = true;
    });
    document
      .getElementById("btn-practice-menu")
      .addEventListener("click", () => this.game.returnToMainMenu());
    document
      .getElementById("btn-practice-play")
      .addEventListener("click", () =>
        this.game.startNewRun({ mode: "normal" }),
      );
    document
      .getElementById("btn-save-warning")
      .addEventListener("click", () => this.game.ui.exportSave());
    document
      .getElementById("btn-export-save")
      .addEventListener("click", () => this.game.ui.exportSave());
    document
      .getElementById("btn-import-save")
      .addEventListener("click", () =>
        document.getElementById("inp-import-save").click(),
      );
    document.getElementById("btn-retry-save").addEventListener("click", () => {
      this.game.scoreMgr.persist();
      this.game.ui.updateSaveStatus();
    });
    document
      .getElementById("inp-import-save")
      .addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          if (file.size > MAX_BACKUP_BYTES)
            throw new Error("La copia supera el tamaño permitido");
          this.game.ui.importSave(await file.text());
        } catch (error) {
          this.game.ui.showToast(
            error.message || "No se pudo importar la copia",
          );
        } finally {
          event.target.value = "";
        }
      });

    document
      .getElementById("btn-export-report")
      .addEventListener("click", () =>
        this.game.ui.triggerFileDownload(
          "gravity-shift-playtest.json",
          this.game.metrics.export(),
          "application/json",
        ),
      );
    const adTestButton = document.getElementById("btn-test-ads");
    adTestButton.hidden = !Capacitor.isNativePlatform();
    document.getElementById("btn-ad-privacy").hidden =
      !Capacitor.isNativePlatform();
    adTestButton.addEventListener("click", async () => {
      adTestButton.disabled = true;
      try {
        const ready = await enableNativeTestAds(this.game.adService);
        document.getElementById("native-ad-status").textContent = ready
          ? "Anuncios de prueba listos. No generan ingresos."
          : "No se pueden solicitar anuncios en este momento.";
      } catch {
        document.getElementById("native-ad-status").textContent =
          "No se pudieron preparar los anuncios de prueba.";
      } finally {
        adTestButton.disabled = false;
      }
    });
    document
      .getElementById("btn-ad-privacy")
      .addEventListener("click", async () => {
        try {
          await reviewAdPrivacy();
        } catch {
          this.game.ui.showToast(
            "LAS OPCIONES DE PRIVACIDAD NO ESTÁN DISPONIBLES",
          );
        }
      });

    // Settings Modal
    document
      .getElementById("btn-open-settings")
      .addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.game.ui.openSettingsModal();
      });

    document
      .getElementById("btn-close-settings")
      .addEventListener("click", () => {
        this.game.audio.playUIClick();
        document.getElementById("modal-settings").classList.add("hidden");
      });

    const speedSlider = document.getElementById("inp-transition-speed");
    speedSlider.addEventListener("input", () => {
      document.getElementById("lbl-transition-speed").textContent =
        parseFloat(speedSlider.value).toFixed(2) + " s";
    });

    document
      .getElementById("btn-save-settings")
      .addEventListener("click", () => {
        this.game.audio.playUIClick();
        const s = this.game.scoreMgr.saveData.settings;
        s.transitionDuration =
          parseFloat(document.getElementById("inp-transition-speed").value) ||
          0.2;
        s.cameraMode = document.getElementById("sel-camera-mode").value;
        s.graphics = document.getElementById("sel-graphics").value;
        s.customSeed = document
          .getElementById("inp-custom-seed")
          .value.trim()
          .toUpperCase();
        s.music = document.getElementById("chk-music").checked;
        s.sfx = document.getElementById("chk-sfx").checked;
        s.touchpad = document.getElementById("chk-touchpad").checked;
        s.haptics = document.getElementById("chk-haptics").checked;
        s.localMetrics = document.getElementById("chk-local-metrics").checked;

        this.game.scoreMgr.persist();
        this.game.applySavedSettings();
        this.game.ui.refreshAllUI();
        document.getElementById("modal-settings").classList.add("hidden");
        this.game.ui.showToast("PARÁMETROS DEL SISTEMA ACTUALIZADOS");
      });

    document.getElementById("btn-reset-save").addEventListener("click", () => {
      if (
        !window.confirm(
          "¿Borrar el progreso de este navegador? Exporta una copia antes si quieres conservarlo.",
        )
      )
        return;
      if (this.game.scoreMgr.store.remove() === false) {
        this.game.scoreMgr.saveStatus = "error";
        this.game.ui.updateSaveStatus();
        this.game.ui.showToast("NO SE PUDO BORRAR EL PROGRESO");
        return;
      }
      this.game.scoreMgr.loadSaveData();
      this.game.scoreMgr.persist();
      this.game.applySavedSettings();
      this.game.ui.refreshAllUI();
      document.getElementById("modal-settings").classList.add("hidden");
      this.game.ui.showToast("PROGRESO REINICIADO A VALORES DE FÁBRICA");
    });

    document.getElementById("btn-quick-mute").addEventListener("click", () => {
      this.game.audio.isMuted = !this.game.audio.isMuted;
      const icon = document.getElementById("icon-quick-mute");
      icon.className = this.game.audio.isMuted
        ? "fa-solid fa-volume-xmark text-hazard"
        : "fa-solid fa-volume-high text-cyan";
      if (this.game.audio.isMuted) this.game.audio.stopMusic();
      else if (this.game.state === "PLAYING") this.game.audio.startMusic();
    });

    // Architecture & GitHub Code Exporter Modal
    this.game.ui.activeExportTab = "html";

    document.getElementById("btn-open-arch").addEventListener("click", () => {
      this.game.audio.playUIClick();
      document.getElementById("modal-arch").classList.remove("hidden");
      this.game.ui.updateExportViewer(this.game.ui.activeExportTab);
    });
    document.getElementById("btn-close-arch").addEventListener("click", () => {
      this.game.audio.playUIClick();
      document.getElementById("modal-arch").classList.add("hidden");
    });

    document.querySelectorAll(".export-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.game.audio.playUIClick();
        const tab = btn.getAttribute("data-export-tab") || "html";
        this.game.ui.activeExportTab = tab;
        document.querySelectorAll(".export-tab-btn").forEach((b) => {
          b.classList.remove(
            "bg-cyan/20",
            "border-cyan",
            "text-cyan",
            "font-bold",
          );
        });
        btn.classList.add(
          "bg-cyan/20",
          "border-cyan",
          "text-cyan",
          "font-bold",
        );
        this.game.ui.updateExportViewer(tab);
      });
    });

    document.getElementById("btn-copy-export").addEventListener("click", () => {
      this.game.audio.playUIClick();
      const textarea = document.getElementById("export-code-textarea");
      textarea.select();
      document.execCommand("copy");
      this.game.ui.showToast(
        `CÓDIGO DE ${this.game.ui.activeExportTab.toUpperCase()} COPIADO AL PORTAPAPELES`,
      );
    });

    document.getElementById("btn-dl-html").addEventListener("click", () => {
      this.game.audio.playUIClick();
      const files = this.game.ui.generateSeparatedGitHubFiles();
      this.game.ui.triggerFileDownload("index.html", files.html, "text/html");
      this.game.ui.showToast("DESCARGANDO index.html");
    });

    document.getElementById("btn-dl-css").addEventListener("click", () => {
      this.game.audio.playUIClick();
      const files = this.game.ui.generateSeparatedGitHubFiles();
      this.game.ui.triggerFileDownload("styles.css", files.css, "text/css");
      this.game.ui.showToast("DESCARGANDO styles.css");
    });

    document.getElementById("btn-dl-js").addEventListener("click", () => {
      this.game.audio.playUIClick();
      const files = this.game.ui.generateSeparatedGitHubFiles();
      this.game.ui.triggerFileDownload(
        "game.js",
        files.js,
        "application/javascript",
      );
      this.game.ui.showToast("DESCARGANDO game.js");
    });

    document.getElementById("btn-dl-bundle").addEventListener("click", () => {
      this.game.audio.playUIClick();
      const clean = document.documentElement.cloneNode(true);
      this.game.ui.cleanExportDOM(clean);
      const fullHtml = "<!DOCTYPE html>\n" + clean.outerHTML;
      this.game.ui.triggerFileDownload("index.html", fullHtml, "text/html");
      this.game.ui.showToast("DESCARGANDO VERSIÓN AUTOCONTENIDA index.html");
    });
  }
}
