const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname; 

app.use(express.static(ROOT_DIR));

// API-Endpunkt: Generiert eine physische MP3-Datei aus den vorhandenen Tracks
app.post('/api/generate-new-song', (req, res) => {
    try {
        // Finde alle MP3s im Ordner außer einem alten Remix
        const files = fs.readdirSync(ROOT_DIR).filter(file => 
            file.toLowerCase().endsWith('.mp3') && file !== 'ki-remix.mp3'
        );

        if (files.length === 0) {
            return res.status(400).json({ error: "Keine MP3-Dateien im Ordner gefunden!" });
        }

        const outputPath = path.join(ROOT_DIR, 'ki-remix.mp3');
        
        // Falls ein alter Remix existiert, löschen wir ihn für den neuen Track
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        // Erstelle den neuen beschreibbaren Datenstrom (Write-Stream)
        const outputStream = fs.createWriteStream(outputPath);

        // KI-Logik: Wir bauen einen Song aus 24 aufeinanderfolgenden Parts zusammen
        const totalSlices = 24; 
        
        // Ein MP3-Frame-Block (ca. 150.000 Bytes entsprechen grob 2-4 Sekunden Sound)
        const sliceSize = 150000; 

        for (let i = 0; i < totalSlices; i++) {
            // Wähle für jeden Part eine komplett zufällige MP3 aus dem Ordner
            const randomFile = files[Math.floor(Math.random() * files.length)];
            const filePath = path.join(ROOT_DIR, randomFile);
            
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;

            if (fileSize > sliceSize) {
                // Wähle einen zufälligen Startpunkt innerhalb der Datei
                const maxStart = fileSize - sliceSize;
                const randomStart = Math.floor(Math.random() * maxStart);

                // Lies exakt dieses Musik-Fragment synchron aus der Datei
                const buffer = Buffer.alloc(sliceSize);
                const fd = fs.openSync(filePath, 'r');
                fs.readSync(fd, buffer, 0, sliceSize, randomStart);
                fs.closeSync(fd);

                // Schreibe das Fragment direkt in den neuen Song
                outputStream.write(buffer);
            }
        }

        outputStream.end(() => {
            res.json({ success: true, filename: 'ki-remix.mp3' });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Fehler bei der Song-Generierung." });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
