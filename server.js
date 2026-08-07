const express = require('express');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 3000;

// Statische Dateien aus dem aktuellen Ordner ausliefern (index.html, script.js)
app.use(express.static(__dirname));

// API-Endpunkt für den Server-seitigen ZIP-Download des gesamten Quellcodes
app.get('/api/download-src', async (req, res) => {
    try {
        const zip = new JSZip();

        // Alle relevanten Projektdateien einlesen
        const filesToPack = ['index.html', 'script.js', 'server.js', 'package.json'];

        filesToPack.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                zip.file(file, fileContent);
            }
        });

        // ZIP-Archiv als Binär-Stream (Buffer) generieren
        const content = await zip.generateAsync({ type: 'nodebuffer' });

        // HTTP-Header für den Datei-Download setzen
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=live_gps_navigator_server_pack.zip');
        
        // ZIP-Datei an den Client senden
        res.send(content);
    } catch (error) {
        console.error('Fehler bei der ZIP-Erstellung:', error);
        res.status(500).send('Server-Fehler bei der ZIP-Generierung');
    }
});

// Fallback für alle anderen Routen (liefert die index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server läuft erfolgreich auf Port ${PORT}`);
});
