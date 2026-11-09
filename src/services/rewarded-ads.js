/** Optional ad bridge. No provider means no ads and no synthetic rewards. */
export class RewardedAdService {
  constructor() {
    this.externalProvider = null;
    this.busy = false;
  }
  registerProvider(provider) {
    if (typeof provider?.showRewardedAd === "function")
      this.externalProvider = provider;
  }
  isProviderAvailable() {
    return !!this.externalProvider || typeof window.adBreak === "function";
  }
  getProviderStatusText() {
    const ready = this.isProviderAvailable();
    return {
      ready,
      label: ready ? "ANUNCIOS DISPONIBLES" : "SIN PROVEEDOR DE ANUNCIOS",
      detail: ready
        ? "La recompensa se concede solo al completar el anuncio."
        : "No se solicitan anuncios ni se conceden recompensas publicitarias. Conecta un proveedor real para activarlos.",
    };
  }
  requestRewardedAd({
    placementName = "unlock_skin",
    onRewardGranted,
    onAdDismissed,
    onProviderUnavailable,
  }) {
    if (this.busy) {
      onProviderUnavailable?.();
      return false;
    }
    if (!this.isProviderAvailable()) {
      onProviderUnavailable?.();
      return false;
    }
    this.busy = true;
    let settled = false;
    const finish = (kind) => {
      if (settled) return;
      settled = true;
      this.busy = false;
      if (kind === "reward") onRewardGranted?.();
      else if (kind === "dismissed") onAdDismissed?.();
      else onProviderUnavailable?.();
    };
    try {
      if (this.externalProvider) {
        const result = this.externalProvider.showRewardedAd({
          placementName,
          onReward: () => finish("reward"),
          onCancel: () => finish("dismissed"),
          onError: () => finish("unavailable"),
        });
        if (result?.catch) result.catch(() => finish("unavailable"));
      } else {
        let viewed = false;
        window.adBreak({
          type: "reward",
          name: placementName,
          beforeReward: (show) => show(),
          adViewed: () => {
            viewed = true;
          },
          adDismissed: () => {
            if (!viewed) finish("dismissed");
          },
          adBreakDone: (info) => {
            if (viewed && info?.breakStatus === "viewed") finish("reward");
            else finish("unavailable");
          },
        });
      }
    } catch {
      finish("unavailable");
      return false;
    }
    return true;
  }
}
