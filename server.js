const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Neue Schlaf-Funktion: Zwingt den Node.js-Server zum Warten
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hilfsfunktion für offizielle API-Abrufe
function makeApiRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'KI-Trainingsdaten-Sammler-Bot/1.0 (https://render.com; kontakt-email@example.com)'
            },
            timeout: 8000
        };

        https.get(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (err) => { reject(err); });
    });
}

app.post('/api/search-and-scrape', async (req, res) => {
    try {
        const { targetUrl } = req.body;

        if (!targetUrl || targetUrl.trim() === "") {
            return res.status(400).json({ success: false, error: 'Keine URL empfangen.' });
        }

        // HIER WIRD GEBREMST: Der Server wartet jetzt vor JEDEM Wikipedia-Abruf exakt 3 Sekunden
        await sleep(3000);

        // Extrahiere den Artikelnamen korrekt aus der URL (Mit Index [1])
        const urlParts = targetUrl.trim().split('/wiki/');
        if (urlParts.length < 2) {
            return res.status(400).json({ success: false, error: 'Keine gültige deutsche Wikipedia-URL.' });
        }
        const articleTitle = urlParts[1]; // FIX: Index [1] hinzugefügt, um den reinen Namen zu greifen

        // Die offizielle Wikipedia-Text-API aufrufen
        const apiUrl = `https://wikipedia.org{articleTitle}&explaintext=1&format=json`;
        
        const apiResponse = await makeApiRequest(apiUrl);
        const parsedData = JSON.parse(apiResponse);
        
        const pages = parsedData.query.pages;
        const pageId = Object.keys(pages)[0]; // Holt die erste ID aus dem Objekt
        
        if (pageId === "-1") {
            return res.status(404).json({ success: false, error: 'Dieser Wikipedia-Artikel wurde nicht gefunden.' });
        }

        const rawFullText = pages[pageId].extract || "";
        const title = pages[pageId].title || "Wikipedia Artikel";

        if (!rawFullText.trim()) {
            return res.status(404).json({ success: false, error: 'Der Artikel war leer.' });
        }

        // Den unblockierten Text in saubere Absätze für deine KI zerlegen
        const textLines = rawFullText.split('\n');
        let structuredContent = [];
        let cleanPlainBackup = "";

        textLines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length > 25) {
                const isHeading = trimmed.startsWith('==') && trimmed.endsWith('==');
                structuredContent.push({
                    type: isHeading ? 'heading' : 'paragraph',
                    tag: isHeading ? 'h2' : 'p',
                    content: isHeading ? trimmed.replace(/==/g, '').trim() : trimmed
                });
                cleanPlainBackup += trimmed + "\n";
            }
        });

        return res.json({
            success: true,
            title: title,
            url: targetUrl,
            scrapedAt: new Date().toISOString(),
            elementsCount: structuredContent.length,
            totalCharacters: cleanPlainBackup.length,
            fullTextPlain: cleanPlainBackup,
            contentTree: structuredContent
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: `API-Fehler: ${error.message}` 
        });
    }
});

app.use((req, res) => { res.status(404).json({ success: false, error: "Route nicht gefunden." }); });
app.listen(PORT, () => { console.log(`API-Crawler mit 3s-Verzögerung läuft auf Port ${PORT}`); });
