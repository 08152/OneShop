const express = require('express');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

const app = express();
const PORT = 3000;
const MUSIC_DIR = path.join(__dirname, 'musik');

// Erstelle den Musik-Ordner, falls er nicht existiert
if (!fs.existsSync(MUSIC_DIR)){
    fs.mkdirSync(MUSIC_DIR);
}

app.use(express.static(__dirname));
app.use('/tracks', express.static(MUSIC_DIR));

// Funktion zum Scannen und Analysieren aller MP3-Dateien
async function scanAudioDatabase() {
    const files = fs.readdirSync(MUSIC_DIR).filter(file => file.endsWith('.mp3'));
    const database = [];

    for (const file of files) {
        const filePath = path.join(MUSIC_DIR, file);
        try {
            const metadata = await mm.parseFile(filePath);
            database.push({
                filename: file,
                title: metadata.common.title || file,
                artist: metadata.common.artist || 'Unbekannt',
                genre: metadata.common.genre?.[0] || 'Standard',
                duration: metadata.format.duration
            });
        } catch (err) {
            console.error(`Fehler beim Lesen von ${file}:`, err.message);
        }
    }
    return database;
}

// API-Endpunkt für die "KI"-Generierung (Markov-Ketten-Logik)
app.get('/api/generate-playlist', async (req, res) => {
    const songs = await scanAudioDatabase();
    
    if (songs.length === 0) {
        return res.json({ error: "Keine MP3-Dateien im Ordner 'musik' gefunden!" });
    }

    // Einfache KI-Logik: Wähle zufälligen Startsong, finde ähnliche Genres/Rhythmen
    let playlist = [];
    let currentSong = songs[Math.floor(Math.random() * songs.length)];
    playlist.push(currentSong);

    for (let i = 0; i < 4; i++) {
        // Suche nach Songs mit ähnlichem Genre
        const matches = songs.filter(s => s.genre === currentSong.genre && s.filename !== currentSong.filename);
        
        if (matches.length > 0) {
            currentSong = matches[Math.floor(Math.random() * matches.length)];
        } else {
            // Fallback auf komplett zufälligen Song
            currentSong = songs[Math.floor(Math.random() * songs.length)];
        }
        playlist.push(currentSong);
    }

    res.json(playlist);
});

app.listen(PORT, () => {
    console.log(`Musik-KI läuft auf http://localhost:${PORT}`);
    console.log(`Lege deine MP3-Dateien in den Ordner: ${MUSIC_DIR}`);
});
