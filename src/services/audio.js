import { ZONES } from "../data/run-content.js";
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.isMuted = false;
    this.musicInterval = null;
    this.stepIdx = 0;
    this.zone = ZONES[0];
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, gainVal = 0.12, slideFreq = null) {
    if (this.isMuted || !this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, slideFreq),
        now + duration,
      );
    }

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  setZone(zone) {
    this.zone = zone;
  }
  playPerfect() {
    this.playTone(880, "sine", 0.12, 0.1, 1320);
    setTimeout(() => this.playTone(1320, "sine", 0.18, 0.08, 1760), 70);
  }

  playUIClick() {
    this.playTone(720, "triangle", 0.06, 0.08, 980);
  }

  playShiftSound(surfaceKey) {
    const pitchMap = { FLOOR: 240, CEILING: 380, LEFT: 300, RIGHT: 340 };
    const base = pitchMap[surfaceKey] || 300;
    this.playTone(base, "sine", 0.16, 0.14, base * 1.65);
  }

  playEnergyPickup(multiplier = 1) {
    const base = 520 + Math.min(8, multiplier) * 55;
    this.playTone(base, "sine", 0.11, 0.12, base * 1.5);
  }

  playImpactCrash() {
    this.playTone(130, "sawtooth", 0.42, 0.22, 32);
  }

  startMusic() {
    this.stopMusic();
    if (this.isMuted || !this.musicEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49];
    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.musicEnabled || !this.ctx) return;
      const notes = this.zone?.notes || bassNotes;
      const note = notes[this.stepIdx % notes.length];
      this.stepIdx++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    }, 220);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
