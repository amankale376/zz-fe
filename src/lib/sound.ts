// Lightweight sound system for Zameen Zindabad.
// - One looping background music track (dark, cinematic, political)
// - Short SFX cues triggered on game events
// - Global mute toggle persisted to localStorage
//
// All assets are royalty-free CDN URLs (Pixabay / Mixkit) that allow hotlinking.

type SfxKey = "dice" | "step" | "buy" | "office" | "notify" | "betray" | "victory" | "election";

const SFX_URLS: Record<SfxKey, string> = {
  // Dice rattle / shake
  dice: "https://cdn.pixabay.com/audio/2022/03/15/audio_4cb5f08dd5.mp3",
  // Soft footstep / chess piece move
  step: "https://cdn.pixabay.com/audio/2022/03/10/audio_4f53b5d0fa.mp3",
  // Coins / purchase
  buy: "https://cdn.pixabay.com/audio/2022/03/15/audio_2c8d6a0e6b.mp3",
  // Hammer / construction stamp
  office: "https://cdn.pixabay.com/audio/2022/03/24/audio_8db8a2f8e3.mp3",
  // Notification ding
  notify: "https://cdn.pixabay.com/audio/2022/03/15/audio_2c8e1bb6f4.mp3",
  // Dramatic hit (betrayal)
  betray: "https://cdn.pixabay.com/audio/2022/10/04/audio_d39cd7b8b6.mp3",
  // Victory fanfare
  victory: "https://cdn.pixabay.com/audio/2022/03/15/audio_1a3a8b8d2c.mp3",
  // Election gavel / chime
  election: "https://cdn.pixabay.com/audio/2022/10/16/audio_5cabc1e8c4.mp3",
};

// Dark cinematic / political-thriller loop
const MUSIC_URL =
  "/audio/bgm.mp3";

const MUTE_KEY = "zz:muted";
const MUSIC_KEY = "zz:music";

let bgAudio: HTMLAudioElement | null = null;
const sfxCache = new Map<SfxKey, HTMLAudioElement>();
let audioCtx: AudioContext | null = null;
let bgOscillators: OscillatorNode[] = [];
let bgGain: GainNode | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function getAudioContext() {
  if (!isBrowser()) return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
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
      // ignore
    }
  }
}

function playSynthSfx(key: SfxKey, volume = 0.6) {
  const ctx = getAudioContext();
  if (!ctx || isMuted()) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const makeOsc = (type: OscillatorType, freq: number, detune = 0) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(gain);
    return osc;
  };

  // Lightweight synthesized cues per event
  const patterns: Record<SfxKey, { type: OscillatorType; f1: number; f2: number; dur: number }> = {
    dice: { type: "square", f1: 260, f2: 180, dur: 0.12 },
    step: { type: "triangle", f1: 190, f2: 150, dur: 0.08 },
    buy: { type: "sine", f1: 880, f2: 1160, dur: 0.16 },
    office: { type: "sawtooth", f1: 220, f2: 130, dur: 0.14 },
    notify: { type: "sine", f1: 780, f2: 980, dur: 0.1 },
    betray: { type: "sawtooth", f1: 180, f2: 90, dur: 0.18 },
    victory: { type: "triangle", f1: 520, f2: 780, dur: 0.24 },
    election: { type: "square", f1: 310, f2: 430, dur: 0.14 },
  };

  const p = patterns[key];
  const osc = makeOsc(p.type, p.f1);
  osc.frequency.linearRampToValueAtTime(p.f2, now + p.dur);
  gain.gain.linearRampToValueAtTime(Math.max(0.02, Math.min(0.2, volume * 0.18)), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur + 0.04);
  osc.start(now);
  osc.stop(now + p.dur + 0.05);
}

function startSynthMusic() {
  if (!isBrowser() || !isMusicEnabled() || isMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (bgOscillators.length > 0) return; // already running

  const gain = ctx.createGain();
  gain.gain.value = 0.03;
  gain.connect(ctx.destination);
  bgGain = gain;

  const root = 110;
  const freqs = [root, root * 1.5, root * 2];
  bgOscillators = freqs.map((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
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
      // ignore
    }
    o.disconnect();
  });
  bgOscillators = [];
  if (bgGain) {
    bgGain.disconnect();
    bgGain = null;
  }
}

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
  if (bgGain) bgGain.gain.value = muted ? 0 : 0.03;
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
    bgAudio.volume = 0.25;
    bgAudio.muted = isMuted();
  }
  // Play may reject until first user gesture — that's fine.
  bgAudio.play().catch(() => {
    // Fallback when CDN/audio loading fails.
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
  let base = sfxCache.get(key);
  if (!base) {
    base = new Audio(SFX_URLS[key]);
    base.preload = "auto";
    sfxCache.set(key, base);
  }
  // Clone so overlapping plays don't cut each other off
  try {
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = volume;
    node.play().catch(() => {
      playSynthSfx(key, volume);
    });
  } catch {
    playSynthSfx(key, volume);
  }
}

// Attach a one-time gesture handler to unlock audio on browsers
// that block autoplay until the user interacts.
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
