const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname; 

app.use(express.static(ROOT_DIR));

// Scannt den aktuellen Hauptordner nach MP3-Dateien
app.get('/api/available-tracks', (req, res) => {
    try {
        const files = fs.readdirSync(ROOT_DIR).filter(file => file.toLowerCase().endsWith('.mp3'));
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Ordner konnte nicht gelesen werden." });
    }
});

// Streamt robuste Audio-Slices für den KI-Remix
app.get('/api/stream-slice', (req, res) => {
    const { file, offset } = req.query;
    if (!file) return res.status(400).send("Keine Datei angegeben.");

    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) return res.status(404).send("Datei nicht gefunden.");

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Erhöhte Byte-Menge (ca. 192kbps MP3-Standard) für hörbare Slices
    const bytesPerSecond = 24000; 
    const startByte = Math.floor((parseFloat(offset) || 0) * bytesPerSecond);
    
    // Schneidet ein gut hörbares Fragment von ca. 1.2 Sekunden heraus
    const endByte = Math.min(startByte + 45000, fileSize - 1); 

    if (startByte >= fileSize) {
        return res.status(400).send("Offset außerhalb der Dateigröße.");
    }

    res.writeHead(200, {
        'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (endByte - startByte) + 1,
        'Content-Type': 'audio/mpeg'
    });

    const stream = fs.createReadStream(filePath, { start: startByte, end: endByte });
    stream.pipe(res);
});

app.listen(PORT, () => {
    console.log(`Server läuft erfolgreich auf Port ${PORT}`);
});
