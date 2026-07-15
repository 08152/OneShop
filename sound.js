// Web Audio Context initialisieren
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Lokaler Cache für Sprachaufnahmen
const recordedBuffers = {}; 
let recordedCount = 0;

// Massiver Tonpool (Insgesamt über 50 vordefinierte Trägerfrequenzen/Klangfarben)
const soundsData = {
    // Gitarre: Basierend auf den echten Frequenzen der Gitarrensaiten (E, A, D, G, H, e) und deren Obertönen
    gitarre: [
        { id: 'git_0', name: 'Git E2', type: 'gitarre', freq: 82.41 },
        { id: 'git_1', name: 'Git A2', type: 'gitarre', freq: 110.00 },
        { id: 'git_2', name: 'Git D3', type: 'gitarre', freq: 146.83 },
        { id: 'git_3', name: 'Git G3', type: 'gitarre', freq: 196.00 },
        { id: 'git_4', name: 'Git B3', type: 'gitarre', freq: 246.94 }
    ],
    // Trommel: Verschiedene Perkussions- und Drum-Typen
    trommel: [
        { id: 'drum_0', name: 'Deep Kick', type: 'trommel', freq: 50 },
        { id: 'drum_1', name: 'Punch Snare', type: 'trommel', freq: 180 },
        { id: 'drum_2', name: 'Closed Hat', type: 'trommel', freq: 350 },
        { id: 'drum_3', name: 'Open HiHat', type: 'trommel', freq: 450 },
        { id: 'drum_4', name: 'Rimshot FX', type: 'trommel', freq: 220 }
    ],
    // Piano: 15 vollwertige Noten der chromatischen Tonleiter (gestreckt über 2 Oktaven)
    piano: Array.from({length: 15}, (_, i) => {
        const notes = ["C4", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C5", "C#5", "D5"];
        return {
            id: `piano_${i}`,
            name: `Pno ${notes[i]}`,
            type: 'piano',
            freq: 261.63 * Math.pow(1.059463, i) // Exakte mathematische Frequenzschritte
        };
    }),
    // Elektrische Beats: 20 verschiedene Beats und perkursive Elektro-Effekte
    beat: Array.from({length: 20}, (_, i) => ({
        id: `beat_${i}`,
        name: `🔋 Beat ${i+1}`,
        type: 'beat',
        freq: 60 + (i * 14) // Modulierende Grundfrequenzen für Abwechslung
    }))
};

/**
 * Fortschrittliche Audio-Synthese-Engine
 * Nutzt mehrere Oszillatoren, Rauschgeneratoren und Filter, um echte Instrumente zu imitieren.
 */
function playAudioResource(soundId, isMic = false, duration = 0.8, volume = 0.7, pitchStyle = 'normal') {
    audioCtx.resume();
    
    // 1. MIKROFON-ABSPIELUNG
    if (isMic) {
        const buffer = recordedBuffers[soundId];
        if (!buffer) return;
        const bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = buffer;
        if (pitchStyle === 'low') bufferSource.playbackRate.value = 0.75;
        if (pitchStyle === 'high') bufferSource.playbackRate.value = 1.35;
        
        const micGain = audioCtx.createGain();
        micGain.gain.setValueAtTime(volume, audioCtx.currentTime);
        bufferSource.connect(micGain);
        micGain.connect(audioCtx.destination);
        bufferSource.start(0);
        return;
    }

    // 2. INSTRUMENTEN-SYNTHESE (ECHTE KLANG-SIMULATION)
    let soundObj = null;
    for (const category in soundsData) {
        const found = soundsData[category].find(s => s.id === soundId);
        if (found) { soundObj = found; break; }
    }
    if (!soundObj) return;

    let pitchMultiplier = 1;
    if (pitchStyle === 'low') pitchMultiplier = 0.7;
    if (pitchStyle === 'high') pitchMultiplier = 1.4;

    const baseFreq = soundObj.freq * pitchMultiplier;
    const now = audioCtx.currentTime;

    // Hauptlautstärke-Knoten (Master-Gain des Tons)
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.connect(audioCtx.destination);

    if (soundObj.type === 'gitarre') {
        // GITARRE: Physikalische Saiten-Resonanz benötigt Obertöne (Harmonics)
        const oscElement = audioCtx.createOscillator();
        const overtone1 = audioCtx.createOscillator();
        const overtone2 = audioCtx.createOscillator();
        
        // Kombination aus Sägezahn und Dreieck für den holzigen, gezupften Charakter
        oscElement.type = 'sawtooth';
        overtone1.type = 'triangle';
        overtone2.type = 'sine';

        oscElement.frequency.setValueAtTime(baseFreq, now);
        overtone1.frequency.setValueAtTime(baseFreq * 2, now); // 1. Oberton
        overtone2.frequency.setValueAtTime(baseFreq * 3, now); // 2. Oberton

        // Lautstärken-Hüllkurve (Gezupfte Saite: schlagartiger Start, langes Ausklingen)
        masterGain.gain.linearRampToValueAtTime(volume, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Verbinden
        oscElement.connect(masterGain);
        overtone1.connect(masterGain);
        overtone2.connect(masterGain);

        oscElement.start(now); overtone1.start(now); overtone2.start(now);
        oscElement.stop(now + duration); overtone1.stop(now + duration); overtone2.stop(now + duration);
    } 
    else if (soundObj.type === 'piano') {
        // PIANO: Reicher, warmer Klang durch drei eng beieinander liegende Frequenzen (Detuning)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const osc3 = audioCtx.createOscillator();
        
        osc1.type = 'triangle';
        osc2.type = 'triangle';
        osc3.type = 'sine';

        // Leichtes Detuning simuliert die unperfekten echten Klaviersaiten
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc2.frequency.setValueAtTime(baseFreq + 1.5, now);
        osc3.frequency.setValueAtTime(baseFreq - 1.5, now);

        // ADSR Hüllkurve für ein Klavier (Harter Anschlag, kurzes Sinken, sanfter Decay)
        masterGain.gain.linearRampToValueAtTime(volume, now + 0.01);
        masterGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.15);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(masterGain); osc2.connect(masterGain); osc3.connect(masterGain);
        osc1.start(now); osc2.start(now); osc3.start(now);
        osc1.stop(now + duration); osc2.stop(now + duration); osc3.stop(now + duration);
    } 
    else if (soundObj.type === 'trommel') {
        // TROMMEL: Benötigt Audio-Rauschen für Snares/Hats und Frequenzsturz für Kicks
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';

        if (soundObj.id === 'drum_0') { 
            // BD / KICK: Frequenz stürzt innerhalb von Millisekunden ab
            osc.frequency.setValueAtTime(baseFreq * 2.5, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            masterGain.gain.linearRampToValueAtTime(volume, now + 0.005);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            osc.connect(masterGain);
            osc.start(now);
            osc.stop(now + duration);
        } else {
            // SNARE / HAT: Weißes Rauschen erzeugen
            const bufferSize = audioCtx.sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1; // Zufällige Wellenbewegung
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            // Filter hinzufügen, damit es sich nach Holz/Metall anhört
            const filter = audioCtx.createBiquadFilter();
            filter.type = (soundObj.id === 'drum_1') ? 'bandpass' : 'highpass';
            filter.frequency.value = baseFreq;

            masterGain.gain.linearRampToValueAtTime(volume, now + 0.005);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(masterGain);
            noise.start(now);
            noise.stop(now + duration);
        }
    } 
    else if (soundObj.type === 'beat') {
        // ELEKTRISCHE BEATS: Synthetische FM-Modulation (Frequenz steuert Frequenz)
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();

        carrier.type = 'square';
        modulator.type = 'sawtooth';

        carrier.frequency.setValueAtTime(baseFreq, now);
        modulator.frequency.setValueAtTime(baseFreq * 0.5, now);
        modGain.gain.setValueAtTime(150, now); // Modulations-Intensität

        // Verschaltung der FM-Synthese
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(masterGain);

        masterGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        modulator.start(now);
        carrier.start(now);
        modulator.stop(now + duration);
        carrier.stop(now + duration);
    }
}
