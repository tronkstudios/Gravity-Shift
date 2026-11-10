import {
  ITEM_TYPES,
  ITEM_META,
  upgradeCost,
  buyUpgrade,
  buyBoard,
} from "../data/items.js";
export class Workshop {
  constructor(game) {
    this.game = game;
  }
  bind() {
    document.getElementById("btn-open-workshop").onclick = () => this.open();
    document.getElementById("btn-close-workshop").onclick = () => {
      document.getElementById("modal-workshop").classList.add("hidden");
      this.game.ui.refreshAllUI();
    };
    document
      .getElementById("workshop-cards")
      .addEventListener("click", (event) => {
        const button = event.target.closest?.(
          "[data-upgrade],[data-buy-board]",
        );
        if (!button) return;
        const profile = this.game.scoreMgr.saveData;
        const bought = button.hasAttribute("data-buy-board")
          ? buyBoard(profile)
          : buyUpgrade(profile, button.dataset.upgrade);
        if (bought) {
          this.game.scoreMgr.persist();
          this.game.audio.playUIClick();
          this.game.ui.showToast("COMPRA GUARDADA", 2);
          this.render();
          this.game.ui.refreshAllUI();
        }
      });
  }
  open() {
    this.render();
    document.getElementById("modal-workshop").classList.remove("hidden");
  }
  render() {
    const profile = this.game.scoreMgr.saveData;
    document.getElementById("workshop-balance").textContent =
      profile.totalEnergy;
    document.getElementById("workshop-cards").innerHTML =
      ITEM_TYPES.map((type) => {
        const item = ITEM_META[type],
          level = profile.upgrades?.[type] || 0,
          cost = upgradeCost(profile, type);
        return `<article class="workshop-card"><span class="item-symbol item-${type}">${{ magnet: "∩", board: "▰", multiplier: "×2", boots: "↑↑" }[type]}</span><h3>${item.name}</h3><p>${item.description}</p><b>Nivel ${level}/3 · ${item.base + level * 2} segundos</b><button class="brutal-btn" data-upgrade="${type}" ${cost === null || profile.totalEnergy < cost ? "disabled" : ""}>${cost === null ? "MÁXIMO NIVEL" : `MEJORAR · ⚡ ${cost}`}</button></article>`;
      }).join("") +
      `<article class="workshop-card reserve-board"><h3>TABLAS DE RESERVA</h3><p>Llevas ${profile.inventory?.boards || 0}. Activa una con B o el botón TABLA durante una partida normal.</p><button class="brutal-btn" data-buy-board ${profile.totalEnergy < 60 || (profile.inventory?.boards || 0) >= 50 ? "disabled" : ""}>COMPRAR TABLA · ⚡ 60</button></article>`;
  }
}
