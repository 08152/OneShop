const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const MUSIC_DIR = path.join(__dirname, 'musik');

if (!fs.existsSync(MUSIC_DIR)){
    fs.mkdirSync(MUSIC_DIR);
}

app.use(express.static(__dirname));
app.use('/tracks', express.static(MUSIC_DIR));

// Endpunkt, der der KI sagt, welche MP3s zur Verfügung stehen
app.get('/api/available-tracks', (req, res) => {
    const files = fs.readdirSync(MUSIC_DIR).filter(file => file.endsWith('.mp3'));
    res.json(files);
});

app.listen(PORT, () => {
    console.log(`Audio-Slicer KI läuft auf http://localhost:${PORT}`);
    console.log(`Bitte lege MP3-Dateien in den Ordner: ${MUSIC_DIR}`);
});
