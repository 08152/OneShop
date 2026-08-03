const express = require('express');
const path = require('path');
const app = express();

// Nutze den von Render zugewiesenen Port oder standardmäßig 3000 lokal
const PORT = process.env.PORT || 3000;

// Statische Dateien ausliefern (script.js, CSS, etc.)
app.use(express.static(__dirname));

// Die Hauptroute liefert die index.html (Erstellen)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// AUTOMATISCHE ROUTE FÜR ALLE HTML-SEITEN
// Wenn du /start aufrufst, sucht der Server automatisch nach start.html
app.get('/:page', (req, res) => {
    const pageName = req.params.page;
    const filePath = path.join(__dirname, `${pageName}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            // Falls die Datei nicht existiert (z.B. Tippfehler), leite zur Startseite um
            res.status(404).redirect('/');
        }
    });
});

// Auf 0.0.0.0 binden – extrem wichtig für das Deployment auf Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
