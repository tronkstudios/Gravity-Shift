import { InstallSupport } from "./platform/install.js";
import { loadCapturedCharacter } from "./graphics/captured-character.js";
import { GravityShiftGame } from "./app/game.js";
window.addEventListener("load", async () => {
  let modelReady = false;
  try {
    await loadCapturedCharacter();
    modelReady = true;
  } catch (error) {
    console.warn("Modelo animado no disponible; usando rig básico", error);
  }

  try {
    window.gravityShiftGame = new GravityShiftGame();
    window.gravityShiftGame.loadSharedDaily();
    window.gravityShiftGame.modelReady = modelReady;
    new InstallSupport(window.gravityShiftGame).start();
    document.getElementById("loading-screen").hidden = true;
  } catch (error) {
    document.getElementById("loading-screen").hidden = true;
    console.error("Unable to start Gravity Shift", error);
    const message = document.createElement("div");
    message.className = "startup-error";
    message.setAttribute("role", "alert");
    message.textContent =
      "No se pudo iniciar el juego 3D. Comprueba que WebGL y la aceleración gráfica están disponibles y vuelve a cargar la página.";
    document.body.appendChild(message);
  }
});
