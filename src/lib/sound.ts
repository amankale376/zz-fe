// Zameen Zindabad — procedural Web Audio sound engine.
// All SFX are synthesized on-the-fly (no CDN, no asset files), so they always
// play instantly and never fail on flaky networks. Background music still
// streams from /audio/bgm.mp3 (with a synth-pad fallback if the file can't
// load). Each cue is a short layered composition designed to feel Mughal-royal:
// tabla thumps, shehnai stabs, sitar drones, coin clinks, gavel strikes.

type SfxKey =
  | "dice"
  | "diceLand"
  | "step"
  | "buy"
  | "office"
  | "notify"
  | "betray"
  | "victory"
  | "election"
  | "policy"
  | "alliance"
  | "error"
  | "turn";

const MUSIC_URL = "/audio/bgm.mp3";
const MUTE_KEY = "zz:muted";
const MUSIC_KEY = "zz:music";

let bgAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let bgOscillators: OscillatorNode[] = [];
let bgGain: GainNode | null = null;
let masterGain: GainNode | null = null;
let musicDuck = 1; // 0..1 multiplier used to briefly duck bgm under SFX

function isBrowser() {
  return typeof window !== "undefined";
}

function getAudioContext(): AudioContext | null {
  if (!isBrowser()) return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function unlockAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

// ---- Low-level synth primitives ------------------------------------------

function envelope(
  ctx: AudioContext,
  dest: AudioNode,
  start: number,
  attack: number,
  peak: number,
  hold: number,
  release: number,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
  g.connect(dest);
  return g;
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  start: number,
  type: OscillatorType,
  fromFreq: number,
  toFreq: number,
  duration: number,
  peak: number,
  attack = 0.005,
) {
  const gain = envelope(
    ctx,
    dest,
    start,
    attack,
    peak,
    duration * 0.25,
    duration * 0.75,
  );
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, start);
  if (fromFreq !== toFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, toFreq),
      start + duration,
    );
  }
  osc.connect(gain);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  start: number,
  duration: number,
  peak: number,
  filterFreq = 1800,
  filterQ = 1,
) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = envelope(ctx, dest, start, 0.002, peak, duration * 0.1, duration);
  src.connect(filter);
  filter.connect(gain);
  src.start(start);
  src.stop(start + duration + 0.05);
}

// A small reverb-ish "wet" impulse tail for royalty
function wetMix(ctx: AudioContext): GainNode {
  const out = ctx.createGain();
  out.gain.value = 0.22;
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.06;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(out);
  out.connect(masterGain ?? ctx.destination);
  return delay;
}

// ---- SFX compositions ----------------------------------------------------

function duckMusic(ctx: AudioContext, amount: number, duration: number) {
  const now = ctx.currentTime;
  musicDuck = 1 - amount;
  if (bgAudio && !bgAudio.muted) {
    try {
      bgAudio.volume = Math.max(0, 0.28 * musicDuck);
    } catch {
      /* ignore */
    }
  }
  if (bgGain) {
    bgGain.gain.cancelScheduledValues(now);
    bgGain.gain.setTargetAtTime(0.03 * musicDuck, now, 0.05);
    bgGain.gain.setTargetAtTime(0.03, now + duration, 0.3);
  }
  window.setTimeout(() => {
    musicDuck = 1;
    if (bgAudio && !bgAudio.muted) {
      try {
        bgAudio.volume = 0.28;
      } catch {
        /* ignore */
      }
    }
  }, duration * 1000);
}

function play(key: SfxKey, volume: number) {
  const ctx = getAudioContext();
  if (!ctx || isMuted() || !masterGain) return;
  const t = ctx.currentTime;
  const v = Math.max(0, Math.min(1, volume));
  const dry = masterGain;
  const wet = wetMix(ctx);

  switch (key) {
    case "dice": {
      // Wooden rattle: 6 fast mid-high noise taps with slight pitch variance
      duckMusic(ctx, 0.3, 0.5);
      for (let i = 0; i < 7; i++) {
        const off = t + i * 0.055 + Math.random() * 0.02;
        noiseBurst(
          ctx,
          dry,
          off,
          0.045,
          0.12 * v,
          900 + Math.random() * 700,
          4,
        );
      }
      // Subtle table thud near the end
      tone(ctx, dry, t + 0.42, "sine", 90, 58, 0.18, 0.2 * v, 0.002);
      break;
    }
    case "diceLand": {
      // Final thunk when dice settle
      tone(ctx, dry, t, "sine", 140, 70, 0.22, 0.28 * v, 0.003);
      noiseBurst(ctx, dry, t, 0.07, 0.1 * v, 500, 2);
      break;
    }
    case "step": {
      // Soft tabla dhaa
      tone(ctx, dry, t, "sine", 160, 90, 0.11, 0.24 * v, 0.003);
      tone(ctx, dry, t, "triangle", 320, 210, 0.09, 0.09 * v, 0.003);
      break;
    }
    case "buy": {
      // Coin clink: two bright metallic blips with wet tail
      duckMusic(ctx, 0.35, 0.5);
      tone(ctx, dry, t, "triangle", 1320, 1100, 0.08, 0.18 * v, 0.002);
      tone(ctx, dry, t + 0.04, "sine", 1760, 1480, 0.12, 0.14 * v, 0.002);
      tone(ctx, wet, t + 0.06, "sine", 2200, 1800, 0.14, 0.08 * v, 0.002);
      break;
    }
    case "office": {
      // Hammer chime: percussive hit + bell
      duckMusic(ctx, 0.4, 0.7);
      noiseBurst(ctx, dry, t, 0.06, 0.22 * v, 220, 1);
      tone(ctx, dry, t + 0.02, "sine", 440, 330, 0.5, 0.18 * v, 0.004);
      tone(ctx, wet, t + 0.03, "triangle", 880, 660, 0.5, 0.1 * v, 0.004);
      break;
    }
    case "notify": {
      // Two-note ding
      tone(ctx, dry, t, "sine", 740, 740, 0.08, 0.18 * v, 0.003);
      tone(ctx, dry, t + 0.08, "sine", 990, 990, 0.14, 0.16 * v, 0.003);
      tone(ctx, wet, t + 0.08, "sine", 990, 990, 0.18, 0.08 * v, 0.003);
      break;
    }
    case "betray": {
      // Low gong + downward string slide
      duckMusic(ctx, 0.55, 1.2);
      tone(ctx, dry, t, "sine", 120, 55, 0.9, 0.32 * v, 0.004);
      tone(ctx, wet, t, "triangle", 240, 110, 0.9, 0.16 * v, 0.004);
      tone(ctx, dry, t + 0.1, "sawtooth", 420, 180, 0.7, 0.08 * v, 0.01);
      noiseBurst(ctx, dry, t, 0.25, 0.1 * v, 160, 1);
      break;
    }
    case "victory": {
      // Shehnai-flavored flourish — three rising tones with wet tail
      duckMusic(ctx, 0.5, 1.4);
      const notes = [440, 554, 659, 880]; // A4 C#5 E5 A5
      notes.forEach((f, i) => {
        tone(ctx, dry, t + i * 0.12, "triangle", f, f, 0.22, 0.22 * v, 0.005);
        tone(ctx, wet, t + i * 0.12, "sine", f * 2, f * 2, 0.25, 0.08 * v, 0.005);
      });
      // sustained root
      tone(ctx, wet, t + 0.48, "sine", 220, 220, 0.9, 0.1 * v, 0.02);
      break;
    }
    case "election": {
      // Gavel strike + shehnai chord
      duckMusic(ctx, 0.45, 0.9);
      noiseBurst(ctx, dry, t, 0.08, 0.22 * v, 280, 1.5);
      tone(ctx, dry, t, "sine", 140, 90, 0.18, 0.25 * v, 0.002);
      [392, 494, 587].forEach((f, i) => {
        tone(
          ctx,
          dry,
          t + 0.16 + i * 0.03,
          "triangle",
          f,
          f,
          0.45,
          0.14 * v,
          0.01,
        );
        tone(ctx, wet, t + 0.16 + i * 0.03, "sine", f, f, 0.55, 0.06 * v, 0.01);
      });
      break;
    }
    case "policy": {
      // Page-flip + soft chime
      noiseBurst(ctx, dry, t, 0.12, 0.1 * v, 3800, 6);
      tone(ctx, dry, t + 0.08, "sine", 880, 660, 0.2, 0.14 * v, 0.003);
      break;
    }
    case "alliance": {
      // Warm rising third
      tone(ctx, dry, t, "triangle", 392, 392, 0.2, 0.18 * v, 0.006);
      tone(ctx, dry, t + 0.08, "triangle", 494, 494, 0.22, 0.18 * v, 0.006);
      tone(ctx, wet, t + 0.08, "sine", 988, 988, 0.3, 0.08 * v, 0.006);
      break;
    }
    case "error": {
      tone(ctx, dry, t, "square", 220, 140, 0.16, 0.18 * v, 0.003);
      break;
    }
    case "turn": {
      // Soft "your move" cue
      tone(ctx, dry, t, "sine", 523, 523, 0.08, 0.16 * v, 0.003);
      tone(ctx, dry, t + 0.07, "sine", 784, 784, 0.16, 0.14 * v, 0.003);
      tone(ctx, wet, t + 0.07, "sine", 1568, 1568, 0.18, 0.06 * v, 0.003);
      break;
    }
  }
}

// ---- Background music (tamboura-esque drone fallback) --------------------

function startSynthMusic() {
  if (!isBrowser() || !isMusicEnabled() || isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;
  if (bgOscillators.length > 0) return;

  const gain = ctx.createGain();
  gain.gain.value = 0.025;
  gain.connect(masterGain);
  bgGain = gain;

  const root = 110; // A2
  // Root + fifth + octave + subtle detuned fifth = tamboura drone
  const voices: Array<{ freq: number; type: OscillatorType; detune: number }> = [
    { freq: root, type: "sine", detune: 0 },
    { freq: root, type: "sine", detune: -7 },
    { freq: root * 1.5, type: "triangle", detune: 0 },
    { freq: root * 2, type: "sine", detune: 3 },
  ];
  bgOscillators = voices.map((v) => {
    const osc = ctx.createOscillator();
    osc.type = v.type;
    osc.frequency.value = v.freq;
    osc.detune.value = v.detune;
    osc.connect(gain);
    osc.start();
    return osc;
  });
}

function stopSynthMusic() {
  if (bgOscillators.length === 0) return;
  bgOscillators.forEach((o) => {
    try {
      o.stop();
    } catch {
      /* ignore */
    }
    o.disconnect();
  });
  bgOscillators = [];
  if (bgGain) {
    bgGain.disconnect();
    bgGain = null;
  }
}

// ---- Public API ----------------------------------------------------------

export function isMuted(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function isMusicEnabled(): boolean {
  if (!isBrowser()) return true;
  return localStorage.getItem(MUSIC_KEY) !== "0";
}

export function setMuted(muted: boolean) {
  if (!isBrowser()) return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  if (bgAudio) bgAudio.muted = muted;
  if (bgGain) bgGain.gain.value = muted ? 0 : 0.025;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.9;
}

export function setMusicEnabled(enabled: boolean) {
  if (!isBrowser()) return;
  localStorage.setItem(MUSIC_KEY, enabled ? "1" : "0");
  if (!enabled) stopMusic();
  else startMusic();
}

export function startMusic() {
  if (!isBrowser() || !isMusicEnabled()) return;
  void unlockAudioContext();
  if (!bgAudio) {
    bgAudio = new Audio(MUSIC_URL);
    bgAudio.loop = true;
    bgAudio.volume = 0.28;
    bgAudio.muted = isMuted();
  }
  bgAudio.play().catch(() => {
    startSynthMusic();
  });
}

export function stopMusic() {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }
  stopSynthMusic();
}

export function playSfx(key: SfxKey, volume = 0.6) {
  if (!isBrowser() || isMuted()) return;
  void unlockAudioContext();
  try {
    play(key, volume);
  } catch {
    /* swallow — audio should never crash UI */
  }
}

export function primeAudioOnFirstGesture() {
  if (!isBrowser()) return;
  const unlock = async () => {
    await unlockAudioContext();
    startMusic();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
