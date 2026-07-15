// Web Audio Context für die Live-Audio-Generierung initialisieren
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Globale Audiodaten & Aufnahmespeicher
const recordedBuffers = {}; 
let recordedCount = 0;

// Datengenerierung für die Instrumenten-Frequenzen
const soundsData = {
    gitarre: Array.from({length: 5}, (_, i) => ({ id: `git_${i}`, name: `Git ${i+1}`, type: 'gitarre', freq: 146.83 * (i + 1) * 0.75 })),
    trommel: Array.from({length: 5}, (_, i) => ({ id: `drum_${i}`, name: `Drum ${i+1}`, type: 'trommel', freq: 60 + (i * 30) })),
    piano: Array.from({length: 15}, (_, i) => ({ id: `piano_${i}`, name: `Pno ${i+1}`, type: 'piano', freq: 261.63 * Math.pow(1.059463, i) })),
    beat: Array.from({length: 20}, (_, i) => ({ id: `beat_${i}`, name: `⚡ B${i+1}`, type: 'beat', freq: 80 + (i * 25) }))
};

/**
 * Synthesizer & Player Engine
 * Generiert mathematische Soundeffekte oder spielt Mikrofon-Buffer ab
 */
function playSynthesizedSound(soundObj, duration = 0.5, volume = 0.5, pitchStyle = 'normal') {
    let freqModifier = 1;
    if (pitchStyle === 'low') freqModifier = 0.6;
    if (pitchStyle === 'high') freqModifier = 1.6;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const targetFreq = (soundObj.freq || 220) * freqModifier;

    if (soundObj.type === 'gitarre') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    } 
    else if (soundObj.type === 'trommel') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    } 
    else if (soundObj.type === 'piano') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.5, audioCtx.currentTime + duration * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    } 
    else if (soundObj.type === 'beat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        if (pitchStyle === 'normal') {
            osc.frequency.setValueAtTime(targetFreq * 1.2, audioCtx.currentTime + duration * 0.2);
        }
        gainNode.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    }
    else if (soundObj.type === 'mic') {
        const buffer = recordedBuffers[soundObj.id];
        if (buffer) {
            const bufferSource = audioCtx.createBufferSource();
            bufferSource.buffer = buffer;
            
            // Pitch Shifting für die Stimme über Abspielgeschwindigkeit
            if (pitchStyle === 'low') bufferSource.playbackRate.value = 0.7;
            if (pitchStyle === 'high') bufferSource.playbackRate.value = 1.4;
            
            const micGain = audioCtx.createGain();
            micGain.gain.setValueAtTime(volume, audioCtx.currentTime);
            bufferSource.connect(micGain);
            micGain.connect(audioCtx.destination);
            bufferSource.start(0);
            return;
        }
    }

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
