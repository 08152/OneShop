// Globale Variablen für Timeline Steuerung
let timelineBlocks = [];
let activeBlockId = null;
let isPlaying = false;
let playInterval = null;
let playheadPos = 0;
const timelineWidth = 1000;

// Recorder Zustand
let mediaRecorder;
let audioChunks = [];

// App-Start
window.addEventListener('DOMContentLoaded', () => {
    initSoundPool();
    initTracks();
    setupMicrophone();
});

// Soundpool UI Generierung
function initSoundPool() {
    for (const [key, list] of Object.entries(soundsData)) {
        const container = document.getElementById(`pool-${key}`);
        list.forEach(sound => {
            const wrapper = document.createElement('div');
            wrapper.className = 'sound-pool-item';

            const btn = document.createElement('button');
            btn.className = `sound-btn btn-${sound.type}`;
            btn.innerText = sound.name;
            btn.onclick = () => {
                audioCtx.resume();
                playSynthesizedSound(sound);
            };

            const addBtn = document.createElement('button');
            addBtn.className = 'add-to-timeline-btn';
            addBtn.innerText = "+ Timeline";
            addBtn.onclick = () => addSoundToTimeline(sound);

            wrapper.appendChild(btn);
            wrapper.appendChild(addBtn);
            container.appendChild(wrapper);
        });
    }
}

// Erstellt vier Standard-Tracks zum Starten
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
}

// Block zur Timeline hinzufügen
function addSoundToTimeline(soundObj) {
    const rows = document.querySelectorAll('.track-row');
    if(rows.length === 0) return;
    
    // Setzt neue Sounds standardmäßig auf die oberste Spur
    const targetRow = rows[0]; 
    const blockId = 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const blockData = {
        id: blockId,
        name: soundObj.name,
        type: soundObj.type,
        freq: soundObj.freq || 0,
        soundId: soundObj.id, 
        left: 50, // Standard Startposition in Pixeln
        duration: 0.8, // Standardlänge in Sekunden
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
    
    block.style.left = data.left + 'px';
    block.style.width = (data.duration * 100) + 'px';

    block.onclick = (e) => {
        e.stopPropagation();
        openEditMenu(data.id);
    };

    rowElement.appendChild(block);
}

// Menü für Blöcke öffnen
function openEditMenu(id) {
    activeBlockId = id;
    const data = timelineBlocks.find(b => b.id === id);
    if(!data) return;

    document.querySelectorAll('.audio-block').forEach(b => b.classList.remove('selected'));
    document.getElementById(id).classList.add('selected');

    document.getElementById('modalTitle').innerText = `Menü: ${data.name}`;
    document.getElementById('modStart').value = data.left;
    document.getElementById('modDuration').value = data.duration;
    document.getElementById('modVolume').value = data.volume;
    document.getElementById('modPitch').value = data.pitch;

    document.getElementById('editModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// Modalfenster-Daten sichern
function saveBlockSettings() {
    const data = timelineBlocks.find(b => b.id === activeBlockId);
    if(!data) return;

    data.left = parseFloat(document.getElementById('modStart').value);
    data.duration = parseFloat(document.getElementById('modDuration').value);
    data.volume = parseFloat(document.getElementById('modVolume').value);
    data.pitch = document.getElementById('modPitch').value;

    const el = document.getElementById(activeBlockId);
    if(el) {
        el.style.left = data.left + 'px';
        el.style.width = (data.duration * 100) + 'px';
    }
    closeModal();
}

function deleteBlock() {
    timelineBlocks = timelineBlocks.filter(b => b.id !== activeBlockId);
    const el = document.getElementById(activeBlockId);
    if(el) el.remove();
    closeModal();
}

// Timeline-Wiedergabe
function playTimeline() {
    if(isPlaying) return;
    audioCtx.resume();
    isPlaying = true;
    
    timelineBlocks.forEach(block => {
        const startTimeOffset = block.left / 100; // 100px = 1 Sekunde
        
        setTimeout(() => {
            if(!isPlaying) return;
            playSynthesizedSound({
                type: block.type,
                freq: block.freq,
                id: block.soundId
            }, block.duration, block.volume, block.pitch);
        }, startTimeOffset * 1000);
    });

    const startTime = Date.now();
    playInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        playheadPos = (elapsedMs / 1000) * 100;
        
        if(playheadPos > timelineWidth) {
            stopTimeline();
        } else {
            document.getElementById('playhead').style.left = playheadPos + 'px';
        }
    }, 30);
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

// Mikrofon-Setup & Logic
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

                    const customSound = { id: soundId, name: `Stimme ${recordedCount}`, type: 'mic', freq: 0 };
                    createMicSoundUI(customSound);
                });
            };

            mediaRecorder.start();
            micBtn.innerText = "⏹ Aufnahme stoppen...";
            micBtn.classList.add('recording');
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
    btn.onclick = () => playSynthesizedSound(customSound);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-to-timeline-btn';
    addBtn.innerText = "+ Timeline";
    addBtn.onclick = () => addSoundToTimeline(customSound);

    wrapper.appendChild(btn);
    wrapper.appendChild(addBtn);
    container.appendChild(wrapper);
}
