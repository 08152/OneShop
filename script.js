// Globale Steuergrößen
let timelineBlocks = [];
let activeBlockId = null;
let isPlaying = false;
let playInterval = null;
let playheadPos = 0;
let trackCounter = 0;

const pixelsPerSecond = 100; // 1 Sekunde auf der Timeline entspricht 100 Pixeln Breite
let timelineSeconds = 10;

// Recorder Zustand
let mediaRecorder;
let audioChunks = [];

// App beim Laden initialisieren
window.addEventListener('DOMContentLoaded', () => {
    buildSoundPoolUI();
    initTracks();
    setupMicrophone();
    updateTimelineLength();
});

// Erzeugt die Benutzeroberfläche für den Soundpool
function buildSoundPoolUI() {
    for (const [key, list] of Object.entries(soundsData)) {
        const container = document.getElementById(`pool-${key}`);
        container.innerHTML = ''; // Platzhalter entfernen

        list.forEach(sound => {
            const wrapper = document.createElement('div');
            wrapper.className = 'sound-pool-item';

            // Vorschau-Button zum schnellen Anhören
            const btn = document.createElement('button');
            btn.className = `sound-btn btn-${sound.type}`;
            btn.innerText = sound.name;
            btn.onclick = () => playAudioResource(sound.id, false);

            // Drag & Drop Griff
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerText = 'DRAG';
            dragHandle.setAttribute('draggable', 'true');
            
            // Drag-Daten verpacken
            dragHandle.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    soundId: sound.id,
                    name: sound.name,
                    type: sound.type,
                    isMic: false
                }));
            };

            wrapper.appendChild(btn);
            wrapper.appendChild(dragHandle);
            container.appendChild(wrapper);
        });
    }
}

// Generiert die 4 Standardspuren zu Beginn
function initTracks() {
    for(let i = 0; i < 4; i++) {
        addTrackRow();
    }
}

// Erstellt eine neue Spur in der Timeline samt Drag-and-Drop Erkennung
function addTrackRow() {
    trackCounter++;
    const tracksContainer = document.getElementById('timelineTracks');
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.trackId = 'track_' + trackCounter;
    
    // Optisches Highlight beim Darüberziehen eines Tons
    row.ondragover = (e) => {
        e.preventDefault();
        row.classList.add('drag-over');
    };

    row.ondragleave = () => {
        row.classList.remove('drag-over');
    };

    // Ablegen des Elements an der präzisen Maus-Pixelposition
    row.ondrop = (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            // Berechnen der genauen Sekunde auf der Timeline
            const rect = row.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            
            let calculatedTime = parseFloat((clickX / pixelsPerSecond).toFixed(1));
            if (calculatedTime < 0) calculatedTime = 0;
            if (calculatedTime > timelineSeconds - 0.2) calculatedTime = timelineSeconds - 0.2;

            dropNewSoundOnTimeline(dragData, calculatedTime, row);
        } catch(err) {
            console.error("Fehler beim Verarbeiten des Drops:", err);
        }
    };

    tracksContainer.appendChild(row);
    updateTimelineLength();
}

// Aktualisiert die visuelle Breite der Timeline-Spuren
function updateTimelineLength() {
    const inputVal = parseInt(document.getElementById('timelineLength').value);
    if (isNaN(inputVal) || inputVal < 5) return;
    
    timelineSeconds = inputVal;
    const totalWidthPx = timelineSeconds * pixelsPerSecond;
    
    document.querySelectorAll('.track-row').forEach(row => {
        row.style.width = totalWidthPx + 'px';
        row.style.minWidth = totalWidthPx + 'px';
    });

    document.getElementById('modStart').max = timelineSeconds;
}

// Speichert das gedroppte Element dauerhaft ab
function dropNewSoundOnTimeline(dragData, startTime, rowElement) {
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const blockData = {
        id: blockId,
        name: dragData.name,
        type: dragData.type,
        soundId: dragData.soundId,
        isMic: dragData.isMic,
        startTime: startTime,
        duration: 0.6, // Standard-Dauer in Sekunden
        volume: 0.7,
        pitch: 'normal',
        trackId: rowElement.dataset.trackId
    };

    timelineBlocks.push(blockData);
    renderBlock(blockData, rowElement);
}

// Rendert das visuelle Rechteck auf der Spur
function renderBlock(data, rowElement) {
    const block = document.createElement('div');
    block.className = `audio-block btn-${data.type}`;
    block.id = data.id;
    block.innerText = data.name;
    
    block.style.left = (data.startTime * pixelsPerSecond) + 'px';
    block.style.width = (data.duration * pixelsPerSecond) + 'px';

    block.onclick = (e) => {
        e.stopPropagation();
        openEditMenu(data.id);
    };

    rowElement.appendChild(block);
}

// Öffnet das Einstellungsmenü für den angeklickten Block
function openEditMenu(id) {
    activeBlockId = id;
    const data = timelineBlocks.find(b => b.id === id);
    if(!data) return;

    document.querySelectorAll('.audio-block').forEach(b => b.classList.remove('selected'));
    document.getElementById(id).classList.add('selected');

    document.getElementById('modalTitle').innerText = `Menü: ${data.name}`;
    
    const startSlider = document.getElementById('modStart');
    startSlider.max = timelineSeconds;
    startSlider.value = data.startTime;
    document.getElementById('modStartVal').innerText = data.startTime + "s";
    
    const durationSlider = document.getElementById('modDuration');
    durationSlider.value = data.duration;
    document.getElementById('modDurationVal').innerText = data.duration + "s";

    document.getElementById('modVolume').value = data.volume;
    document.getElementById('modPitch').value = data.pitch;

    // Echtzeit-Textanzeige beim Schieben der Regler
    startSlider.oninput = (e) => document.getElementById('modStartVal').innerText = e.target.value + "s";
    durationSlider.oninput = (e) => document.getElementById('modDurationVal').innerText = e.target.value + "s";

    document.getElementById('editModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// Sichert die Einstellungen aus dem Menü
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

// Löscht den Block über das Einstellungsmenü
function deleteBlock() {
    timelineBlocks = timelineBlocks.filter(b => b.id !== activeBlockId);
    const el = document.getElementById(activeBlockId);
    if(el) el.remove();
    closeModal();
}

// Spielt die gesamte Timeline ab
function playTimeline() {
    if(isPlaying) return;
    isPlaying = true;
    
    const totalDurationMs = timelineSeconds * 1000;
    
    // Reihenfolgensteuerung über Timeouts gesteuert an die Audio-Engine übergeben
    timelineBlocks.forEach(block => {
        setTimeout(() => {
            if(!isPlaying) return;
            playAudioResource(block.soundId, block.isMic, block.duration, block.volume, block.pitch);
        }, block.startTime * 1000);
    });

    // Bewegung des roten Abspielbalkens (Playhead)
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
        const blocks = row.querySelectorAll('.audio-block');
        blocks.forEach(b => b.remove());
    });
}

// Stimm-Aufnahme Logik via MediaRecorder API
function setupMicrophone() {
    const micBtn = document.getElementById('micBtn');
    
    micBtn.onclick = async () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            micBtn.innerText = "Aufnahme starten";
            micBtn.classList.remove('recording');
        } else {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Mikrofon wird nicht unterstützt.");
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
const soundId = mic_sound_${recordedCount};
recordedBuffers[soundId] = buffer;

const customSound = { id: soundId, name: Stimme ${recordedCount}, type: 'mic' };
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
btn.className = sound-btn btn-mic;
btn.innerText = customSound.name;
btn.onclick = () => playAudioResource(customSound.id, true);

const dragHandle = document.createElement('div');
dragHandle.className = 'drag-handle';
dragHandle.innerText = 'DRAG';
dragHandle.setAttribute('draggable', 'true');
dragHandle.ondragstart = (e) => {
e.dataTransfer.setData('text/plain', JSON.stringify({
soundId: customSound.id,
name: customSound.name,
type: customSound.type,
isMic: true
}));
};

wrapper.appendChild(btn);
wrapper.appendChild(dragHandle);
container.appendChild(wrapper);
}
