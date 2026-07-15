// Globale Steuergrößen
let timelineBlocks = [];
let activeBlockId = null;
let isPlaying = false;
let playInterval = null;
let playheadPos = 0;

// Standardauflösung: 1 Sekunde entspricht 100 Pixeln Breite im Editor
const pixelsPerSecond = 100; 
let timelineSeconds = 10; // Standardlänge der Timeline beim Start

// Recorder Zustand
let mediaRecorder;
let audioChunks = [];

// App-Start nach DOM-Bereitstellung
window.addEventListener('DOMContentLoaded', () => {
    loadAllSoundsAndInitUI();
    initTracks();
    setupMicrophone();
    updateTimelineLength(); // Setzt die initiale Spuren-Breite
});

// Erzeugt die UI-Buttons für den Soundpool nach erfolgreichem Buffer-Load
function createSoundPoolButton(instrument, sound) {
    const container = document.getElementById(`pool-${instrument}`);
    const wrapper = document.createElement('div');
    wrapper.className = 'sound-pool-item';

    const btn = document.createElement('button');
    btn.className = `sound-btn btn-${instrument}`;
    btn.innerText = sound.name;
    btn.onclick = () => {
        audioCtx.resume();
        playRealSound(sound.id, false);
    };

    const addBtn = document.createElement('button');
    addBtn.className = 'add-to-timeline-btn';
    addBtn.innerText = "+ Timeline";
    addBtn.onclick = () => addSoundToTimeline(sound, instrument);

    wrapper.appendChild(btn);
    wrapper.appendChild(addBtn);
    container.appendChild(wrapper);
}

// Passt die sichtbare Breite aller Spuren an die eingestellte Timeline-Sekundenanzahl an
function updateTimelineLength() {
    const inputVal = parseInt(document.getElementById('timelineLength').value);
    if (isNaN(inputVal) || inputVal < 5) return;
    
    timelineSeconds = inputVal;
    const totalWidthPx = timelineSeconds * pixelsPerSecond;
    
    // Setzt die CSS-Breite der Zeilen dynamisch
    document.querySelectorAll('.track-row').forEach(row => {
        row.style.width = totalWidthPx + 'px';
        row.style.minWidth = totalWidthPx + 'px';
    });

    // Reichweite des Startzeit-Reglers im Modal anpassen
    document.getElementById('modStart').max = timelineSeconds;
}

function initTracks() {
    for(let i = 0; i < 4; i++) {
        addTrackRow();
    }
}

function addTrackRow() {
    const tracksContainer = document.getElementById('timelineTracks');
    const row = document.createElement('div');
    row.className = 'track-row';
    tracksContainer.appendChild(row);
    updateTimelineLength();
}

// Block zur Timeline hinzufügen
function addSoundToTimeline(soundObj, instrumentType) {
    const rows = document.querySelectorAll('.track-row');
    if(rows.length === 0) return;
    
    // Setzt neue Sounds standardmäßig auf die oberste Spur
    const targetRow = rows[0]; 
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    // Versucht die echte Länge des geladenen Audiopuffers als Standardwert zu nehmen
    let defaultDuration = 1.0;
    if (loadedAudioBuffers[soundObj.id]) {
        defaultDuration = Math.min(parseFloat(loadedAudioBuffers[soundObj.id].duration.toFixed(1)), 4.0);
    }

    const blockData = {
        id: blockId,
        name: soundObj.name,
        type: instrumentType,
        soundId: soundObj.id, 
        startTime: 0.5, // Startzeitpunkt in Sekunden auf der Achse
        duration: defaultDuration, 
        volume: 0.7,
        pitch: 'normal'
    };

    timelineBlocks.push(blockData);
    renderBlock(blockData, targetRow);
}

function renderBlock(data, rowElement) {
    const block = document.createElement('div');
    block.className = `audio-block btn-${data.type}`;
    block.id = data.id;
    block.innerText = data.name;
    
    // Positionierung basierend auf Sekunden * Multiplikator
    block.style.left = (data.startTime * pixelsPerSecond) + 'px';
    block.style.width = (data.duration * pixelsPerSecond) + 'px';

    block.onclick = (e) => {
        e.stopPropagation();
        openEditMenu(data.id);
    };

    rowElement.appendChild(block);
}

// Detail-Menü für Blöcke öffnen
function openEditMenu(id) {
    activeBlockId = id;
    const data = timelineBlocks.find(b => b.id === id);
    if(!data) return;

    document.querySelectorAll('.audio-block').forEach(b => b.classList.remove('selected'));
    document.getElementById(id).classList.add('selected');

    document.getElementById('modalTitle').innerText = `Menü: ${data.name}`;
    
    // Slider Limits updaten
    const startSlider = document.getElementById('modStart');
    startSlider.max = timelineSeconds;
    startSlider.value = data.startTime;
    document.getElementById('modStartVal').innerText = data.startTime + "s";
    
    const durationSlider = document.getElementById('modDuration');
    durationSlider.value = data.duration;
    document.getElementById('modDurationVal').innerText = data.duration + "s";

    document.getElementById('modVolume').value = data.volume;
    document.getElementById('modPitch').value = data.pitch;

    // Dynamische Live-Wertänderungen anzeigen während man schiebt
    startSlider.oninput = (e) => document.getElementById('modStartVal').innerText = e.target.value + "s";
    durationSlider.oninput = (e) => document.getElementById('modDurationVal').innerText = e.target.value + "s";

    document.getElementById('editModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// Speichert die geänderten Details (Länge, Klang, Lautstärke) ab
function saveBlockSettings() {
    const data = timelineBlocks.find(b => b.id === activeBlockId);
    if(!data) return;

    data.startTime = parseFloat(document.getElementById('modStart').value);
    data.duration = parseFloat(document.getElementById('modDuration').value);
    data.volume = parseFloat(document.getElementById('modVolume').value);
    data.pitch = document.getElementById('modPitch').value;

    const el = document.getElementById(activeBlockId);
    if(el) {
        el.style.left = (data.startTime * pixelsPerSecond) + 'px';
        el.style.width = (data.duration * pixelsPerSecond) + 'px';
    }
    closeModal();
}

function deleteBlock() {
    timelineBlocks = timelineBlocks.filter(b => b.id !== activeBlockId);
    const el = document.getElementById(activeBlockId);
    if(el) el.remove();
    closeModal();
}

// Präzise Wiedergabe der kompletten Timeline
function playTimeline() {
    if(isPlaying) return;
    audioCtx.resume();
    isPlaying = true;
    
    const totalDurationMs = timelineSeconds * 1000;
    
    // Alle Sounds zur exakten Startzeit einreihen
    timelineBlocks.forEach(block => {
        setTimeout(() => {
            if(!isPlaying) return;
            const isMicSound = (block.type === 'mic');
            playRealSound(block.soundId, isMicSound, block.duration, block.volume, block.pitch);
        }, block.startTime * 1000);
    });

    // Playhead-Animation starten
    const startTime = Date.now();
    playInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        playheadPos = (elapsedMs / 1000) * pixelsPerSecond;
        
        if(elapsedMs >= totalDurationMs) {
            stopTimeline();
        } else {
            document.getElementById('playhead').style.left = playheadPos + 'px';
        }
    }, 25);
}

function stopTimeline() {
    isPlaying = false;
    clearInterval(playInterval);
    document.getElementById('playhead').style.left = '0px';
}

function clearTimeline() {
    stopTimeline();
    timelineBlocks = [];
    document.querySelectorAll('.track-row').forEach(row => {
        row.innerHTML = '';
    });
}

// Mikrofon-Zustand und Trigger-Events
function setupMicrophone() {
    const micBtn = document.getElementById('micBtn');
    
    micBtn.onclick = async () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            micBtn.innerText = "Aufnahme starten";
            micBtn.classList.remove('recording');
        } else {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Mikrofon wird auf diesem Endgerät/Browser nicht unterstützt.");
                return;
            }
            audioChunks = [];
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    
                    audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
                        recordedCount++;
                        const soundId = `mic_sound_${recordedCount}`;
                        recordedBuffers[soundId] = buffer;

                        const customSound = { id: soundId, name: `Stimme ${recordedCount}`, type: 'mic' };
                        createMicSoundUI(customSound);
                    });
                };

                mediaRecorder.start();
                micBtn.innerText = "⏹ Aufnahme stoppen...";
                micBtn.classList.add('recording');
            } catch (err) {
                alert("Mikrofonzugriff verweigert.");
            }
        }
    };
}

function createMicSoundUI(customSound) {
    const container = document.getElementById('micSounds');
    const wrapper = document.createElement('div');
    wrapper.className = 'sound-pool-item';

    const btn = document.createElement('button');
    btn.className = `sound-btn btn-mic`;
    btn.innerText = customSound.name;
btn.onclick = () => playRealSound(customSound.id, true);

const addBtn = document.createElement('button');
addBtn.className = 'add-to-timeline-btn';
addBtn.innerText = "+ Timeline";
addBtn.onclick = () => addSoundToTimeline(customSound, 'mic');

wrapper.appendChild(btn);
wrapper.appendChild(addBtn);
container.appendChild(wrapper);
}
