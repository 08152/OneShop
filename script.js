// 1. Audio Engine mit Tone.js einrichten
const synth = new Tone.PolySynth(Tone.Synth).toDestination();
const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { Q: 1, type: "lowpass", frequency: 200 }
}).toDestination();

let currentSequence = null;
let generatedSongs = [];
let activeSong = null;
let progressInterval = null;
let elapsedSeconds = 0;

// Emojis für die zufälligen Song-Cover
const emojis = ['🎵', '🎹', '🎸', '🌌', '⚡', '🤖', '🎧', '🔥', '🔮'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

// 2. Event Listener für den Create-Button
document.getElementById('generateBtn').addEventListener('click', async () => {
    // Browser blockiert Audio ohne User-Interaktion
    await Tone.start(); 

    const prompt = document.getElementById('promptInput').value || "Abstract AI Vibe";
    const style = document.getElementById('styleInput').value || "Experimental";
    const title = document.getElementById('titleInput').value || "AI Session #" + (generatedSongs.length + 1);

    // Skala basierend auf dem Musikstil festlegen
    let scale = ['C4', 'E4', 'G4', 'B4']; 
    if(style.toLowerCase().includes('cyber') || style.toLowerCase().includes('dark') || style.toLowerCase().includes('synth')) {
        scale = ['A3', 'C4', 'D4', 'E4', 'G4']; // Moll-Pentatonik
    }

    // Zufällige Melodie und Bassline erzeugen (16 Schritte)
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

    // Formular zurücksetzen
    document.getElementById('titleInput').value = '';
});

// 3. Songliste im Dashboard rendern
function renderSongs() {
    const container = document.getElementById('songsContainer');
    container.innerHTML = '';

    generatedSongs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
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

// 4. Musik abspielen
function playSong(song) {
    stopAudio();
    activeSong = song;

    // Player UI aktualisieren
    document.getElementById('currentTitle').innerText = song.title;
    document.getElementById('currentStyle').innerText = song.style;
    document.getElementById('currentCover').innerHTML = song.emoji;
    document.getElementById('globalPlayBtn').innerHTML = '<i class="fa-solid fa-circle-pause"></i>';

    let index = 0;
    // Tone.js Loop starten
    currentSequence = Tone.Transport.scheduleRepeat((time) => {
        let step = index % 16;
        
        if (song.melody[step]) {
            synth.triggerAttackRelease(song.melody[step], "16n", time, 0.4);
        }
        if (song.bass[step]) {
            bass.triggerAttackRelease(song.bass[step], "8n", time, 0.6);
        }
        index++;
    }, "16n");

    Tone.Transport.bpm.value = 120;
    Tone.Transport.start();

    // Fortschrittsleiste animieren
    elapsedSeconds = 0;
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        elapsedSeconds += 0.5;
        if(elapsedSeconds > 15) elapsedSeconds = 0; 
        
        const percent = (elapsedSeconds / 15) * 100;
        document.getElementById('progressFill').style.width = percent + '%';
        
        let mins = Math.floor(elapsedSeconds / 60);
        let secs = Math.floor(elapsedSeconds % 60);
        document.getElementById('currentTime').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, 500);

    renderSongs();
}

// 5. Audio stoppen oder pausieren
function stopAudio() {
    Tone.Transport.stop();
    if (currentSequence !== null) {
        Tone.Transport.clear(currentSequence);
        currentSequence = null;
    }
    clearInterval(progressInterval);
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').innerText = '0:00';
    document.getElementById('globalPlayBtn').innerHTML = '<i class="fa-solid fa-circle-play"></i>';
}

function togglePlay() {
    if (!activeSong) return;
    if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        clearInterval(progressInterval);
        document.getElementById('globalPlayBtn').innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    } else {
        Tone.Transport.start();
        progressInterval = setInterval(() => {
            elapsedSeconds += 0.5;
            if(elapsedSeconds > 15) elapsedSeconds = 0;
            document.getElementById('progressFill').style.width = (elapsedSeconds / 15) * 100 + '%';
        }, 500);
        document.getElementById('globalPlayBtn').innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    }
    renderSongs();
}

document.getElementById('globalPlayBtn').addEventListener('click', togglePlay);
