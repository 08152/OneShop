const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt deiner HTML-Datei, sicher mit dem Server zu kommunizieren
app.use(cors());
app.use(express.json());

// Endpunkt für die Text-Suche
app.get('/api/crawl', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff (q) angegeben.' });
    }

    try {
        // Schritt A: Wikipedia nach passenden Artikeln durchsuchen
        const searchUrl = `https://wikipedia.org{encodeURIComponent(query)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return res.status(404).json({ error: 'Keine passenden Texte im Internet gefunden.' });
        }

        // Die Top 3 Artikel-Ergebnisse nehmen
        const topResults = searchData.query.search.slice(0, 3);
        let gefundeneSaetze = [];

        // Schritt B: Die echten Volltexte der Artikel abrufen
        for (let result of topResults) {
            const contentUrl = `https://wikipedia.org{result.pageid}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            const text = contentData.query.pages[result.pageid].extract;

            if (text) {
                // Text in Sätze zerlegen und säubern
                const saetze = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
                gefundeneSaetze = gefundeneSaetze.concat(saetze);
            }
        }

        // Sätze als sauberes JSON-Array an die HTML-Datei zurückgeben
        res.json({ saetze: gefundeneSaetze });

    } catch (error) {
        console.error("Crawler Fehler:", error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Web-Daten.' });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
