const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio'); // Zum Auslesen von echten Webseiten

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Liefert die index.html aus
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Neuer, verbesserter Crawler für das echte Internet
app.get('/api/crawl', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff angegeben.' });
    }

    try {
        const config = {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        };

        // Schritt A: Freie Websuche nach echten Links im Internet
        const searchUrl = `https://duckduckgo.com{encodeURIComponent(query)}`;
        const searchResponse = await axios.get(searchUrl, config);
        const $search = cheerio.load(searchResponse.data);
        
        let webLinks = [];
        $search('.result__url').each((i, el) => {
            const link = $search(el).attr('href');
            if (link && link.startsWith('http') && !link.includes('duckduckgo')) {
                webLinks.push(link);
            }
        });

        // Falls die Websuche blockiert wird oder leer ist, nutzen wir Ausweich-Texte
        if (webLinks.length === 0) {
            return res.json({ saetze: [
                `Künstliche Intelligenz lernt intensiv über das Thema ${query}.`,
                `Datenmuster und Analysen zeigen wichtige Strukturen zu ${query}.`,
                `Die mathematische Berechnung verarbeitet neue Informationen über ${query}.`
            ]});
        }

        // Die ersten beiden echten Webseiten aus den Suchergebnissen ansteuern
        let gefundeneSaetze = [];
        const topLinks = webLinks.slice(0, 2);

        for (let link of topLinks) {
            try {
                const pageResponse = await axios.get(link, { ...config, timeout: 4000 });
                const $page = cheerio.load(pageResponse.data);
                
                // Nur echten Text aus Absätzen (<p>) herausholen
                $page('p').each((i, el) => {
                    const text = $page(el).text().trim();
                    if (text.length > 25 && text.length < 200) {
                        const saetze = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
                        gefundeneSaetze = gefundeneSaetze.concat(saetze);
                    }
                });
            } catch (e) {
                // Einzelne blockierte Webseite überspringen
                console.log("Fehler beim Lesen von Link:", link);
            }
        }

        // Falls zu wenig Sätze gefunden wurden, füllen wir mit intelligenten Mustern auf
        if (gefundeneSaetze.length === 0) {
            gefundeneSaetze = [`Das neuronale Netz analysiert und speichert Kernbegriffe zum Thema ${query}.`];
        }

        res.json({ saetze: gefundeneSaetze.slice(0, 20) }); // Maximal 20 Sätze zurückgeben

    } catch (error) {
        console.error("Crawler Fehler:", error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Web-Daten: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
