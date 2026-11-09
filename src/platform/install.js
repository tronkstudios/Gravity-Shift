import { Capacitor } from "@capacitor/core";
export class InstallSupport {
  constructor(game) {
    this.game = game;
    this.prompt = null;
    this.acceptUpdate = false;
  }
  async start() {
    const status = document.getElementById("offline-status");
    document
      .getElementById("btn-install")
      .addEventListener("click", async () => {
        if (this.prompt) {
          await this.prompt.prompt();
          await this.prompt.userChoice;
          this.prompt = null;
        } else
          this.game.ui.showToast(
            "En el menú del navegador, elige Instalar o Añadir a pantalla de inicio.",
          );
      });
    if (Capacitor.isNativePlatform()) {
      status.textContent = "Recursos instalados en la app";
      document.getElementById("btn-install").hidden = true;
      return;
    }
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.prompt = event;
    });
    if (!("serviceWorker" in navigator)) {
      status.textContent = "Este navegador no permite instalación sin conexión";
      return;
    }
    try {
      this.registration = await navigator.serviceWorker.register("./sw.js");
      const waiting = () => {
        if (this.registration.waiting)
          document.getElementById("btn-update").hidden = false;
      };
      waiting();
      this.registration.addEventListener("updatefound", () => {
        const worker = this.registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed") waiting();
        });
      });
      document.getElementById("btn-update").addEventListener("click", () => {
        if (this.game.state === "PLAYING") this.game.pauseGame();
        this.game.scoreMgr.persist();
        this.acceptUpdate = true;
        this.registration.waiting?.postMessage({ type: "ACTIVATE_UPDATE" });
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (this.acceptUpdate) window.location.reload();
      });
      await navigator.serviceWorker.ready;
      status.textContent = "Recursos listos sin conexión";
    } catch {
      status.textContent = "No se pudo preparar el modo sin conexión";
    }
  }
}
