const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS erlauben, damit Daten fließen können
app.use(cors());
app.use(express.json());

// Liefert deine index.html auf der Startseite (/) aus
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Der korrigierte API-Endpunkt mit zwingend erforderlichem User-Agent für Wikipedia
app.get('/api/crawl', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff (q) angegeben.' });
    }

    try {
        // WICHTIG: Wikipedia verlangt seit Node-Updates einen eindeutigen User-Agent-Header, um Scraper nicht zu sperren
        const fetchOptions = {
            headers: {
                'User-Agent': 'KIBotAktivator/1.0 (mein-ki-projekt@example.com) Node.js-Fetch'
            }
        };

        // Schritt A: Wikipedia nach passenden Artikeln durchsuchen
        const searchUrl = `https://wikipedia.org{encodeURIComponent(query)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl, fetchOptions);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return res.json({ saetze: [] }); // Keine Ergebnisse gefunden
        }

        // Die Top 3 Artikel-Ergebnisse heraussuchen
        const topResults = searchData.query.search.slice(0, 3);
        let gefundeneSaetze = [];

        // Schritt B: Die echten Volltexte der Artikel abrufen
        for (let result of topResults) {
            const contentUrl = `https://wikipedia.org{result.pageid}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl, fetchOptions);
            const contentData = await contentResponse.json();
            
            if (contentData.query && contentData.query.pages && contentData.query.pages[result.pageid]) {
                const text = contentData.query.pages[result.pageid].extract;
                if (text) {
                    // Text säubern und in Sätze aufteilen
                    const saetze = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
                    gefundeneSaetze = gefundeneSaetze.concat(saetze);
                }
            }
        }

        // Die fertigen Texte an deine HTML-Datei schicken
        res.json({ saetze: gefundeneSaetze });

    } catch (error) {
        console.error("Crawler Fehler im Backend:", error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Web-Daten im Backend.' });
    }
});

// Server auf dem Port von Render (oder lokal 3000) starten
app.listen(PORT, () => {
    console.log(`Server läuft erfolgreich auf Port ${PORT}`);
});
