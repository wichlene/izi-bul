'use client';

let ctx: AudioContext | null = null;
let ready = false;

export function unlockAudio() {
  if (ready) return;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // iOS için sessiz buffer çal — context'i "running" durumuna getirir
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    if (ctx.state === 'suspended') ctx.resume();
    ready = true;
  } catch {}
}

function tone(
  type: OscillatorType,
  freqs: number[],
  spacing: number,
  gain: number,
  dur: number
) {
  if (!ready || !ctx) return;
  const now = ctx.currentTime;
  freqs.forEach((freq, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.connect(g);
    g.connect(ctx!.destination);
    o.type = type;
    o.frequency.value = freq;
    const t = now + i * spacing;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur);
  });
}

export const playLike         = () => tone('sine',     [600, 900],                    0,    0.18, 0.15);
export const playMessage      = () => tone('sine',     [523, 659],                    0.12, 0.28, 0.4);
export const playNotification = () => tone('sine',     [880, 1100],                   0,    0.22, 0.3);
export const playQuestComplete= () => tone('triangle', [523, 659, 784, 1047],         0.1,  0.32, 0.5);
export const playError        = () => tone('sawtooth', [150],                         0,    0.18, 0.25);
export const playFriendRequest= () => tone('sine',     [440, 550, 660],               0.08, 0.18, 0.35);
