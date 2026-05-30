'use client';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

function play(fn: (ctx: AudioContext) => void) {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    fn(c);
  } catch { /* ses desteklenmiyor */ }
}

// Mesaj sesi — "ding dong"
export function playMessage() {
  play((c) => {
    const now = c.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.4);
    });
  });
}

// Bildirim sesi — kısa "ping"
export function playNotification() {
  play((c) => {
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(1100, now + 0.05);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    o.start(now); o.stop(now + 0.3);
  });
}

// Görev tamamlama — zafer fanfar
export function playQuestComplete() {
  play((c) => {
    const now = c.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.35, now + i * 0.1 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.5);
    });
  });
}

// Beğeni sesi — küçük "pop"
export function playLike() {
  play((c) => {
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(600, now);
    o.frequency.exponentialRampToValueAtTime(900, now + 0.08);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.start(now); o.stop(now + 0.15);
  });
}

// Hata sesi — "buzz"
export function playError() {
  play((c) => {
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.value = 150;
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o.start(now); o.stop(now + 0.25);
  });
}

// Arkadaşlık isteği — "chime"
export function playFriendRequest() {
  play((c) => {
    const now = c.currentTime;
    [440, 550, 660].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      o.start(now + i * 0.08);
      o.stop(now + i * 0.08 + 0.35);
    });
  });
}
