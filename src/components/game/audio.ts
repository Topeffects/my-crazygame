// Retro WebAudio synth: SFX + adaptive chiptune music.
// All sounds synthesized — no external files.

type OscType = OscillatorType;

// ---------- Music composition ----------
// 8 bars x 16 steps. 0 = rest.
const MAJ_ROOTS = [130.81, 98.0, 110.0, 87.31, 130.81, 98.0, 87.31, 98.0]; // C G Am F C G F G
const MAJ_QUAL = ["maj", "maj", "min", "maj", "maj", "maj", "maj", "maj"];
const MAJ_LEAD = [
  659, 0, 784, 0, 1047, 0, 784, 0, 880, 0, 784, 0, 659, 0, 587, 0,
  784, 0, 988, 0, 1175, 0, 988, 0, 1047, 0, 988, 784, 0, 659, 0, 0,
  880, 0, 1047, 0, 1319, 0, 1047, 0, 1175, 0, 1047, 880, 0, 784, 0, 0,
  880, 0, 1047, 0, 880, 0, 784, 0, 659, 0, 784, 880, 0, 0, 0, 0,
  659, 0, 784, 0, 1047, 0, 1319, 0, 1568, 0, 1319, 1047, 0, 880, 0, 0,
  1175, 0, 1047, 0, 988, 0, 1047, 0, 1175, 0, 1319, 0, 1175, 1047, 988, 0,
  1047, 0, 880, 0, 784, 0, 880, 0, 1047, 0, 784, 0, 659, 0, 587, 0,
  784, 880, 988, 1047, 1175, 0, 1047, 988, 880, 0, 784, 0, 659, 0, 784, 0,
];
const MIN_ROOTS = [110.0, 110.0, 87.31, 87.31, 130.81, 98.0, 110.0, 82.41]; // Am Am F F C G Am E
const MIN_QUAL = ["min", "min", "maj", "maj", "maj", "maj", "min", "maj"];
const MIN_LEAD = [
  880, 0, 784, 0, 659, 0, 523, 0, 587, 0, 659, 0, 784, 0, 0, 0,
  880, 0, 1047, 0, 880, 0, 784, 0, 659, 0, 587, 0, 523, 0, 0, 0,
  698, 0, 880, 0, 1047, 0, 880, 0, 784, 0, 698, 0, 659, 0, 0, 0,
  880, 0, 784, 0, 698, 0, 659, 0, 587, 0, 523, 0, 587, 0, 0, 0,
  659, 0, 784, 0, 1047, 0, 784, 0, 880, 0, 784, 659, 0, 587, 0, 0,
  988, 0, 880, 0, 784, 0, 659, 0, 784, 0, 988, 0, 880, 0, 0, 0,
  880, 0, 659, 0, 523, 0, 587, 0, 659, 0, 784, 0, 880, 0, 0, 0,
  988, 0, 880, 784, 0, 659, 0, 587, 494, 0, 659, 0, 587, 0, 494, 0,
];

class RetroAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  enabled = true;
  private musicTimer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private musicMode: "major" | "minor" = "major";
  private musicSparkle = false;
  tempoScale = 1;

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  unlock() {
    this.ensure();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.02);
    }
    if (!v) this.stopMusic();
  }

  private tone(
    freq: number,
    dur: number,
    type: OscType = "square",
    vol = 1,
    slideTo?: number,
    delay = 0
  ) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol = 1, delay = 0, lowpass = 1200) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  }

  // ---------- SFX ----------
  jump(big: boolean) {
    this.tone(big ? 180 : 220, 0.18, "square", 0.5, big ? 660 : 880);
  }
  coin() {
    this.tone(988, 0.09, "square", 0.45);
    this.tone(1319, 0.32, "square", 0.45, undefined, 0.09);
  }
  stomp() {
    this.noise(0.16, 0.7, 0, 900);
    this.tone(320, 0.12, "triangle", 0.6, 90);
  }
  kick() {
    this.tone(500, 0.12, "sawtooth", 0.4, 1200);
  }
  bump() {
    this.tone(140, 0.12, "square", 0.6, 90);
    this.noise(0.08, 0.3, 0, 600);
  }
  brick() {
    this.noise(0.28, 0.8, 0, 2400);
    this.tone(220, 0.15, "sawtooth", 0.35, 60);
  }
  sprout() {
    this.tone(300, 0.35, "sine", 0.5, 900);
  }
  powerup() {
    const seq = [523, 659, 784, 1047, 1319, 1568];
    seq.forEach((f, i) => this.tone(f, 0.12, "square", 0.4, undefined, i * 0.07));
  }
  shrink() {
    const seq = [800, 600, 450, 300, 200];
    seq.forEach((f, i) => this.tone(f, 0.12, "sawtooth", 0.35, undefined, i * 0.07));
  }
  fireball() {
    this.tone(880, 0.12, "sawtooth", 0.35, 220);
  }
  oneUp() {
    const seq = [659, 784, 1319, 1047, 1175, 1568];
    seq.forEach((f, i) => this.tone(f, 0.14, "square", 0.4, undefined, i * 0.09));
  }
  death() {
    const seq = [494, 466, 440, 415, 392, 330, 262];
    seq.forEach((f, i) => this.tone(f, 0.16, "square", 0.45, undefined, i * 0.11));
    this.tone(120, 0.6, "triangle", 0.5, 40, 0.7);
  }
  flag() {
    const seq = [392, 523, 659, 784, 1047, 1319, 1568, 2093];
    seq.forEach((f, i) => this.tone(f, 0.13, "square", 0.4, undefined, i * 0.08));
  }
  castle() {
    const seq = [523, 659, 784, 1047, 784, 1047];
    seq.forEach((f, i) => this.tone(f, 0.18, "triangle", 0.5, undefined, i * 0.13));
  }
  warning() {
    for (let i = 0; i < 3; i++) {
      this.tone(660, 0.12, "square", 0.5, undefined, i * 0.18);
      this.tone(440, 0.12, "square", 0.5, undefined, i * 0.18 + 0.09);
    }
  }
  checkpoint() {
    this.tone(784, 0.12, "square", 0.4);
    this.tone(1047, 0.25, "square", 0.4, undefined, 0.12);
  }
  select() {
    this.tone(660, 0.08, "square", 0.35, 990);
  }
  gameOver() {
    const seq = [392, 370, 349, 330, 294, 262, 247, 220];
    seq.forEach((f, i) => this.tone(f, 0.22, "triangle", 0.5, undefined, i * 0.16));
  }
  hurt() {
    this.tone(400, 0.25, "sawtooth", 0.5, 80);
  }

  // ---------- MUSIC ----------
  // Full chiptune band: lead + arpeggio + walking bass + kick/snare/hats.
  // Major mode for bright worlds, minor mode for dark worlds.
  startMusic(mode?: "major" | "minor", sparkle?: boolean) {
    if (mode) this.musicMode = mode;
    if (sparkle !== undefined) this.musicSparkle = sparkle;
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    this.step = 0;
    this.tempoScale = 1;
    this.nextTime = this.ctx.currentTime + 0.06;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const baseStep = 0.148; // ~202bpm 16ths
      const stepDur = baseStep / this.tempoScale;
      while (this.nextTime < this.ctx.currentTime + 0.25) {
        this.scheduleStep(this.step, this.nextTime, stepDur);
        this.nextTime += stepDur;
        this.step = (this.step + 1) % 128;
      }
      this.musicTimer = window.setTimeout(tick, 60);
    };
    tick();
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private mtone(freq: number, t: number, dur: number, type: OscType, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  private mnoise(t: number, dur: number, vol: number, freq: number, type: BiquadFilterType) {
    if (!this.ctx || !this.musicGain) return;
    if (!this.noiseBuf) {
      const len = Math.floor(this.ctx.sampleRate * 0.25);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const flt = this.ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.musicGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private mkick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.16);
  }

  private msnare(t: number) {
    this.mnoise(t, 0.1, 0.4, 1800, "highpass");
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 190;
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.1);
  }

  private mhat(t: number, open: boolean) {
    this.mnoise(t, open ? 0.14 : 0.035, open ? 0.16 : 0.1, 7000, "highpass");
  }

  private scheduleStep(step: number, t: number, stepDur: number) {
    const minor = this.musicMode === "minor";
    const ROOTS = minor ? MIN_ROOTS : MAJ_ROOTS;
    const QUAL = minor ? MIN_QUAL : MAJ_QUAL;
    const LEAD = minor ? MIN_LEAD : MAJ_LEAD;
    const bar = Math.floor(step / 16) % 8;
    const s = step % 16;
    const root = ROOTS[bar];

    // drums: four-on-floor kick, backbeat snare, 8th hats
    if (s % 4 === 0) this.mkick(t);
    if (s === 4 || s === 12) this.msnare(t);
    if (s % 2 === 0) this.mhat(t, s === 14);

    // walking bass
    if (s % 4 === 0) this.mtone(root, t, stepDur * 3.2, "triangle", 0.85);
    else if (s === 10) this.mtone(root * 1.5, t, stepDur * 1.6, "triangle", 0.5);
    else if (s === 6 || s === 14) this.mtone(root * 2, t, stepDur * 1.2, "triangle", 0.45);

    // shimmering chord arpeggio
    const third = QUAL[bar] === "minor" ? 1.1892 : 1.2599;
    const arpNotes = [root * 4, root * 4 * third, root * 4 * 1.4983, root * 8];
    const arpPat = [0, 1, 2, 3, 2, 1];
    this.mtone(arpNotes[arpPat[step % 6]], t, stepDur * 1.1, "sine", 0.1);
    // snow sparkle: high music-box shimmer
    if (this.musicSparkle && s % 4 === 2) this.mtone(root * 8 * third, t, stepDur * 2, "sine", 0.06);

    // lead melody
    const f = LEAD[step % 128];
    if (f) this.mtone(f, t, stepDur * 1.9, minor ? "triangle" : "square", minor ? 0.6 : 0.42);
  }
}

export const audio = new RetroAudio();
