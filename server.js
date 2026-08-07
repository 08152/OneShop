const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Stellt alle statischen Dateien (index.html, map-logic.js etc.) im aktuellen Ordner bereit
app.use(express.static(__dirname));

// Liefert die index.html aus, wenn die Hauptseite aufgerufen wird
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server starten
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Karten-Server erfolgreich gestartet!`);
    console.log(`📱 Lokal erreichbar unter: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
