const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Liefert die index.html aus, wenn die Hauptseite aufgerufen wird
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Startet den Server
app.listen(PORT, () => {
    console.log(`Server läuft unter: http://localhost:${PORT}`);
});
