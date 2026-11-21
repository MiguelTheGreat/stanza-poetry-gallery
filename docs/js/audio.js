/**
 * Synthesized Web Audio API Paper Rustle & Optional Ambient Reading Room Soundscapes
 * - Paper rustle on page / poem transitions
 * - Optional soft ambient loops: Rain on Glass & Late-Night Subway Hum (zero external MP3s)
 */
(function () {
  let audioCtx = null;
  let noiseBuffer = null;
  let longNoiseBuffer = null;
  let lastRustleAt = 0;

  let currentAmbience = 'off'; // 'off' | 'rain' | 'subway'
  let ambienceNodes = null;

  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
      // 0.6s pink-ish paper buffer
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

      // 4s seamless loopable ambient pink/brown noise buffer
      const longLen = Math.floor(audioCtx.sampleRate * 4.0);
      longNoiseBuffer = audioCtx.createBuffer(1, longLen, audioCtx.sampleRate);
      const ldata = longNoiseBuffer.getChannelData(0);
      let p0 = 0, p1 = 0, p2 = 0, p3 = 0;
      for (let i = 0; i < longLen; i++) {
        const w = Math.random() * 2 - 1;
        p0 = 0.99886 * p0 + w * 0.0555179;
        p1 = 0.99332 * p1 + w * 0.0750759;
        p2 = 0.96900 * p2 + w * 0.1538520;
        p3 = 0.86650 * p3 + w * 0.3104856;
        ldata[i] = (p0 + p1 + p2 + p3 + w * 0.12) * 0.14;
      }
      // Crossfade last 0.15s with first 0.15s for click-free loop
      const fadeSamples = Math.floor(audioCtx.sampleRate * 0.15);
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        const tailIdx = longLen - fadeSamples + i;
        ldata[tailIdx] = ldata[tailIdx] * (1 - t) + ldata[i] * t;
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

  function playPaperRustle(volume = 0.048) {
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

  function stopAmbience() {
    if (!ambienceNodes) return;
    const { ac, masterGain, sources } = ambienceNodes;
    const t = ac.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), t);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      setTimeout(() => {
        sources.forEach((s) => {
          try { s.stop(); } catch {}
        });
      }, 520);
    } catch {}
    ambienceNodes = null;
  }

  function setAmbience(mode) {
    stopAmbience();
    currentAmbience = mode;
    if (mode === 'off') return currentAmbience;

    const ac = ensureAudio();
    if (!ac || !longNoiseBuffer) return 'off';

    const t = ac.currentTime;
    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0.0001, t);
    masterGain.connect(ac.destination);

    const sources = [];

    if (mode === 'rain') {
      // Soft distant rain against window glass
      const noise = ac.createBufferSource();
      noise.buffer = longNoiseBuffer;
      noise.loop = true;

      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 650;

      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3400;

      // Subtle warm low body
      const body = ac.createBufferSource();
      body.buffer = longNoiseBuffer;
      body.loop = true;
      const bodyLp = ac.createBiquadFilter();
      bodyLp.type = 'lowpass';
      bodyLp.frequency.value = 360;
      const bodyGain = ac.createGain();
      bodyGain.gain.value = 0.42;

      noise.connect(hp);
      hp.connect(lp);
      lp.connect(masterGain);

      body.connect(bodyLp);
      bodyLp.connect(bodyGain);
      bodyGain.connect(masterGain);

      noise.start(t);
      body.start(t);
      sources.push(noise, body);

      masterGain.gain.linearRampToValueAtTime(0.11, t + 0.9);
    } else if (mode === 'subway') {
      // Warm muffled late-night train hum
      const noise = ac.createBufferSource();
      noise.buffer = longNoiseBuffer;
      noise.loop = true;

      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 210;

      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 72;
      const oscGain = ac.createGain();
      oscGain.gain.value = 0.032;

      // Slow breath LFO on filter frequency
      const lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.14;
      const lfoGain = ac.createGain();
      lfoGain.gain.value = 42;
      lfo.connect(lfoGain);
      lfoGain.connect(lp.frequency);

      noise.connect(lp);
      lp.connect(masterGain);
      osc.connect(oscGain);
      oscGain.connect(masterGain);

      noise.start(t);
      osc.start(t);
      lfo.start(t);
      sources.push(noise, osc, lfo);

      masterGain.gain.linearRampToValueAtTime(0.14, t + 1.0);
    }

    ambienceNodes = { ac, masterGain, sources };
    return currentAmbience;
  }

  function cycleAmbience() {
    const order = ['off', 'rain', 'subway'];
    const next = order[(order.indexOf(currentAmbience) + 1) % order.length];
    return setAmbience(next);
  }

  function getAmbience() {
    return currentAmbience;
  }

  window.StanzaAudio = {
    ensureAudio,
    playPaperRustle,
    setAmbience,
    cycleAmbience,
    getAmbience
  };
})();
