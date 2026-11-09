export class SeededRNG {
  constructor(seedString = "") {
    this.setSeed(seedString);
  }

  setSeed(seedString = "") {
    const clean = (seedString || "").trim().toUpperCase();
    this.seedLabel = clean || "AUTO-" + Math.floor(1000 + Math.random() * 9000);
    let h = 1779033703 ^ this.seedLabel.length;
    for (let i = 0; i < this.seedLabel.length; i++) {
      h = Math.imul(h ^ this.seedLabel.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    this.state = h >>> 0 || 123456789;
  }

  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}
