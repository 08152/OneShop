const express = require('express');
const path = require('path');
const app = express();

// Render stellt den Port dynamisch bereit, ansonsten nutzen wir 3000 lokal
const PORT = process.env.PORT || 3000;

// Bedient statische Dateien (index.html, script.js) im aktuellen Ordner
app.use(express.static(__dirname));

// Route für die Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WICHTIG: Auf 0.0.0.0 binden, damit Render die App von außen erreicht
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
