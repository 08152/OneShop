// Globale Steuergrößen
let timelineBlocks = [];
let activeBlockId = null;
let isPlaying = false;
let playInterval = null;
let playheadPos = 0;

const pixelsPerSecond = 100; 
let timelineSeconds = 10; 

// Recorder Zustand
let mediaRecorder;
let audioChunks = [];

// DOM Ready
window.addEventListener('DOMContentLoaded', () => {
    loadAllSoundsAndInitUI();
    initTracks();
    setupMicrophone();
    updateTimelineLength();
});

// Erzeugt UI-Buttons im Soundpool mit nativen HTML5 Drag-Attributes
function createSoundPoolButton(instrument, sound) {
    const container = document.getElementById(`pool-${instrument}`);
    
    const btn = document.createElement('button');
    btn.className = `sound-btn btn-${instrument}`;
    btn.innerText = sound.name;
    btn.draggable = true; // Dragging erlauben

    // Klick spielt den Sound kurz ab
    btn.onclick = () => {
        audioCtx.resume();
        playRealSound(sound.id, false);
    };

    // Drag-Data anhängen
    btn.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            mode: 'new',
            soundId: sound.id,
            name: sound.name,
            type: instrument
        }));
    };

    container.appendChild(btn);
}

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

function initTracks() {
    for(let i = 0; i < 4; i++) {
        addTrackRow();
    }
}

// Spuren initialisieren und für das "Droppen" fit machen
function addTrackRow() {
    const tracksContainer = document.getElementById('timelineTracks');
    const row = document.createElement('div');
    row.className = 'track-row';
    
    // Generiert eine eindeutige Spur-ID
    row.dataset.trackId = 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    // Drag-over Events, um visuelles Feedback zu steuern
    row.ondragover = (e) => {
        e.preventDefault(); // Zwingend nötig, damit Drop funktioniert
        row.classList.add('drag-over');
    };

    row.ondragleave = () => {
        row.classList.remove('drag-over');
    };

    // Das Drop-Event verarbeitet die Koordinaten und platziert den Sound genau an der X-Achse
    row.ondrop = (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        
        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;
        const dragData = JSON.parse(dataStr);

        // Berechne X-Position innerhalb der getroffenen Spur
        const rect = row.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        let targetTime = offsetX / pixelsPerSecond;
        if(targetTime < 0) targetTime = 0;

        if (dragData.mode === 'new') {
            // Aus dem Pool gezogen -> Neuen Block generieren
            createNewBlockOnTimeline(dragData, targetTime, row);
        } else if (dragData.mode === 'move') {
            // Existierenden Block innerhalb der Timeline verschieben
            moveExistingBlockOnTimeline(dragData.blockId, targetTime, row);
        }
    };

    tracksContainer.appendChild(row);
    updateTimelineLength();
}

// Erzeugt Datenstruktur und Node für ein neues Element
function createNewBlockOnTimeline(dragData, startTime, rowElement) {
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    let defaultDuration = 1.0;
    const isMic = (dragData.type === 'mic');
    const activeBuffer = isMic ? recordedBuffers[dragData.soundId] : loadedAudioBuffers[dragData.soundId];
    
    if (activeBuffer) {
        defaultDuration = Math.min(parseFloat(activeBuffer.duration.toFixed(2)), 5.0);
    }

    const blockData = {
        id: blockId,
        name: dragData.name,
        type: dragData.type,
        soundId: dragData.soundId, 
        startTime: parseFloat(startTime.toFixed(2)), 
        duration: defaultDuration, 
        volume: 0.7,
        pitch: 'normal',
        trackId: rowElement.dataset.trackId
    };

    timelineBlocks.push(blockData);
    renderBlock(blockData, rowElement);
}

// Verschiebt ein bestehendes Element auf eine neue Position/Spur
function moveExistingBlockOnTimeline(blockId, newStartTime, targetRow) {
    const data = timelineBlocks.find(b => b.id === blockId);
    if (!data) return;

    data.startTime = parseFloat(newStartTime.toFixed(2));
    data.trackId = targetRow.dataset.trackId;

    const blockEl = document.getElementById(blockId);
    if (blockEl) {
        blockEl.style.left = (data.startTime * pixelsPerSecond) + 'px';
        targetRow.appendChild(blockEl); // HTML-Knoten in die neue Spur-Zeile hängen
    }
}

function renderBlock(data, rowElement) {
    const block = document.createElement('div');
    block.className = `audio-block btn-${data.type}`;
    block.id = data.id;
    block.innerText = data.name;
    block.draggable = true; // Ermöglicht das Verschieben auf der Timeline
    
    block.style.left = (data.startTime * pixelsPerSecond) + 'px';
    block.style.width = (data.duration * pixelsPerSecond) + 'px';

    // Öffnet Detail-Menü bei Klick
    block.onclick = (e) => {
        e.stopPropagation();
        openEditMenu(data.id);
    };

    // Event, wenn man einen existierenden Block zu ziehen beginnt
    block.ondragstart = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', JSON.stringify({
            mode: 'move',
            blockId: data.id
        }));
    };

    rowElement.appendChild(block);
}

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

    startSlider.oninput = (e) => document.getElementById('modStartVal').innerText = e.target.value + "s";
    durationSlider.oninput = (e) => document.getElementById('modDurationVal').innerText = e.target.value + "s";

    document.getElementById('editModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

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

function playTimeline() {
    if(isPlaying) return;
    audioCtx.resume();
    isPlaying = true;
    
    const totalDurationMs = timelineSeconds * 1000;
    
    timelineBlocks.forEach(block => {
        setTimeout(() => {
            if(!isPlaying) return;
            const isMicSound = (block.type === 'mic');
            playRealSound(block.soundId, isMicSound, block.duration, block.volume, block.pitch);
        }, block.startTime * 1000);
    });

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
        // Entfernt alle Kinder außer dem Abspielbalken (Playhead)
        const blocks = row.querySelectorAll('.audio-block');
        blocks.forEach(b => b.remove());
    });
}

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

const btn = document.createElement('button');
btn.className = sound-btn btn-mic;
btn.innerText = customSound.name;
btn.draggable = true;

btn.onclick = () => playRealSound(customSound.id, true);

btn.ondragstart = (e) => {
e.dataTransfer.setData('text/plain', JSON.stringify({
mode: 'new',
