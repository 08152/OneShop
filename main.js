// --- ABSTEUERUNG UND UI EVENT ENGINE ---
let isPlaying = false;
let playStartTime = 0;
let playOffset = 0;
let animationFrameId = null;
let activeEditingClipId = null;

// DOM Elements
const soundListEl = document.getElementById('sound-list');
const timelineEl = document.getElementById('timeline');
const playheadEl = document.getElementById('playhead');
const durationInput = document.getElementById('timeline-duration');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');
const btnDownload = document.getElementById('btn-download');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const clipVolumeInput = document.getElementById('clip-volume');
const btnCloseModal = document.getElementById('modal-close');
const btnSaveClip = document.getElementById('btn-save-clip');
const btnDeleteClip = document.getElementById('btn-delete-clip');

function init() {
    loadFromLocalStorage();
    durationInput.value = appState.timelineDuration;
    
    renderSoundMenu();
    updateTimelineWidth();
    renderClips();
    
    // Core Listeners
    durationInput.addEventListener('change', handleDurationChange);
    timelineEl.addEventListener('click', handleTimelineClick);
    btnPlay.addEventListener('click', togglePlay);
    btnStop.addEventListener('click', stopPlayback);
    btnDownload.addEventListener('click', downloadSong);
    
    // Modal Listeners
    btnCloseModal.addEventListener('click', closeModal);
    btnSaveClip.addEventListener('click', saveClipSettings);
    btnDeleteClip.addEventListener('click', deleteClip);
}

function renderSoundMenu() {
    soundListEl.innerHTML = '<h3>Sound Liste</h3>';
    AVAILABLE_SOUNDS.forEach(sound => {
        const item = document.createElement('div');
        item.className = `sound-item ${appState.selectedSoundId === sound.id ? 'selected' : ''}`;
        
        item.innerHTML = `
            <div class="sound-info">
                <span class="sound-name">${sound.name}</span>
                <span class="sound-type">Dauer: ${sound.duration}s</span>
            </div>
            <button class="btn-pick" data-id="${sound.id}">Pick</button>
        `;
        
        item.querySelector('.btn-pick').addEventListener('click', (e) => {
            e.stopPropagation();
            appState.selectedSoundId = sound.id;
            renderSoundMenu();
            playSoundLive(sound, 100, audioCtx.currentTime);
        });
        
        soundListEl.appendChild(item);
    });
}

function updateTimelineWidth() {
    timelineEl.style.width = `${appState.timelineDuration * 100}px`;
}

function renderClips() {
    const existingClips = timelineEl.querySelectorAll('.clip');
    existingClips.forEach(c => c.remove());

    appState.clips.forEach(clip => {
        const sound = AVAILABLE_SOUNDS.find(s => s.id === clip.soundId);
        if (!sound) return;

        const clipEl = document.createElement('div');
        clipEl.className = 'clip';
        clipEl.innerText = `${sound.name} (${clip.volume}%)`;
        
        const leftPercent = (clip.time / appState.timelineDuration) * 100;
        const widthPercent = (sound.duration / appState.timelineDuration) * 100;
        
        clipEl.style.left = `${leftPercent}%`;
        clipEl.style.width = `max(${widthPercent}%, 40px)`;

        clipEl.addEventListener('click', (e) => {
            e.stopPropagation();
            activeEditingClipId = clip.id;
            modalTitle.innerText = `Sound: ${sound.name}`;
            clipVolumeInput.value = clip.volume;
            modalOverlay.style.display = 'flex';
        });

        timelineEl.appendChild(clipEl);
    });
}

function handleDurationChange() {
    let val = parseInt(durationInput.value) || 10;
    if (val < 2) val = 2;
    if (val > 60) val = 60;
    appState.timelineDuration = val;
    durationInput.value = val;
    
    appState.clips = appState.clips.filter(c => c.time <= val);
    updateTimelineWidth();
    renderClips();
    saveToLocalStorage();
}

function handleTimelineClick(e) {
    if (!appState.selectedSoundId) {
        alert("Bitte wähle zuerst links einen Sound mit 'Pick' aus!");
        return;
    }

    const rect = timelineEl.getBoundingClientRect();
    const clickedTime = ((e.clientX - rect.left) / rect.width) * appState.timelineDuration;

    appState.clips.push({
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        soundId: appState.selectedSoundId,
        time: clickedTime,
        volume: 100.0
    });
    renderClips();
    saveToLocalStorage();
}

function closeModal() {
    modalOverlay.style.display = 'none';
    activeEditingClipId = null;
}

function saveClipSettings() {
    let vol = parseFloat(clipVolumeInput.value);
    if (isNaN(vol) || vol < 0.5) vol = 0.5;
    if (vol > 100.0) vol = 100.0;

    const clip = appState.clips.find(c => c.id === activeEditingClipId);
    if (clip) {
        clip.volume = vol;
        renderClips();
        saveToLocalStorage();
    }
    closeModal();
}

function deleteClip() {
    appState.clips = appState.clips.filter(c => c.id !== activeEditingClipId);
    renderClips();
    saveToLocalStorage();
    closeModal();
}

// --- PLAYER ---
function togglePlay() {
    if (isPlaying) {
        isPlaying = false;
        btnPlay.innerText = "▶ Abspielen";
        cancelAnimationFrame(animationFrameId);
        playOffset = audioCtx.currentTime - playStartTime;
        if (playOffset >= appState.timelineDuration) playOffset = 0;
    } else {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        isPlaying = true;
        btnPlay.innerText = "⏸ Pause";
        playStartTime = audioCtx.currentTime - playOffset;
        
        const now = audioCtx.currentTime;
        appState.clips.forEach(clip => {
            const sound = AVAILABLE_SOUNDS.find(s => s.id === clip.soundId);
            if (sound && clip.time >= playOffset) {
                playSoundLive(sound, clip.volume, now + (clip.time - playOffset));
            }
        });
        updatePlayhead();
    }
}

function stopPlayback() {
    isPlaying = false;
    btnPlay.innerText = "▶ Abspielen";
    cancelAnimationFrame(animationFrameId);
    playOffset = 0;
    playheadEl.style.left = '0px';
}

function updatePlayhead() {
    if (!isPlaying) return;
    const elapsed = audioCtx.currentTime - playStartTime;
    
    if (elapsed >= appState.timelineDuration) {
        stopPlayback();
        return;
    }
    playheadEl.style.left = `${(elapsed / appState.timelineDuration) * 100}%`;
    animationFrameId = requestAnimationFrame(updatePlayhead);
}

function downloadSong() {
    if (appState.clips.length === 0) return alert("Deine Timeline ist leer!");
    btnDownload.innerText = "⏳ Generiere...";
    btnDownload.disabled = true;

    renderWavAndDownload().then(wavBlob => {
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mein_song.wav';
        a.click();
        URL.revokeObjectURL(url);
        btnDownload.innerText = "💾 Song Downloaden";
        btnDownload.disabled = false;
    });
}

window.onload = init;
