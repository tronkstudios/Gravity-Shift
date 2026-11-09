import { GravityShiftGame } from "./app/game.js";
window.addEventListener("load", () => {
  try {
    window.gravityShiftGame = new GravityShiftGame();
    window.gravityShiftGame.loadSharedDaily();
  } catch (error) {
    console.error("Unable to start Gravity Shift", error);
    const message = document.createElement("div");
    message.className = "startup-error";
    message.setAttribute("role", "alert");
    message.textContent =
      "No se pudo iniciar el juego 3D. Comprueba que WebGL y la aceleración gráfica están disponibles y vuelve a cargar la página.";
    document.body.appendChild(message);
  }
});
