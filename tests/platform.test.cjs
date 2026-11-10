const { test } = require("node:test");
const assert = require("node:assert/strict");

test("diagnostic history remains local, bounded and removable", async () => {
  const { PlaytestMetrics } =
    await import("../src/services/playtest-metrics.js");
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
  const metrics = new PlaytestMetrics(() => storage);
  const game = {
    runMode: "NORMAL",
    scoreMgr: { elapsed: 10, distance: 100, collectedCoins: 3, perfects: 1 },
  };
  metrics.input(10);
  metrics.frame(0.02, null, 15);
  assert.equal(metrics.snapshot().meanInputSubmissionMs, 5);
  metrics.finish(game);
  assert.equal(values.size, 0);
  metrics.setEnabled(true);
  for (let i = 0; i < 60; i++) metrics.finish(game);
  assert.equal(JSON.parse(values.values().next().value).length, 50);
  metrics.setEnabled(false);
  assert.equal(values.size, 0);
});

test("haptics respect opt-in and suppress overlapping pulses", async () => {
  const { HapticFeedback } = await import("../src/services/haptic-feedback.js");
  let now = 0;
  const calls = [];
  const h = new HapticFeedback({
    vibrate: (p) => calls.push(p),
    now: () => now,
  });
  assert.equal(await h.play("perfect"), false);
  h.enabled = true;
  assert.equal(await h.play("perfect"), true);
  assert.equal(await h.play("crash"), false);
  now = 101;
  assert.equal(await h.play("crash"), true);
  assert.deepEqual(calls, [[12, 25, 12], [30]]);
});

async function bridge({ allowed = true, fail = false } = {}) {
  const { enableNativeTestAds } =
    await import("../src/native/admob-provider.js");
  const { RewardAdPluginEvents: events } =
    await import("@capacitor-community/admob");
  const handlers = new Map();
  let removed = 0,
    provider,
    options;
  const sdk = {
    initialize: async () => {},
    requestConsentInfo: async () => ({ canRequestAds: allowed }),
    addListener: async (name, cb) => {
      handlers.set(name, cb);
      return {
        remove: async () => {
          removed++;
        },
      };
    },
    prepareRewardVideoAd: async (o) => {
      options = o;
      if (fail) throw Error("offline");
    },
    showRewardVideoAd: async () => {},
  };
  const enabled = await enableNativeTestAds(
    { registerProvider: (p) => (provider = p) },
    sdk,
    "android",
  );
  return {
    enabled,
    handlers,
    events,
    get provider() {
      return provider;
    },
    get removed() {
      return removed;
    },
    get options() {
      return options;
    },
  };
}
test("native bridge withholds requests until consent allows them", async () => {
  const b = await bridge({ allowed: false });
  assert.equal(b.enabled, false);
  assert.equal(b.provider, undefined);
});
test("native test ad rewards only after a rewarded dismissal and cleans all listeners", async () => {
  const b = await bridge();
  let rewards = 0,
    cancels = 0;
  await b.provider.showRewardedAd({
    onReward: () => rewards++,
    onCancel: () => cancels++,
  });
  assert.equal(b.options.isTesting, true);
  assert.match(b.options.adId, /3940256099942544/);
  b.handlers.get(b.events.Rewarded)();
  assert.equal(rewards, 0);
  await b.handlers.get(b.events.Dismissed)();
  await b.handlers.get(b.events.Dismissed)();
  assert.equal(rewards, 1);
  assert.equal(cancels, 0);
  assert.equal(b.removed, 3);
});
test("native test ad cancellation and offline errors grant no rewards", async () => {
  for (const fail of [false, true]) {
    const b = await bridge({ fail });
    let rewards = 0,
      errors = 0,
      cancels = 0;
    await b.provider.showRewardedAd({
      onReward: () => rewards++,
      onCancel: () => cancels++,
      onError: () => errors++,
    });
    if (!fail) await b.handlers.get(b.events.Dismissed)();
    assert.equal(rewards, 0);
    assert.equal(fail ? errors : cancels, 1);
    assert.equal(b.removed, 3);
  }
});

test("tunnel batching preserves static geometry bounds and animated panels", async () => {
  const THREE = await import("three");
  const { batchTunnelSegments } =
    await import("../src/graphics/tunnel-batching.js");
  const mat = new THREE.MeshBasicMaterial(),
    geo = new THREE.BoxGeometry(1, 2, 3),
    segment = new THREE.Group();
  const a = new THREE.Mesh(geo, mat),
    b = new THREE.Mesh(geo, mat),
    dynamic = new THREE.Mesh(geo, mat);
  b.position.x = 4;
  dynamic.position.y = 4;
  segment.add(a, b, dynamic);
  segment.userData.servicePanels = [dynamic];
  const old = new THREE.Box3().setFromObject(segment);
  const result = batchTunnelSegments([segment]);
  const bounds = new THREE.Box3().setFromObject(segment);
  assert.equal(result.before, 2);
  assert.equal(result.after, 1);
  assert.equal(segment.children.length, 2);
  assert.equal(dynamic.parent, segment);
  assert.deepEqual(bounds.min.toArray(), old.min.toArray());
  assert.deepEqual(bounds.max.toArray(), old.max.toArray());
  dynamic.rotation.z = 0.1;
  assert.equal(dynamic.rotation.z, 0.1);
});
