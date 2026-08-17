let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function initAudio() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function isAudioEnabled(): boolean {
  return soundEnabled;
}

export function setAudioEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playBeep(freq: number, type: OscillatorType = 'sine', duration = 0.1, vol = 0.06) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // ignore
  }
}

export function playPlaceSound() {
  playBeep(440, 'triangle', 0.08, 0.08);
  setTimeout(() => playBeep(587.33, 'triangle', 0.1, 0.08), 70);
  setTimeout(() => playBeep(880, 'sine', 0.16, 0.1), 140);
}

export function playCashSound() {
  playBeep(987.77, 'sine', 0.06, 0.04);
  setTimeout(() => playBeep(1318.51, 'sine', 0.1, 0.05), 50);
}

export function playArcadeSound() {
  playBeep(300, 'square', 0.05, 0.03);
  setTimeout(() => playBeep(600, 'square', 0.06, 0.03), 40);
  setTimeout(() => playBeep(900, 'square', 0.08, 0.04), 80);
}

export function playUpgradeSound() {
  playBeep(523.25, 'triangle', 0.08, 0.08);
  setTimeout(() => playBeep(659.25, 'triangle', 0.08, 0.08), 80);
  setTimeout(() => playBeep(783.99, 'triangle', 0.08, 0.08), 160);
  setTimeout(() => playBeep(1046.50, 'sine', 0.2, 0.1), 240);
}

export function playDoorBell() {
  playBeep(880, 'sine', 0.12, 0.04);
  setTimeout(() => playBeep(700, 'sine', 0.18, 0.04), 100);
}

export function playErrorSound() {
  playBeep(220, 'sawtooth', 0.12, 0.06);
  setTimeout(() => playBeep(180, 'sawtooth', 0.16, 0.06), 80);
}
