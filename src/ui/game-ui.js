import { ACHIEVEMENTS } from "../data/run-content.js";
import { SURFACES } from "../config/surfaces.js";
import { RARITY_META } from "../data/skins.js";
import { SKINS_CATALOG } from "../data/skins.js";

export class GameUI {
  constructor(game) {
    this.game = game;
    this.selectedShopSkinId = game.scoreMgr.saveData.equippedSkin;
    this.activeShopFilter = "ALL";
    this.activeExportTab = "html";
  }
  cleanExportDOM(root) {
    root
      .querySelectorAll('script[src="./vendor/three.min.js"]')
      .forEach((el) => {
        el.src =
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      });
    root
      .querySelectorAll("#canvas-container canvas")
      .forEach((el) => el.remove());
    root
      .querySelectorAll('[id^="modal-"], #screen-hud, #countdown, #danger-cue')
      .forEach((el) => el.classList.add("hidden"));
    root
      .querySelectorAll("#top-nav-bar, #screen-main-menu")
      .forEach((el) => el.classList.remove("hidden"));
    const toast = root.querySelector("#toast-msg");
    if (toast) toast.classList.add("opacity-0", "translate-y-4");
    const flash = root.querySelector("#screen-flash");
    if (flash) flash.style.opacity = "0";
    const text = root.querySelector("#export-code-textarea");
    if (text) {
      text.textContent = "";
      text.value = "";
    }
  }

  generateSeparatedGitHubFiles() {
    const root = document.documentElement.cloneNode(true);
    this.cleanExportDOM(root);
    const style = root.querySelector("head style");
    const script = root.querySelector("#engine-script");
    const css = style?.textContent.trim() || "";
    const js = script?.textContent.trim() || "";
    if (style) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "./styles.css";
      style.replaceWith(link);
    }
    if (script) {
      script.textContent = "";
      script.src = "./game.js";
    }
    return { html: "<!DOCTYPE html>\n" + root.outerHTML, css, js };
  }

  updateExportViewer(tab) {
    const files = this.generateSeparatedGitHubFiles();
    const textarea = document.getElementById("export-code-textarea");
    const copyLabel = document.getElementById("lbl-copy-export");
    if (tab === "css") {
      textarea.value = files.css;
      copyLabel.textContent = "COPIAR styles.css AL PORTAPAPELES";
    } else if (tab === "js") {
      textarea.value = files.js;
      copyLabel.textContent = "COPIAR game.js AL PORTAPAPELES";
    } else {
      textarea.value = files.html;
      copyLabel.textContent = "COPIAR index.html AL PORTAPAPELES";
    }
    textarea.scrollTop = 0;
  }

  triggerFileDownload(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  updateCompassUI(surfaceKey) {
    const surf = SURFACES[surfaceKey] || SURFACES.FLOOR;
    document.getElementById("hud-surface-name").textContent = surf.label;
    const arrow = document.getElementById("hud-compass-arrow");
    if (arrow) {
      arrow.style.transform = `rotate(${surf.compassArrowRot - 45}deg)`;
    }
  }

  flashScreen(colorCss) {
    const el = document.getElementById("screen-flash");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.backgroundColor = colorCss;
    el.style.opacity = "1";
    setTimeout(() => {
      el.style.opacity = "0";
    }, 140);
  }

  showToast(msg) {
    const toast = document.getElementById("toast-msg");
    toast.textContent = msg;
    toast.classList.remove("opacity-0", "translate-y-4");
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-4");
    }, 2500);
  }

  openSettingsModal() {
    const s = this.game.scoreMgr.saveData.settings;
    document.getElementById("inp-transition-speed").value =
      s.transitionDuration;
    document.getElementById("lbl-transition-speed").textContent =
      parseFloat(s.transitionDuration).toFixed(2) + " s";
    document.getElementById("sel-camera-mode").value = s.cameraMode;
    document.getElementById("sel-graphics").value = s.graphics;
    document.getElementById("inp-custom-seed").value = s.customSeed || "";
    document.getElementById("chk-music").checked = !!s.music;
    document.getElementById("chk-sfx").checked = !!s.sfx;
    document.getElementById("chk-touchpad").checked = !!s.touchpad;

    document.getElementById("modal-settings").classList.remove("hidden");
  }

  openHangarModal() {
    this.selectedShopSkinId = this.game.scoreMgr.saveData.equippedSkin;
    document.getElementById("modal-shop").classList.remove("hidden");
    this.game.hangarStudio.isActive = true;
    this.renderShopItems();
    this.selectHangarSkin(this.selectedShopSkinId);
    setTimeout(() => this.game.hangarStudio.resize(), 40);
  }

  selectHangarSkin(skinId) {
    const skin = SKINS_CATALOG.find((s) => s.id === skinId) || SKINS_CATALOG[0];
    this.selectedShopSkinId = skin.id;
    this.game.hangarStudio.loadSkinModel(skin);

    const save = this.game.scoreMgr.saveData;
    const isUnlocked = save.unlockedSkins.includes(skin.id);
    const isEquipped = save.equippedSkin === skin.id;
    const rMeta = RARITY_META[skin.rarity] || RARITY_META.COMMON;

    const rarityEl = document.getElementById("preview-skin-rarity");
    rarityEl.textContent = rMeta.label;
    rarityEl.style.color = rMeta.colorHex;
    rarityEl.style.backgroundColor = rMeta.badgeBg;
    rarityEl.style.borderColor = rMeta.colorHex;

    document.getElementById("preview-skin-name").textContent = skin.name;
    document.getElementById("preview-skin-subtitle").textContent =
      skin.subtitle;
    const achievement = ACHIEVEMENTS.find((a) => a.skin === skin.id);
    document.getElementById("preview-skin-desc").textContent =
      skin.description +
      (achievement
        ? " También se desbloquea gratis: " + achievement.label + "."
        : "");
    document.getElementById("preview-skin-poly").textContent = skin.polyTag;

    const statusEl = document.getElementById("preview-skin-status");
    statusEl.textContent = isEquipped
      ? "EQUIPADO ACTIVO"
      : isUnlocked
        ? "EN HANGAR"
        : "BLOQUEADO";
    statusEl.className = isUnlocked
      ? "text-cyan font-bold mt-0.5"
      : "text-amber-400 font-bold mt-0.5";

    const adBox = document.getElementById("preview-ad-sdk-box");
    if (skin.unlockType === "REWARDED_AD" && !isUnlocked) {
      adBox.classList.remove("hidden");
      const sdkInfo = this.game.adService.getProviderStatusText();
      document.getElementById("ad-sdk-status-pill").textContent = sdkInfo.label;
      document.getElementById("ad-sdk-status-msg").textContent = sdkInfo.detail;
    } else {
      adBox.classList.add("hidden");
    }

    const btn = document.getElementById("btn-preview-action");
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (isEquipped) {
      newBtn.className =
        "brutal-btn w-full py-3 rounded font-bold text-sm font-mono border-cyan text-cyan cursor-default";
      newBtn.innerHTML =
        '<i class="fa-solid fa-circle-check mr-1.5"></i> CHASIS EQUIPADO ACTUALMENTE';
    } else if (isUnlocked) {
      newBtn.className =
        "brutal-btn brutal-btn-primary w-full py-3 rounded font-bold text-sm font-mono flex items-center justify-center gap-2";
      newBtn.innerHTML =
        '<i class="fa-solid fa-user-check"></i> EQUIPAR ESTE CHASIS 3D';
      newBtn.addEventListener("click", () => {
        this.game.audio.playUIClick();
        save.equippedSkin = skin.id;
        this.game.scoreMgr.persist();
        this.game.player.applySkin(skin.id);
        this.selectHangarSkin(skin.id);
        this.renderShopItems();
        this.showToast(`CHASIS ${skin.name} EQUIPADO`);
      });
    } else if (skin.unlockType === "REWARDED_AD") {
      newBtn.className =
        "brutal-btn w-full py-3 rounded font-bold text-sm font-mono border-amber-400 text-amber-300 flex items-center justify-center gap-2";
      newBtn.innerHTML =
        '<i class="fa-solid fa-film"></i> VER ANUNCIO RECOMPENSADO PARA DESBLOQUEAR';
      newBtn.addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.game.adService.requestRewardedAd({
          placementName: "unlock_aether_valkyrie",
          onRewardGranted: () => {
            this.game.audio.playEnergyPickup(6);
            if (!save.unlockedSkins.includes(skin.id)) {
              save.unlockedSkins.push(skin.id);
            }
            save.equippedSkin = skin.id;
            this.game.scoreMgr.persist();
            this.game.player.applySkin(skin.id);
            this.selectHangarSkin(skin.id);
            this.renderShopItems();
            this.showToast(
              "¡RECOMPENSA PUBLICITARIA COMPLETADA! AETHER VALKYRIE DESBLOQUEADA",
            );
          },
          onAdDismissed: () => {
            this.showToast(
              "ANUNCIO CANCELADO: DEBES COMPLETAR EL VÍDEO PARA OBTENER LA SKIN",
            );
          },
          onProviderUnavailable: () => {
            this.showToast(
              "PROVEEDOR ADMOB / AD-SDK NO CONECTADO EN ESTE ENTORNO",
            );
          },
        });
      });
    } else {
      const canAfford = save.totalEnergy >= skin.cost;
      newBtn.className = `brutal-btn w-full py-3 rounded font-bold text-sm font-mono flex items-center justify-center gap-2 ${canAfford ? "brutal-btn-primary" : "opacity-45 cursor-not-allowed"}`;
      newBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> COMPRAR CHASIS 3D (${skin.cost} ENERGÍA)`;
      if (canAfford) {
        newBtn.addEventListener("click", () => {
          this.game.audio.playEnergyPickup(5);
          save.totalEnergy -= skin.cost;
          save.unlockedSkins.push(skin.id);
          save.equippedSkin = skin.id;
          this.game.scoreMgr.persist();
          this.game.player.applySkin(skin.id);
          this.selectHangarSkin(skin.id);
          this.renderShopItems();
          this.showToast(`¡${skin.name} CONSTRUIDO Y EQUIPADO!`);
        });
      }
    }
  }

  renderShopItems() {
    const container = document.getElementById("skins-container");
    const save = this.game.scoreMgr.saveData;
    document.getElementById("shop-energy-balance").textContent =
      save.totalEnergy;
    container.innerHTML = "";

    const filteredSkins = SKINS_CATALOG.filter((skin) => {
      if (this.activeShopFilter === "UNLOCKED")
        return save.unlockedSkins.includes(skin.id);
      if (this.activeShopFilter === "RARE")
        return skin.rarity === "COMMON" || skin.rarity === "RARE";
      if (this.activeShopFilter === "EPIC")
        return skin.rarity === "EPIC" || skin.rarity === "LEGENDARY";
      if (this.activeShopFilter === "SPECIAL")
        return skin.rarity === "MYTHIC" || skin.rarity === "AD_EXCLUSIVE";
      return true;
    });

    filteredSkins.forEach((skin) => {
      const isUnlocked = save.unlockedSkins.includes(skin.id);
      const isEquipped = save.equippedSkin === skin.id;
      const isSelected = this.selectedShopSkinId === skin.id;
      const rMeta = RARITY_META[skin.rarity] || RARITY_META.COMMON;

      const card = document.createElement("div");
      card.className = `p-3 rounded bg-void/90 border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
        isSelected
          ? "border-cyan shadow-[0_0_16px_rgba(0,217,255,0.3)] bg-steel/30"
          : isEquipped
            ? "border-cyan/60"
            : "border-steel hover:border-cyan/40"
      }`;

      const hexPrimary = "#" + skin.primaryColor.toString(16).padStart(6, "0");
      const hexSecondary =
        "#" + skin.secondaryColor.toString(16).padStart(6, "0");

      let priceBadge = "";
      if (isEquipped) {
        priceBadge = `<span class="text-[10px] font-mono font-bold text-cyan"><i class="fa-solid fa-check mr-1"></i>EQUIPADO</span>`;
      } else if (isUnlocked) {
        priceBadge = `<span class="text-[10px] font-mono text-coldwhite/70">DESBLOQUEADO</span>`;
      } else if (skin.unlockType === "REWARDED_AD") {
        priceBadge = `<span class="text-[10px] font-mono font-bold text-sky-400"><i class="fa-solid fa-film mr-1"></i>ANUNCIO AD</span>`;
      } else {
        priceBadge = `<span class="text-[11px] font-mono font-bold text-amber-400"><i class="fa-solid fa-bolt mr-1"></i>${skin.cost}</span>`;
      }

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold" style="color:${rMeta.colorHex}; background:${rMeta.badgeBg}">
              ${rMeta.label}
            </span>
            ${priceBadge}
          </div>
          <div class="text-base font-extrabold text-coldwhite leading-tight">${skin.name}</div>
          <div class="text-[10px] font-mono text-coldwhite/60 truncate">${skin.subtitle}</div><div class="achievement-hint">${ACHIEVEMENTS.find((a) => a.skin === skin.id)?.label || ""}</div>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-steel/60">
          <div class="flex items-center gap-1.5">
            <span class="w-4 h-4 rounded-sm border border-white/20" style="background:${hexPrimary}"></span>
            <span class="w-4 h-4 rounded-sm border border-white/20" style="background:${hexSecondary}"></span>
            <span class="w-4 h-4 rounded-full border border-white/40" style="background:${skin.glowHex}; box-shadow:0 0 6px ${skin.glowHex}"></span>
          </div>
          <span class="text-[9px] font-mono text-cyan uppercase">VISTA 3D <i class="fa-solid fa-cube ml-0.5"></i></span>
        </div>
      `;

      card.addEventListener("click", () => {
        this.game.audio.playUIClick();
        this.selectHangarSkin(skin.id);
        this.renderShopItems();
      });

      container.appendChild(card);
    });
  }

  refreshAllUI() {
    const save = this.game.scoreMgr.saveData;
    document.getElementById("achievement-progress").textContent =
      `${save.achievements.length} / ${ACHIEVEMENTS.length} HAZAÑAS`;
    const nextAchievement = ACHIEVEMENTS.find(
      (a) => !save.achievements.includes(a.id),
    );
    document.getElementById("next-achievement").textContent = nextAchievement
      ? nextAchievement.label + " → " + nextAchievement.skin.toUpperCase()
      : "Todas las hazañas completadas";
    const activeSkinObj =
      SKINS_CATALOG.find((s) => s.id === save.equippedSkin) || SKINS_CATALOG[0];

    document.getElementById("nav-energy-count").textContent =
      save.totalEnergy.toLocaleString();
    document.getElementById("nav-best-score").textContent =
      save.bestScore.toLocaleString();
    document.getElementById("menu-skins-unlocked").textContent =
      `${save.unlockedSkins.length}/${SKINS_CATALOG.length}`;
    document.getElementById("stat-best-dist").textContent =
      save.bestDistance + " m";
    document.getElementById("stat-active-skin").textContent =
      activeSkinObj.name;
    document.getElementById("stat-current-seed").textContent =
      save.settings.customSeed || "AUTO";
  }

  updateHUD() {
    this.updateCompassUI(this.game.gravitySys.targetSurface.id);
    const completed = this.game.scoreMgr.missionCompleted;
    const label = completed
      ? "RETO COMPLETADO · +75 ENERGÍA"
      : `RETO ${Math.floor(this.game.scoreMgr.distance)} / 250 m`;
    document.getElementById("mission-label").textContent = label;
    document.getElementById("mission-bar").style.width =
      Math.min(100, this.game.scoreMgr.distance / 2.5) + "%";
    const hazard = this.game.world.obstacles.some(
      (ob) =>
        ob.mesh.position.z < 0 &&
        ob.mesh.position.z > -this.game.currentSpeed * 1.1 &&
        (ob.type === "ROTATING" ||
          ob.surfaceKey === this.game.gravitySys.targetSurface.id),
    );
    const cue = document.getElementById("danger-cue");
    cue.classList.toggle("hidden", !hazard || this.game.state !== "PLAYING");
    const nextHazard = this.game.world.obstacles
      .filter(
        (ob) =>
          ob.mesh.position.z < 0 &&
          (ob.type === "ROTATING" ||
            ob.surfaceKey === this.game.gravitySys.targetSurface.id),
      )
      .sort((a, b) => b.mesh.position.z - a.mesh.position.z)[0];
    cue.textContent =
      nextHazard?.type === "ROTATING"
        ? "BARRA GIRATORIA · BUSCA EL HUECO"
        : nextHazard?.safeSurface
          ? "PELIGRO · VE A " + SURFACES[nextHazard.safeSurface].label
          : "PELIGRO · CAMBIA DE SUPERFICIE";
    document.querySelectorAll(".surface-pad-btn").forEach((btn) => {
      const active =
        btn.dataset.surface === this.game.gravitySys.targetSurface.id;
      btn.classList.toggle("surface-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    document.getElementById("hud-score").textContent = Math.floor(
      this.game.scoreMgr.score,
    ).toLocaleString();
    document.getElementById("hud-distance").textContent = Math.floor(
      this.game.scoreMgr.distance,
    );
    document.getElementById("hud-speed").textContent =
      Math.floor(this.game.currentSpeed) + " m/s";
    document.getElementById("hud-energy").textContent =
      this.game.scoreMgr.saveData.totalEnergy;
    document.getElementById("hud-multiplier").textContent =
      "x" + this.game.scoreMgr.multiplier.toFixed(1);
    document.getElementById("hud-mult-bar").style.width =
      Math.min(100, this.game.scoreMgr.streakProgress * 100) + "%";
  }
}
