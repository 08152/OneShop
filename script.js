// 1. Audio Engine initialisieren
let synth, bass;

function initAudio() {
    if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        bass = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            filter: { Q: 1, type: "lowpass", frequency: 200 }
        }).toDestination();
    }
}

let currentSequence = null;
let generatedSongs = [];
let activeSong = null;
let progressInterval = null;
let elapsedSeconds = 0;

const emojis = ['🎵', '🎹', '🎸', '🌌', '⚡', '🤖', '🎧', '🔥', '🔮'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

// 2. Klick-Event für die Song-Erstellung absichern
const generateBtn = document.getElementById('generateBtn');
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        try {
            // Erzwinge den Start der Audio-Engine bei Interaktion
            await Tone.start();
            initAudio();
            console.log("Audio Context erfolgreich gestartet.");

            const prompt = document.getElementById('promptInput').value || "Abstract AI Vibe";
            const style = document.getElementById('styleInput').value || "Experimental";
            const title = document.getElementById('titleInput').value || "AI Session #" + (generatedSongs.length + 1);

            let scale = ['C4', 'E4', 'G4', 'B4']; 
            if(style.toLowerCase().includes('cyber') || style.toLowerCase().includes('dark') || style.toLowerCase().includes('synth')) {
                scale = ['A3', 'C4', 'D4', 'E4', 'G4'];
            }

            const melodyPattern = Array.from({length: 16}, () => Math.random() > 0.4 ? scale[Math.floor(Math.random() * scale.length)] : null);
            const bassPattern = Array.from({length: 16}, (v, i) => i % 4 === 0 ? scale[0].replace('4', '2').replace('3', '2') : null);

            const newSong = {
                id: Date.now(),
                title: title,
                prompt: prompt,
                style: style,
                emoji: getRandomEmoji(),
                melody: melodyPattern,
                bass: bassPattern
            };

            generatedSongs.unshift(newSong); 
            renderSongs();
            playSong(newSong);

            document.getElementById('titleInput').value = '';
        } catch (error) {
            console.error("Fehler beim Erstellen des Songs:", error);
        }
    });
}

// 3. Songs in die Liste rendern
function renderSongs() {
    const container = document.getElementById('songsContainer');
    if (!container) return; // Falls wir auf einer Unterseite ohne Liste sind
    
    container.innerHTML = '';

    if (generatedSongs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Noch keine Songs erstellt.</p>';
        return;
    }

    generatedSongs.forEach(song => {
        const card = document.createElement('div');
        card.className = `song-card ${activeSong && activeSong.id === song.id ? 'active-card' : ''}`;
        
        // CSS Style dynamisch injizieren für aktive Kantenbeleuchtung
        if(activeSong && activeSong.id === song.id) {
            card.style.borderColor = "var(--accent)";
        }

        card.innerHTML = `
            <div class="song-info">
                <div class="song-cover">${song.emoji}</div>
                <div class="song-details">
                    <div class="title">${song.title}</div>
                    <div class="prompt-text">${song.prompt}</div>
                    <div class="song-tags">
                        <span class="tag">${song.style}</span>
                        <span class="tag">AI Generated</span>
                    </div>
                </div>
            </div>
            <button class="play-card-btn">
                <i class="fa-solid ${activeSong && activeSong.id === song.id && Tone.Transport.state === 'started' ? 'fa-circle-pause' : 'fa-circle-play'}"></i>
            </button>
        `;

        card.querySelector('.play-card-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeSong && activeSong.id === song.id) {
                togglePlay();
            } else {
                playSong(song);
            }
        });

        container.appendChild(card);
    });
}

// 4. Playback Steuerung
function playSong(song) {
    initAudio();
    stopAudio();
    activeSong = song;

    const currentTitle = document.getElementById('currentTitle');
    const currentStyle = document.getElementById('currentStyle');
    const currentCover = document.getElementById('currentCover');
    const globalPlayBtn = document.getElementById('globalPlayBtn');

    if (currentTitle) currentTitle.innerText = song.title;
    if (currentStyle) currentStyle.innerText = song.style;
    if (currentCover) currentCover.innerHTML = song.emoji;
    if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';

    let index = 0;
    currentSequence = Tone.Transport.scheduleRepeat((time) => {
        let step = index % 16;
        
        if (song.melody[step] && synth) {
            synth.triggerAttackRelease(song.melody[step], "16n", time, 0.4);
        }
        if (song.bass[step] && bass) {
            bass.triggerAttackRelease(song.bass[step], "8n", time, 0.6);
        }
        index++;
    }, "16n");

    Tone.Transport.bpm.value = 120;
    Tone.Transport.start();

    elapsedSeconds = 0;
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        elapsedSeconds += 0.5;
        if(elapsedSeconds > 15) elapsedSeconds = 0; 
        
        const progressFill = document.getElementById('progressFill');
        const currentTime = document.getElementById('currentTime');
        
        if (progressFill) progressFill.style.width = ((elapsedSeconds / 15) * 100) + '%';
        if (currentTime) {
            let mins = Math.floor(elapsedSeconds / 60);
            let secs = Math.floor(elapsedSeconds % 60);
            currentTime.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    }, 500);

    renderSongs();
}

function stopAudio() {
    Tone.Transport.stop();
    if (currentSequence !== null) {
        Tone.Transport.clear(currentSequence);
        currentSequence = null;
    }
    clearInterval(progressInterval);
    
    const progressFill = document.getElementById('progressFill');
    const currentTime = document.getElementById('currentTime');
    const globalPlayBtn = document.getElementById('globalPlayBtn');

    if (progressFill) progressFill.style.width = '0%';
    if (currentTime) currentTime.innerText = '0:00';
    if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
}

function togglePlay() {
    if (!activeSong) return;
    const globalPlayBtn = document.getElementById('globalPlayBtn');
    
    if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        clearInterval(progressInterval);
        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    } else {
        Tone.Transport.start();
        progressInterval = setInterval(() => {
            elapsedSeconds += 0.5;
            if(elapsedSeconds > 15) elapsedSeconds = 0;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) progressFill.style.width = (elapsedSeconds / 15) * 100 + '%';
        }, 500);
        if (globalPlayBtn) globalPlayBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    }
    renderSongs();
}

const globalPlayBtn = document.getElementById('globalPlayBtn');
if (globalPlayBtn) {
    globalPlayBtn.addEventListener('click', togglePlay);
}

// Initialer Render beim Laden der Seite
window.addEventListener('DOMContentLoaded', () => {
    renderSongs();
});
