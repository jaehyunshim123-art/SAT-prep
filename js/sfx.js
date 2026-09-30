// SatWizz sound effects and haptics.
// Sounds are synthesized with the Web Audio API (no audio files). Browsers only
// allow audio after a user gesture, so the AudioContext is created lazily on
// the first play() call, which always happens inside a tap.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});
  let ctx = null;
  let muted = false;
  let haptics = true;

  function audio() {
    if (muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  // One enveloped oscillator note.
  function tone(ac, { freq, start = 0, dur = 0.15, type = "sine", gain = 0.2, slideTo }) {
    const t0 = ac.currentTime + start;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Short filtered noise burst for the "tap".
  function click(ac) {
    const len = Math.floor(ac.sampleRate * 0.03);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const amp = ac.createGain();
    src.buffer = buf;
    filter.type = "highpass";
    filter.frequency.value = 1800;
    amp.gain.value = 0.35;
    src.connect(filter).connect(amp).connect(ac.destination);
    src.start();
  }

  const SOUNDS = {
    tap: (ac) => click(ac),
    correct: (ac) => {
      tone(ac, { freq: 880, dur: 0.14, type: "triangle", gain: 0.18 });
      tone(ac, { freq: 1318.5, start: 0.08, dur: 0.28, type: "sine", gain: 0.16 });
    },
    wrong: (ac) => {
      tone(ac, { freq: 150, dur: 0.24, type: "triangle", gain: 0.3, slideTo: 70 });
      tone(ac, { freq: 90, dur: 0.18, type: "sine", gain: 0.22 });
    },
    combo: (ac) => {
      [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => tone(ac, { freq: f, start: i * 0.06, dur: 0.18, type: "triangle", gain: 0.13 }));
    },
    complete: (ac) => {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(ac, { freq: f, start: i * 0.1, dur: 0.35, type: "triangle", gain: 0.14 }));
    },
  };

  function play(name) {
    const ac = audio();
    const fn = SOUNDS[name];
    if (!ac || !fn) return;
    try { fn(ac); } catch (e) { /* audio is best-effort */ }
  }

  function buzz(ms = 50) {
    if (!haptics || typeof navigator.vibrate !== "function") return;
    try { navigator.vibrate(ms); } catch (e) { /* not allowed here */ }
  }

  SW.sfx = {
    play,
    buzz,
    setMuted: (v) => { muted = Boolean(v); },
    setHaptics: (v) => { haptics = Boolean(v); },
    canVibrate: () => typeof navigator.vibrate === "function",
  };
})();
