import { Capacitor } from "@capacitor/core";
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";
export const TEST_REWARDED_IDS = {
  android: "ca-app-pub-3940256099942544/5224354917",
  ios: "ca-app-pub-3940256099942544/1712485313",
};
/** Opt-in test bridge; production identifiers are intentionally not configured. */
export async function enableNativeTestAds(
  service,
  sdk = AdMob,
  platform = Capacitor.getPlatform(),
) {
  if (!["android", "ios"].includes(platform)) return false;
  await sdk.initialize({ initializeForTesting: true });
  let consent = await sdk.requestConsentInfo();
  if (consent.isConsentFormAvailable && consent.status === "REQUIRED") {
    await sdk.showConsentForm();
    consent = await sdk.requestConsentInfo();
  }
  if (!consent.canRequestAds) return false;
  service.registerProvider({
    async showRewardedAd({ onReward, onCancel, onError }) {
      let earned = false,
        settled = false;
      const listeners = [];
      const finish = async (kind) => {
        if (settled) return;
        settled = true;
        await Promise.all(listeners.map((listener) => listener.remove()));
        if (kind === "reward") onReward();
        else if (kind === "cancel") onCancel();
        else onError?.();
      };
      try {
        listeners.push(
          await sdk.addListener(RewardAdPluginEvents.Rewarded, () => {
            earned = true;
          }),
        );
        listeners.push(
          await sdk.addListener(RewardAdPluginEvents.Dismissed, () =>
            finish(earned ? "reward" : "cancel"),
          ),
        );
        listeners.push(
          await sdk.addListener(RewardAdPluginEvents.FailedToShow, () =>
            finish("error"),
          ),
        );
        await sdk.prepareRewardVideoAd({
          adId: TEST_REWARDED_IDS[platform],
          isTesting: true,
        });
        await sdk.showRewardVideoAd();
      } catch {
        await finish("error");
      }
    },
  });
  return true;
}
export async function reviewAdPrivacy() {
  if (Capacitor.isNativePlatform()) await AdMob.showPrivacyOptionsForm();
}
