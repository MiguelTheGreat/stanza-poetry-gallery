/**
 * Synthesized Web Audio API Paper Rustle & Quill Whisper
 * Inspired by Lumina's subtle tactile exhibition soundscape
 */
(function () {
  let audioCtx = null;
  let noiseBuffer = null;
  let lastRustleAt = 0;

  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
      const len = Math.floor(audioCtx.sampleRate * 0.6);
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.08) * 0.85;
      }
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  ['pointerdown', 'wheel', 'touchstart', 'keydown', 'mousemove'].forEach((evt) => {
    window.addEventListener(evt, () => ensureAudio(), { once: true, passive: true });
  });

  function playPaperRustle(volume = 0.05) {
    const nowMs = performance.now();
    if (nowMs - lastRustleAt < 260) return;
    lastRustleAt = nowMs;

    const ac = ensureAudio();
    if (!ac || !noiseBuffer || ac.state !== 'running') return;

    const t = ac.currentTime;

    const src1 = ac.createBufferSource();
    src1.buffer = noiseBuffer;

    const bp1 = ac.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(1400, t);
    bp1.frequency.exponentialRampToValueAtTime(2100, t + 0.11);
    bp1.frequency.exponentialRampToValueAtTime(1000, t + 0.30);
    bp1.Q.value = 0.85;

    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 420;

    const gain1 = ac.createGain();
    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.linearRampToValueAtTime(volume, t + 0.04);
    gain1.gain.exponentialRampToValueAtTime(volume * 0.4, t + 0.14);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

    src1.connect(bp1);
    bp1.connect(hp);
    hp.connect(gain1);
    gain1.connect(ac.destination);
    src1.start(t);
    src1.stop(t + 0.34);

    // Subtle low-frequency page settle
    const src2 = ac.createBufferSource();
    src2.buffer = noiseBuffer;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, t);

    const gain2 = ac.createGain();
    gain2.gain.setValueAtTime(0.0001, t + 0.05);
    gain2.gain.linearRampToValueAtTime(volume * 0.45, t + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    src2.connect(lp);
    lp.connect(gain2);
    gain2.connect(ac.destination);
    src2.start(t + 0.05);
    src2.stop(t + 0.30);
  }

  window.StanzaAudio = {
    ensureAudio,
    playPaperRustle
  };
})();
