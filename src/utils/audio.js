const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

let bgOscillator = null;
let bgGain = null;
let isPlayingMusic = false;
let currentBeltIndex = 0;
let nextNoteTime = 0;
let current16thNote = 0;
let timerID = null;

const scheduleNote = (beatNumber, time) => {
    if (!audioCtx) return;

    // Drone intensity increases slightly with belts
    if (bgGain) {
        const targetVol = 0.05 + (currentBeltIndex * 0.005);
        bgGain.gain.setTargetAtTime(targetVol, time, 0.1);
    }

    // Taiko Drone (Quarter notes) - Black Belts (Index 7+)
    if (currentBeltIndex >= 7 && beatNumber % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.5);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    // Koto Pluck (Syncopated) - Colored Belts (Index 3+)
    if (currentBeltIndex >= 3) {
        // Japanese Pentatonic scale frequencies mapping (roughly)
        const scale = [220, 246.94, 293.66, 329.63, 392.00, 440, 493.88];
        if (beatNumber % 8 === 2 || beatNumber % 8 === 5) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            // Random note from pentatonic
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
        // Advance note
        const secondsPerBeat = 60.0 / 120.0; // 120 BPM
        nextNoteTime += 0.25 * secondsPerBeat; // 16th note
        current16thNote++;
        if (current16thNote === 16) {
            current16thNote = 0;
        }
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

    // Continuous Zen Drone
    bgOscillator = audioCtx.createOscillator();
    bgGain = audioCtx.createGain();
    bgOscillator.type = 'sine';
    bgOscillator.frequency.value = 82.41; // Low E
    bgGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    bgOscillator.connect(bgGain);
    bgGain.connect(audioCtx.destination);
    bgOscillator.start();

    // Start Sequencer
    nextNoteTime = audioCtx.currentTime + 0.05;
    current16thNote = 0;
    sequencerScheduler();
};

export const stopBackgroundMusic = () => {
    isPlayingMusic = false;
    clearTimeout(timerID);
    if (bgOscillator) {
        bgOscillator.stop();
        bgOscillator.disconnect();
        bgOscillator = null;
    }
    if (bgGain) {
        bgGain.disconnect();
        bgGain = null;
    }
};

export const playTaiko = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};

export const playImpact = (type) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'PERFECT') {
        // Sharp crack (Kiai)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    } else {
        // Dull thud
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
};

export const playMiss = () => {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.2; // 0.2s
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

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
    gain.connect(audioCtx.destination);

    noise.start();
};

export const playLevelUp = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Zen Gong sound approximation
    osc.connect(gain);
    gain.connect(audioCtx.destination);

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
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
};
