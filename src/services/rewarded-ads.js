export class RewardedAdService {
  constructor() {
    this.externalProvider = null;
  }

  registerProvider(providerObj) {
    if (providerObj && typeof providerObj.showRewardedAd === "function") {
      this.externalProvider = providerObj;
    }
  }

  isProviderAvailable() {
    if (this.externalProvider) return true;
    if (typeof window.adBreak === "function") return true;
    if (window.admob && typeof window.admob.rewardVideo?.show === "function")
      return true;
    return false;
  }

  getProviderStatusText() {
    if (this.isProviderAvailable()) {
      return {
        ready: true,
        label: "SDK CONECTADO",
        detail:
          "Proveedor de anuncios recompensados listo. Completa el vídeo para desbloquear permanentemente.",
      };
    }
    return {
      ready: false,
      label: "SDK NO DETECTADO EN ENTORNO LOCAL",
      detail:
        "Interfaz modular AdMob / H5 AdPlacement lista. Conecta un proveedor real (window.adBreak o adService.registerProvider) para emitir anuncios y desbloquear esta skin.",
    };
  }

  requestRewardedAd({
    placementName = "unlock_aether_valkyrie",
    onRewardGranted,
    onAdDismissed,
    onProviderUnavailable,
  }) {
    if (this.externalProvider) {
      this.externalProvider.showRewardedAd({
        placementName,
        onReward: () => {
          if (onRewardGranted) onRewardGranted();
        },
        onCancel: () => {
          if (onAdDismissed) onAdDismissed();
        },
      });
      return;
    }

    if (typeof window.adBreak === "function") {
      let rewardEarned = false;
      window.adBreak({
        type: "reward",
        name: placementName,
        beforeReward: (showAdFn) => {
          showAdFn();
        },
        adViewed: () => {
          rewardEarned = true;
          if (onRewardGranted) onRewardGranted();
        },
        adDismissed: () => {
          if (!rewardEarned && onAdDismissed) onAdDismissed();
        },
        adBreakDone: (placementInfo) => {
          if (
            placementInfo &&
            placementInfo.breakStatus !== "viewed" &&
            !rewardEarned
          ) {
            if (onAdDismissed) onAdDismissed();
          }
        },
      });
      return;
    }

    if (onProviderUnavailable) {
      onProviderUnavailable();
    }
  }
}
