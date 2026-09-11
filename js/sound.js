// ===== LOBOTOMY DELUXE - sound.js =====
// WebAudio合成による効果音エンジン。外部音源ファイルは一切使用しない。

let audioCtx = null;
let masterGain = null;
let soundMuted = false;
let sirenTimer = null;
let sirenOn = false;

const SOUND_KEY = 'lobotomyDeluxe_sound_v1';

function loadSoundPref() {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    if (raw) soundMuted = JSON.parse(raw).muted === true;
  } catch (e) { /* ignore */ }
}
function saveSoundPref() {
  try { localStorage.setItem(SOUND_KEY, JSON.stringify({ muted: soundMuted })); } catch (e) { /* ignore */ }
}

function ensureAudio() {
  if (audioCtx) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  } catch (e) { audioCtx = null; }
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// 単発トーン。freqEndを指定するとピッチスライドする。
function tone(freq, duration, opts) {
  opts = opts || {};
  if (!audioCtx || soundMuted) return;
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), t0 + duration);
  const vol = opts.vol != null ? opts.vol : 0.25;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

// 短いノイズバースト(打撃音・警報アタック用)
function noiseBurst(duration, opts) {
  opts = opts || {};
  if (!audioCtx || soundMuted) return;
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = opts.filterType || 'lowpass';
  filter.frequency.value = opts.filterFreq || 2000;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(opts.vol != null ? opts.vol : 0.2, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(filter).connect(gain).connect(masterGain);
  src.start(t0);
}

function playSeq(notes) {
  notes.forEach(n => tone(n.freq, n.dur, n));
}

const SFX = {
  click() { tone(660, 0.05, { type: 'square', vol: 0.08 }); },
  select() { tone(520, 0.06, { type: 'triangle', vol: 0.12 }); },
  assign() { playSeq([{ freq: 440, dur: 0.07, type: 'triangle', vol: 0.14 }, { freq: 660, dur: 0.09, delay: 0.05, type: 'triangle', vol: 0.14 }]); },
  unassign() { tone(330, 0.08, { type: 'triangle', vol: 0.1, freqEnd: 220 }); },
  good() { playSeq([
    { freq: 523, dur: 0.09, type: 'sine', vol: 0.18 },
    { freq: 659, dur: 0.09, delay: 0.07, type: 'sine', vol: 0.18 },
    { freq: 784, dur: 0.16, delay: 0.14, type: 'sine', vol: 0.2 },
  ]); },
  normal() { tone(520, 0.08, { type: 'sine', vol: 0.12 }); },
  bad() { tone(180, 0.22, { type: 'sawtooth', vol: 0.16, freqEnd: 90 }); },
  breachTrigger() {
    noiseBurst(0.3, { vol: 0.25, filterFreq: 1200 });
    playSeq([
      { freq: 440, dur: 0.15, type: 'square', vol: 0.18 },
      { freq: 220, dur: 0.22, delay: 0.16, type: 'square', vol: 0.2 },
    ]);
  },
  suppressSuccess() { playSeq([
    { freq: 440, dur: 0.08, type: 'triangle', vol: 0.16 },
    { freq: 660, dur: 0.08, delay: 0.06, type: 'triangle', vol: 0.16 },
    { freq: 880, dur: 0.14, delay: 0.12, type: 'triangle', vol: 0.18 },
  ]); },
  suppressFail() { noiseBurst(0.18, { vol: 0.22, filterFreq: 800 }); tone(140, 0.18, { type: 'sawtooth', vol: 0.15 }); },
  death() { playSeq([
    { freq: 300, dur: 0.3, type: 'sine', vol: 0.14, freqEnd: 100 },
    { freq: 220, dur: 0.4, delay: 0.2, type: 'sine', vol: 0.12, freqEnd: 60 },
  ]); },
  hire() { playSeq([{ freq: 700, dur: 0.06, type: 'square', vol: 0.12 }, { freq: 1000, dur: 0.08, delay: 0.05, type: 'square', vol: 0.12 }]); },
  rest() { tone(440, 0.25, { type: 'sine', vol: 0.1, freqEnd: 660 }); },
  dayEndGood() { playSeq([
    { freq: 523, dur: 0.1, type: 'triangle', vol: 0.16 },
    { freq: 659, dur: 0.1, delay: 0.09, type: 'triangle', vol: 0.16 },
    { freq: 784, dur: 0.1, delay: 0.18, type: 'triangle', vol: 0.16 },
    { freq: 1046, dur: 0.22, delay: 0.27, type: 'triangle', vol: 0.2 },
  ]); },
  dayEndBad() { playSeq([
    { freq: 392, dur: 0.16, type: 'sawtooth', vol: 0.14 },
    { freq: 349, dur: 0.16, delay: 0.14, type: 'sawtooth', vol: 0.14 },
    { freq: 293, dur: 0.3, delay: 0.28, type: 'sawtooth', vol: 0.16 },
  ]); },
  achievement() { playSeq([
    { freq: 660, dur: 0.08, type: 'sine', vol: 0.16 },
    { freq: 880, dur: 0.08, delay: 0.07, type: 'sine', vol: 0.16 },
    { freq: 1108, dur: 0.08, delay: 0.14, type: 'sine', vol: 0.16 },
    { freq: 1318, dur: 0.2, delay: 0.21, type: 'sine', vol: 0.2 },
  ]); },
  gameOver() { playSeq([
    { freq: 220, dur: 0.35, type: 'sawtooth', vol: 0.16 },
    { freq: 196, dur: 0.35, delay: 0.3, type: 'sawtooth', vol: 0.16 },
    { freq: 146, dur: 0.6, delay: 0.6, type: 'sawtooth', vol: 0.18 },
  ]); },
};

function startSiren() {
  if (sirenOn || soundMuted || !audioCtx) return;
  sirenOn = true;
  let high = true;
  const tick = () => {
    if (!sirenOn) return;
    tone(high ? 740 : 520, 0.35, { type: 'sawtooth', vol: 0.06 });
    high = !high;
  };
  tick();
  sirenTimer = setInterval(tick, 380);
}
function stopSiren() {
  sirenOn = false;
  if (sirenTimer) { clearInterval(sirenTimer); sirenTimer = null; }
}

function unlockOnce() {
  ensureAudio();
  resumeAudio();
  document.removeEventListener('click', unlockOnce);
  document.removeEventListener('keydown', unlockOnce);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSoundPref();
  document.addEventListener('click', unlockOnce);
  document.addEventListener('keydown', unlockOnce);

  const btn = document.getElementById('sound-toggle');
  if (btn) {
    const sync = () => { btn.textContent = soundMuted ? '🔇' : '🔊'; };
    sync();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundMuted = !soundMuted;
      if (soundMuted) stopSiren();
      saveSoundPref();
      sync();
    });
  }
});

window.Sound = new Proxy(SFX, {
  get(target, prop) {
    if (prop in target) {
      return (...args) => { if (audioCtx && !soundMuted) target[prop](...args); };
    }
    return undefined;
  },
});
window.Sound.startSiren = () => { if (audioCtx && !soundMuted) startSiren(); };
window.Sound.stopSiren = stopSiren;
