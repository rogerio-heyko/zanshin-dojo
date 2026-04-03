const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// ── Master volume bus ──────────────────────────────────────────────────────
let masterGain = null;  // All audio routes through this
let sfxGain = null;     // SFX sub-bus (impacts, kiai, etc.)
let musicGain = null;   // Music sub-bus (background drone)

let _masterVolume = 1.0;
let _sfxEnabled = true;

const getOutput = () => masterGain || audioCtx?.destination;
const getSfxOutput = () => sfxGain || getOutput();
const getMusicOutput = () => musicGain || getOutput();

// Called from MeditationScreen / Store to update volume in real-time
export const setMasterVolume = (vol) => {
    _masterVolume = Math.max(0, Math.min(1, vol));
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(_masterVolume, audioCtx.currentTime, 0.05);
    }
};

export const setSfxEnabled = (enabled) => {
    _sfxEnabled = enabled;
    if (sfxGain && audioCtx) {
        sfxGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, audioCtx.currentTime, 0.05);
    }
};

// Mute/Unmute everything (used during ads)
export const muteAll = () => {
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
    }
};

export const unmuteAll = () => {
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(_masterVolume, audioCtx.currentTime, 0.05);
    }
};

// ── Buffers ────────────────────────────────────────────────────────────────
let kiaiBuffer = null;
let golpeLeftBuffer = null;
let golpeRightBuffer = null;
let ossBuffer = null;
let hajimeBuffer = null;

let bgOscillator = null;
let bgGain = null;
let isPlayingMusic = false;
let currentBeltIndex = 0;
let nextNoteTime = 0;
let current16thNote = 0;
let timerID = null;

// ── Sequencer ──────────────────────────────────────────────────────────────
const scheduleNote = (beatNumber, time) => {
    if (!audioCtx) return;

    if (bgGain) {
        const targetVol = 0.05 + (currentBeltIndex * 0.005);
        bgGain.gain.setTargetAtTime(targetVol, time, 0.1);
    }

    // Taiko Drone (Quarter notes) — Black Belts (Index 7+)
    if (currentBeltIndex >= 7 && beatNumber % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(getMusicOutput());
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.5);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    // Koto Pluck (Syncopated) — Colored Belts (Index 3+)
    if (currentBeltIndex >= 3) {
        const scale = [220, 246.94, 293.66, 329.63, 392.00, 440, 493.88];
        if (beatNumber % 8 === 2 || beatNumber % 8 === 5) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(getMusicOutput());
            osc.type = 'triangle';
            const note = scale[Math.floor(Math.random() * scale.length)];
            osc.frequency.setValueAtTime(note, time);
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            osc.start(time);
            osc.stop(time + 0.3);
        }
    }
};

const sequencerScheduler = () => {
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleNote(current16thNote, nextNoteTime);
        const secondsPerBeat = 60.0 / 120.0;
        nextNoteTime += 0.25 * secondsPerBeat;
        current16thNote++;
        if (current16thNote === 16) current16thNote = 0;
    }
    timerID = setTimeout(sequencerScheduler, 25);
};

export const updateAudioLayer = (beltIndex) => {
    currentBeltIndex = beltIndex;
};

export const startBackgroundMusic = () => {
    if (!audioCtx) initAudio();
    if (isPlayingMusic) return;
    isPlayingMusic = true;

    bgOscillator = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOscillator.type = 'sine';
    bgOscillator.frequency.value = 82.41; // Low E zen drone
    bgGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    bgOscillator.connect(bgGain);
    bgGain.connect(getMusicOutput());
    bgOscillator.start();

    nextNoteTime = audioCtx.currentTime + 0.05;
    current16thNote = 0;
    sequencerScheduler();
};

export const stopBackgroundMusic = () => {
    isPlayingMusic = false;
    clearTimeout(timerID);
    if (bgOscillator) { bgOscillator.stop(); bgOscillator.disconnect(); bgOscillator = null; }
    if (bgGain) { bgGain.disconnect(); bgGain = null; }
};

// ── Load a buffer from a URL ───────────────────────────────────────────────
const loadBuffer = async (url) => {
    const response = await fetch(`${url}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    return audioCtx.decodeAudioData(arrayBuffer);
};

export const initAudio = async () => {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    // Create master gain bus (all audio flows through here)
    if (!masterGain) {
        masterGain = audioCtx.createGain();
        masterGain.gain.value = _masterVolume;
        masterGain.connect(audioCtx.destination);
    }

    // Create SFX sub-bus
    if (!sfxGain) {
        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = _sfxEnabled ? 1.0 : 0.0;
        sfxGain.connect(masterGain);
    }

    // Create Music sub-bus
    if (!musicGain) {
        musicGain = audioCtx.createGain();
        musicGain.gain.value = 1.0;
        musicGain.connect(masterGain);
    }

    const loads = [];

    if (!kiaiBuffer) {
        loads.push(
            loadBuffer('/kiai.mp3')
                .then(b => { kiaiBuffer = b; })
                .catch(e => console.warn('kiai.mp3 falhou:', e))
        );
    }

    if (!golpeLeftBuffer) {
        loads.push(
            loadBuffer('/golpe_left.mp3')
                .then(b => { golpeLeftBuffer = b; })
                .catch(e => console.warn('golpe_left.mp3 falhou:', e))
        );
    }

    if (!golpeRightBuffer) {
        loads.push(
            loadBuffer('/golpe_right.mp3')
                .then(b => { golpeRightBuffer = b; })
                .catch(e => console.warn('golpe_right.mp3 falhou:', e))
        );
    }

    if (!ossBuffer) {
        loads.push(
            loadBuffer('/oss.mp3')
                .then(b => { ossBuffer = b; })
                .catch(e => console.warn('OSS.mp3 falhou:', e))
        );
    }

    if (!hajimeBuffer) {
        loads.push(
            loadBuffer('/hajime.mp3')
                .then(b => { hajimeBuffer = b; })
                .catch(e => console.warn('Hajime.mp3 falhou:', e))
        );
    }

    await Promise.allSettled(loads);
};

// ── Play a loaded buffer at a gain ────────────────────────────────────────
const playBuffer = (buffer, gainValue = 1.0, playbackRate = 1.0) => {
    if (!audioCtx || !buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    const gain = audioCtx.createGain();
    gain.gain.value = gainValue;
    source.connect(gain);
    gain.connect(getSfxOutput());
    source.start();
};

export const playImpact = (type) => {
    if (!audioCtx) return;

    if (type === 'PERFECT' && golpeLeftBuffer) {
        playBuffer(golpeLeftBuffer, 1.0, 1.0 + (Math.random() * 0.1 - 0.05));
        return;
    }
    if (type === 'NORMAL' && golpeRightBuffer) {
        playBuffer(golpeRightBuffer, 0.8, 0.95 + (Math.random() * 0.1));
        return;
    }

    // Fallback: synthesized
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(getSfxOutput());
    if (type === 'PERFECT') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    }
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
};

export const playKiai = (beltIndex) => {
    if (!audioCtx || !kiaiBuffer) return;
    const detune = (Math.random() * 0.15) - 0.05;
    playBuffer(kiaiBuffer, 0.9, (beltIndex >= 7 ? 0.85 : 1.05) + detune);
};

// OSS — played on belt promotion (sign of respect and acknowledgment)
export const playOss = () => {
    if (!audioCtx || !ossBuffer) return;
    playBuffer(ossBuffer, 1.0, 1.0);
};

// Hajime — played at game start ("Begin!")
export const playHajime = () => {
    if (!audioCtx || !hajimeBuffer) return;
    playBuffer(hajimeBuffer, 1.0, 1.0);
};

export const playMiss = () => {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(getSfxOutput());
    noise.start();
};

export const playLevelUp = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(getSfxOutput());
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 3);
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3);
    osc.start();
    osc.stop(audioCtx.currentTime + 3);
};

export const playDamage = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(getSfxOutput());
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};

// ── Applause — synthesized crowd clapping, scales with belt rank ──────────
export const playAplausos = (beltIndex = 0) => {
    if (!audioCtx) return;

    const rank = Math.max(0, Math.min(beltIndex, 16));
    const duration = 1.5 + (rank * 0.25);
    const claps = Math.round(12 + rank * 2);
    const maxVol = 0.1 + (rank * 0.025);

    for (let i = 0; i < claps; i++) {
        const t = audioCtx.currentTime + (i / claps) * duration;

        const size = Math.floor(audioCtx.sampleRate * 0.07);
        const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let s = 0; s < size; s++) data[s] = Math.random() * 2 - 1;

        const src = audioCtx.createBufferSource();
        src.buffer = buf;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100 + Math.random() * 900;
        filter.Q.value = 0.5;

        const gain = audioCtx.createGain();
        const progress = i / claps;
        const vol = maxVol * (progress < 0.5 ? progress * 2 : 1.0) * (0.7 + Math.random() * 0.3);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(getSfxOutput());
        src.start(t);
    }
};

export const playTaiko = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(getSfxOutput());
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};
