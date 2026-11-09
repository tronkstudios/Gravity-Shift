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
  cancelFeedback() {
    clearTimeout(this.perfectTimeout);
    this.perfectTimeout = null;
  }
  playPerfect() {
    this.cancelFeedback();
    this.playTone(880, "sine", 0.12, 0.1, 1320);
    this.perfectTimeout = setTimeout(
      () => this.playTone(1320, "sine", 0.18, 0.08, 1760),
      70,
    );
  }

  playFootstep(side = 1) {
    if (this.isMuted || !this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    this.stepNoise ??= (() => {
      const buffer = this.ctx.createBuffer(
          1,
          Math.floor(this.ctx.sampleRate * 0.055),
          this.ctx.sampleRate,
        ),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      return buffer;
    })();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.stepNoise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = side > 0 ? 750 : 620;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.055);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  playLanding() {
    this.playTone(95, "sine", 0.12, 0.045, 48);
  }
  updateFootsteps(player, gravity) {
    if (gravity.isTransitioning || player.isDead) {
      this.lastFootMarker = null;
      return;
    }
    const phase = player.currentRig?.captured
      ? player.rigAnimator.phase || 0
      : (player.runCycleTime / (Math.PI * 2)) % 1;
    const marker = Math.floor(phase * (player.currentRig?.captured ? 4 : 2));
    if (
      this.lastFootMarker !== null &&
      this.lastFootMarker !== undefined &&
      marker !== this.lastFootMarker
    )
      this.playFootstep(marker % 2 ? 1 : -1);
    this.lastFootMarker = marker;
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
