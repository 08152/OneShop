const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Bedient statische Dateien im aktuellen Ordner
app.use(express.static(__dirname));

// Route für die Hauptseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
