const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Nutzt Axios statt der fehlerhaften Fetch-URL

const app = express();
const PORT = process.env.PORT || 3000;

// CORS-Sperren aufheben, damit deine HTML-Datei sicher kommunizieren kann
app.use(cors());
app.use(express.json());

// 1. Startseiten-Route: Liefert deine index.html an den Browser aus
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Diagnose-Test-Route: Direkt im Browser aufrufen unter ://onrender.com
app.get('/test', async (req, res) => {
    try {
        const response = await axios.get('https://wikipedia.org*', {
            headers: { 'User-Agent': 'KIBotAktivator/1.0 (mein-ki-projekt@example.com)' }
        });
        res.json({ status: "Erfolgreich! Der Server kann das Internet erreichen.", daten: response.data });
    } catch (error) {
        res.status(500).json({ status: "Fehler! Verbindung blockiert.", nachricht: error.message });
    }
});

// 3. Crawler-API: Holt die Daten ohne URL-Verkettungsfehler
app.get('/api/crawl', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff (q) angegeben.' });
    }

    try {
        // Konfiguration für den Wikipedia Bot-Schutz
        const config = {
            headers: { 'User-Agent': 'KIBotAktivator/1.0 (mein-ki-projekt@example.com)' }
        };

        const searchUrl = 'https://wikipedia.org';
        
        // Schritt A: Wikipedia nach passenden Artikeln durchsuchen
        const searchResponse = await axios.get(searchUrl, {
            ...config,
            params: {
                action: 'query',
                list: 'search',
                srsearch: query,
                format: 'json',
                origin: '*'
            }
        });
        
        const searchData = searchResponse.data;

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return res.json({ saetze: [] });
        }

        // Die Top 3 Suchergebnisse filtern
        const topResults = searchData.query.search.slice(0, 3);
        let gefundeneSaetze = [];

        // Schritt B: Die echten Volltexte strukturiert abrufen
        for (let result of topResults) {
            const contentResponse = await axios.get(searchUrl, {
                ...config,
                params: {
                    action: 'query',
                    prop: 'extracts',
                    exintro: true,
                    explaintext: true,
                    pageid: result.pageid,
                    format: 'json',
                    origin: '*'
                }
            });
            
            const contentData = contentResponse.data;
            
            if (contentData.query && contentData.query.pages && contentData.query.pages[result.pageid]) {
                const text = contentData.query.pages[result.pageid].extract;
                if (text) {
                    // Text in einzelne Sätze zerlegen und säubern
                    const saetze = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
                    gefundeneSaetze = gefundeneSaetze.concat(saetze);
                }
            }
        }

        // Die gesammelten Sätze als JSON zurück an deine HTML-Oberfläche senden
        res.json({ saetze: gefundeneSaetze });

    } catch (error) {
        console.error("Crawler Fehler im Backend:", error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Web-Daten im Backend: ' + error.message });
    }
});

// Server auf dem zugewiesenen Port starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
