// Gullet audio: synthesized chiptune SFX and a per-floor music loop built around a heartbeat kick
// that speeds up the higher you climb.
let ac = null, master, sfxBus, musBus, noiseBuf;
let musicOn = true, sfxOn = true, curSong = -2, nextStep = 0, step = 0, timer = null, bossMode = false;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
  musBus = ac.createGain(); musBus.gain.value = 0.32; musBus.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  timer = setInterval(schedule, 25);
}
export function setPrefs(m, s) { musicOn = m; sfxOn = s; if (musBus) musBus.gain.value = m ? 0.32 : 0; }

function tone(f, dur, type = 'square', vol = 0.2, slide = 0, when = 0, bus = sfxBus) {
  if (!ac) return;
  const t = (when || ac.currentTime), o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.2, freq = 2000, when = 0, bus = sfxBus, q = 0.8) {
  if (!ac) return;
  const t = when || ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const last = {};
export function sfx(name) {
  if (!ac || !sfxOn) return;
  const now = ac.currentTime;
  if (last[name] && now - last[name] < 0.035) return;
  last[name] = now;
  switch (name) {
    case 'shoot': tone(720 + Math.random() * 80, 0.05, 'square', 0.035, 0.6); break;
    case 'hit': noise(0.05, 0.16, 1400 + Math.random() * 600); tone(160 + Math.random() * 60, 0.05, 'square', 0.05, 0.6); break;
    case 'die': noise(0.18, 0.26, 700); noise(0.06, 0.2, 2400); tone(200 + Math.random() * 80, 0.18, 'sawtooth', 0.08, 0.3); tone(70, 0.12, 'sine', 0.25, 0.5); break;
    case 'hurt': tone(240, 0.22, 'sawtooth', 0.14, 0.4); noise(0.12, 0.16, 500); break;
    case 'pick': tone(880, 0.06, 'square', 0.06); tone(1320, 0.08, 'square', 0.06, 1, now + 0.06); break;
    case 'item': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.07, 1, now + i * 0.07)); break;
    case 'buy': tone(660, 0.06, 'triangle', 0.1); tone(990, 0.1, 'triangle', 0.1, 1, now + 0.06); break;
    case 'door': noise(0.25, 0.12, 300); tone(90, 0.25, 'sine', 0.2, 0.6); break;
    case 'clear': [392, 523, 659].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, 1, now + i * 0.05)); noise(0.4, 0.06, 400); break;
    case 'dash': noise(0.12, 0.12, 2400, 0, sfxBus, 0.5); break;
    case 'tele': tone(1400, 0.05, 'square', 0.025); break;
    case 'spit': noise(0.1, 0.1, 900); tone(300, 0.08, 'square', 0.03, 1.4); break;
    case 'zap': noise(0.08, 0.12, 5000); tone(1800, 0.06, 'sawtooth', 0.03, 0.5); break;
    case 'boom': noise(0.3, 0.3, 300); tone(110, 0.3, 'sine', 0.25, 0.4); break;
    case 'boss': tone(70, 1.2, 'sawtooth', 0.18, 0.7); tone(105, 1.2, 'sawtooth', 0.1, 0.7); noise(1.0, 0.1, 250); break;
    case 'bossdie': noise(0.2, 0.5, 120); tone(48, 1.4, 'sine', 0.5, 0.4); noise(1.2, 0.3, 200); [220, 165, 110, 82].forEach((f, i) => tone(f, 0.5, 'sawtooth', 0.12, 0.5, now + i * 0.15)); break;
    case 'slam': noise(0.3, 0.3, 150); tone(60, 0.3, 'sine', 0.3, 0.5); break;
    case 'beat': tone(62, 0.16, 'sine', 0.45, 0.5); tone(55, 0.14, 'sine', 0.38, 0.5, now + 0.18); break;
    case 'bite': noise(0.08, 0.25, 3000); tone(140, 0.08, 'square', 0.1, 0.5); break;
    case 'shield': tone(1200, 0.2, 'triangle', 0.1, 0.5); break;
    case 'inhale': noise(2.2, 0.08, 600, 0, sfxBus, 0.4); break;
    case 'blow': noise(0.5, 0.2, 500); break;
    case 'feed': tone(160, 0.4, 'sawtooth', 0.12, 0.5); noise(0.3, 0.12, 400); break;
    case 'floor': [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 0.22, 'square', 0.06, 1, now + i * 0.09)); break;
    case 'dead': [330, 262, 196, 131].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, 0.9, now + i * 0.22)); break;
    case 'won': [392, 523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.3, 'square', 0.07, 1, now + i * 0.13)); break;
    case 'revive': [440, 660, 880].forEach((f, i) => tone(f, 0.15, 'triangle', 0.1, 1, now + i * 0.08)); break;
    case 'toast': tone(300, 0.08, 'square', 0.04); break;
    case 'heal': tone(660, 0.12, 'triangle', 0.08, 1.5); break;
    case 'levelup': [523, 784, 1046, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, 1, now + i * 0.06)); break;
    case 'cache': [392, 523, 784].forEach((f, i) => tone(f, 0.12, 'square', 0.06, 1, now + i * 0.07)); break;
    case 'pickcard': tone(880, 0.08, 'square', 0.06); tone(1320, 0.14, 'triangle', 0.08, 1, now + 0.05); break;
    case 'fuse': noise(0.3, 0.06, 5000, 0, sfxBus, 2); break;
    case 'bigboom': noise(0.5, 0.45, 160); tone(55, 0.5, 'sine', 0.45, 0.4); break;
    case 'secret': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, 1, now + i * 0.08)); break;
    case 'active': tone(220, 0.25, 'sawtooth', 0.1, 3); noise(0.25, 0.15, 900); break;
    case 'note': tone(392, 0.3, 'triangle', 0.06); tone(523, 0.4, 'triangle', 0.05, 1, now + 0.15); break;
    case 'bounce': tone(500, 0.03, 'square', 0.02); break;
  }
}

// ---------- music: 16-step patterns, minor keys, a "lub-dub" kick
const SONGS = [
  // title
  { bpm: 70, root: 45, bass: [0, -1, -1, -1, 3, -1, -1, -1, 0, -1, -1, -1, -2, -1, -1, -1], arp: [0, 3, 7, 10], arpOn: [0, 4, 8, 12], heart: 1 },
  { bpm: 92, root: 45, bass: [0, -1, 0, -1, 3, -1, 2, -1, 0, -1, 0, -1, -2, -1, -4, -1], arp: [0, 3, 7, 12], arpOn: [0, 2, 6, 8, 10, 14], heart: 1 },
  { bpm: 98, root: 43, bass: [0, -1, -1, 0, 5, -1, 3, -1, 0, -1, -1, 0, 7, -1, 5, -1], arp: [0, 3, 8, 12], arpOn: [0, 3, 6, 8, 11, 14], heart: 1 },
  { bpm: 88, root: 47, bass: [0, -1, -1, -1, -1, -1, 3, -1, 2, -1, -1, -1, -2, -1, -1, -1], arp: [0, 5, 7, 12, 14], arpOn: [0, 2, 4, 6, 8, 10, 12, 14], heart: 1 },
  { bpm: 104, root: 40, bass: [0, 0, -1, 0, 3, -1, 1, -1, 0, 0, -1, 0, -2, -1, -1, 1], arp: [0, 1, 5, 8], arpOn: [0, 4, 6, 10, 12], heart: 1 },
  { bpm: 110, root: 42, bass: [0, -1, 0, 7, -1, 6, -1, 3, 0, -1, 0, 7, -1, 8, -1, 7], arp: [0, 3, 7, 11], arpOn: [0, 2, 4, 8, 10, 12, 14], heart: 1 },
  { bpm: 120, root: 38, bass: [0, -1, 0, -1, 0, -1, 3, -1, 0, -1, 0, -1, 1, -1, -1, -1], arp: [0, 3, 7, 10, 15], arpOn: [0, 1, 4, 6, 8, 9, 12, 14], heart: 1 },
  { bpm: 96, root: 41, bass: [0, -1, -1, 3, -1, -1, 5, -1, 0, -1, -1, 3, -1, 6, 5, -1], arp: [0, 3, 6, 10], arpOn: [0, 3, 6, 9, 12], heart: 1 },
  { bpm: 102, root: 44, bass: [0, -1, 0, -1, -2, -1, -2, -1, 0, -1, 0, -1, 3, -1, 2, -1], arp: [0, 7, 12, 15], arpOn: [0, 2, 4, 8, 10, 12], heart: 1 },
  { bpm: 108, root: 46, bass: [0, 0, -1, 0, 7, -1, 5, -1, 0, 0, -1, 0, 3, -1, 2, -1], arp: [0, 4, 7, 11, 14], arpOn: [0, 1, 2, 4, 6, 8, 9, 10, 12, 14], heart: 1 },
  { bpm: 124, root: 39, bass: [0, -1, -1, -1, 1, -1, -1, -1, 0, -1, -1, -1, 6, -1, 5, -1], arp: [0, 1, 6, 7, 12], arpOn: [0, 2, 3, 5, 8, 10, 11, 13], heart: 1 },
  { bpm: 90, root: 43, bass: [0, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1, 2, -1, -1, -1], arp: [0, 3, 7, 10, 14, 17], arpOn: [0, 2, 4, 6, 8, 10, 12, 14], heart: 1 },
  { bpm: 128, root: 37, bass: [0, -1, 0, 12, -1, 10, -1, 7, 0, -1, 0, 12, -1, 11, -1, 8], arp: [0, 3, 7, 11, 14], arpOn: [0, 1, 3, 4, 6, 8, 9, 11, 12, 14], heart: 1 },
];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export function setMusic(i, boss = false) { curSong = i < 0 ? i : i % 12; bossMode = boss; }
function schedule() {
  if (!ac || curSong < -1) return;
  const song = SONGS[curSong + 1] || SONGS[0];
  const bpm = song.bpm * (bossMode ? 1.15 : 1), dur = 60 / bpm / 4;
  if (nextStep < ac.currentTime) nextStep = ac.currentTime + 0.05;
  while (nextStep < ac.currentTime + 0.12) {
    const s = step % 16, t = nextStep;
    if (musicOn) {
      const b = song.bass[s];
      if (b >= 0 || b < -0.5 && b !== -1) { if (b !== -1) tone(mtof(song.root + b - 12), dur * 1.8, 'triangle', 0.32, 1, t, musBus); }
      if (song.heart && (s === 0 || s === 8)) { tone(58, 0.14, 'sine', 0.55, 0.5, t, musBus); tone(52, 0.12, 'sine', 0.45, 0.5, t + dur * 1.1, musBus); }
      if (song.arpOn.includes(s)) { const n = song.arp[(step >> 1) % song.arp.length]; tone(mtof(song.root + 24 + n), dur * 0.9, 'square', bossMode ? 0.05 : 0.035, 1, t, musBus); }
      if (bossMode && s % 4 === 2) noise(0.05, 0.08, 6000, t, musBus);
      if (curSong >= 0 && s % 8 === 4) noise(0.04, 0.04, 3000, t, musBus);
    }
    nextStep += dur; step++;
  }
}
