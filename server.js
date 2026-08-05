const express = require('express');
const cors = require('cors');
const path = require('path'); // Neu: Für die korrekte Pfadfindung

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// NEU: Liefert deine index.html aus, wenn man die Startseite aufruft
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Der Crawler-Endpunkt bleibt unverändert
app.get('/api/crawl', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff (q) angegeben.' });
    }

    try {
        const searchUrl = `https://wikipedia.org{encodeURIComponent(query)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return res.status(404).json({ error: 'Keine passenden Texte im Internet gefunden.' });
        }

        const topResults = searchData.query.search.slice(0, 3);
        let gefundeneSaetze = [];

        for (let result of topResults) {
            const contentUrl = `https://wikipedia.org{result.pageid}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            const text = contentData.query.pages[result.pageid].extract;

            if (text) {
                const saetze = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
                gefundeneSaetze = gefundeneSaetze.concat(saetze);
            }
        }

        res.json({ saetze: gefundeneSaetze });

    } catch (error) {
        console.error("Crawler Fehler:", error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Web-Daten.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
