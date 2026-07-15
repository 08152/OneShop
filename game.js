// --- SOUND DATENBANK ---
const AVAILABLE_SOUNDS = [
    { id: 'kick', name: 'Bass Drum', type: 'synth-kick', duration: 0.2 },
    { id: 'snare', name: 'Snare Drum', type: 'synth-snare', duration: 0.2 },
    { id: 'hihat', name: 'Hi-Hat', type: 'synth-hat', duration: 0.05 },
    { id: 'beep-high', name: 'Synth Piep Hoch', type: 'osc', freq: 880, duration: 0.15 },
    { id: 'beep-low', name: 'Synth Piep Tief', type: 'osc', freq: 220, duration: 0.3 },
    { id: 'chord', name: 'Synthesizer Akkord', type: 'osc-chord', freq: 440, duration: 0.5 }
];

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSoundLive(sound, volume = 100, startTime = 0) {
    const gainNode = audioCtx.createGain();
    const targetVolume = (volume / 100) * 0.5; 
    gainNode.gain.setValueAtTime(targetVolume, startTime);
    gainNode.connect(audioCtx.destination);

    if (sound.type === 'osc') {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(sound.freq, startTime);
        osc.connect(gainNode);
        osc.start(startTime);
        osc.stop(startTime + sound.duration);
    } 
    else if (sound.type === 'osc-chord') {
        [sound.freq, sound.freq * 1.25, sound.freq * 1.5].forEach(f => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, startTime);
            osc.connect(gainNode);
            osc.start(startTime);
            osc.stop(startTime + sound.duration);
        });
    }
    else if (sound.type === 'synth-kick') {
        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + sound.duration);
        osc.connect(gainNode);
        osc.start(startTime);
        osc.stop(startTime + sound.duration);
    }
    else if (sound.type === 'synth-snare' || sound.type === 'synth-hat') {
        const bufferSize = audioCtx.sampleRate * sound.duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = sound.type === 'synth-hat' ? 'highpass' : 'bandpass';
        filter.frequency.setValueAtTime(sound.type === 'synth-hat' ? 7000 : 1000, startTime);
        
        noise.connect(filter);
        filter.connect(gainNode);
        noise.start(startTime);
        noise.stop(startTime + sound.duration);
    }
}

// --- STATE MANAGEMENT ---
let appState = {
    selectedSoundId: null,
    timelineDuration: 10,
    clips: []
};

function saveToLocalStorage() {
    localStorage.setItem('music_maker_save', JSON.stringify(appState));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('music_maker_save');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch(e) {
            console.error("Fehler beim Laden", e);
        }
    }
}

// --- WAV DOWNLOAD RENDERING ---
function renderWavAndDownload() {
    const sampleRate = 44100;
    const renderDuration = appState.timelineDuration;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * renderDuration, sampleRate);

    appState.clips.forEach(clip => {
        const sound = AVAILABLE_SOUNDS.find(s => s.id === clip.soundId);
        if (!sound) return;

        const gainNode = offlineCtx.createGain();
        const targetVolume = (clip.volume / 100) * 0.5;
        gainNode.gain.setValueAtTime(targetVolume, clip.time);
        gainNode.connect(offlineCtx.destination);

        if (sound.type === 'osc') {
            const osc = offlineCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(sound.freq, clip.time);
            osc.connect(gainNode);
            osc.start(clip.time);
            osc.stop(clip.time + sound.duration);
        } 
        else if (sound.type === 'osc-chord') {
            [sound.freq, sound.freq * 1.25, sound.freq * 1.5].forEach(f => {
                const osc = offlineCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, clip.time);
                osc.connect(gainNode);
                osc.start(clip.time);
                osc.stop(clip.time + sound.duration);
            });
        }
        else if (sound.type === 'synth-kick') {
            const osc = offlineCtx.createOscillator();
            osc.frequency.setValueAtTime(150, clip.time);
            osc.frequency.exponentialRampToValueAtTime(0.01, clip.time + sound.duration);
            osc.connect(gainNode);
            osc.start(clip.time);
            osc.stop(clip.time + sound.duration);
        }
        else if (sound.type === 'synth-snare' || sound.type === 'synth-hat') {
            const bufferSize = sampleRate * sound.duration;
            const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = offlineCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = offlineCtx.createBiquadFilter();
            filter.type = sound.type === 'synth-hat' ? 'highpass' : 'bandpass';
            filter.frequency.setValueAtTime(sound.type === 'synth-hat' ? 7000 : 1000, clip.time);
            
            noise.connect(filter);
            filter.connect(gainNode);
            noise.start(clip.time);
            noise.stop(clip.time + sound.duration);
        }
    });

    return offlineCtx.startRendering().then(renderedBuffer => {
        return bufferToWav(renderedBuffer);
    });
}

function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], sample, pos = 0;

    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }

    setUint32(0x46464952); 
    setUint32(length - 8); 
    setUint32(0x45564157); 
    setUint32(0x20746d66); 
    setUint32(16);         
    setUint16(1);          
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); 
    setUint16(numOfChan * 2);                     
    setUint16(16);                                
    setUint32(0x61746164); 
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let writePos = pos;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            sample = Math.max(-1, Math.min(1, channels[channel][i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(writePos, sample, true);
            writePos += 2;
        }
    }
    return new Blob([bufferArr], { type: 'audio/wav' });
}
