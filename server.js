const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt: Holt Daten garantiert und blockierungsfrei über die offizielle Wikipedia-API
app.post('/api/search-and-scrape', async (req, res) => {
    try {
        let title = "";
        let pageId = "";

        // 1. Schritt: Eine zufällige Seite über die offizielle API anfordern
        const randomApiUrl = 'https://wikipedia.org';
        const randomRes = await axios.get(randomApiUrl, {
            headers: { 'User-Agent': 'DatasetEnhancerBot/1.0 (deine-email@example.com)' }
        });
        
        if (randomRes.data && randomRes.data.query && randomRes.data.query.random) {
            title = randomRes.data.query.random[0].title;
            pageId = randomRes.data.query.random[0].id;
        } else {
            return res.status(500).json({ success: false, error: 'Zufallsartikel-API antwortete fehlerhaft.' });
        }

        // 2. Schritt: Den Volltext der Seite sauber und unblockiert über die Text-Extracts-API laden
        const contentApiUrl = `https://wikipedia.org{pageId}&explaintext=1&format=json`;
        const contentRes = await axios.get(contentApiUrl, {
            headers: { 'User-Agent': 'DatasetEnhancerBot/1.0 (deine-email@example.com)' }
        });

        const pages = contentRes.data.query.pages;
        const pageData = pages[pageId];
        const rawFullText = pageData.extract || "";

        if (!rawFullText.trim()) {
            return res.status(404).json({ success: false, error: 'Der Artikel enthielt keinen Text.' });
        }

        // 3. Schritt: Den Text in ein strukturiertes Format zerlegen (wichtig für deine KI)
        const textLines = rawFullText.split('\n');
        let structuredContent = [];
        let cleanPlainBackup = "";

        textLines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length > 5) {
                // Wikipedia kennzeichnet Überschriften im Reintext mit "== Überschrift =="
                const isHeading = trimmed.startsWith('==') && trimmed.endsWith('==');
                
                structuredContent.push({
                    type: isHeading ? 'heading' : 'paragraph',
                    tag: isHeading ? 'h2' : 'p',
                    content: isHeading ? trimmed.replace(/==/g, '').trim() : trimmed
                });
                
                cleanPlainBackup += trimmed + "\n";
            }
        });

        // Erfolgreiche Antwort an deine index.html / script.js senden
        res.json({
            success: true,
            title: title,
            url: `https://wikipedia.org{pageId}`,
            scrapedAt: new Date().toISOString(),
            elementsCount: structuredContent.length,
            totalCharacters: cleanPlainBackup.length,
            fullTextPlain: cleanPlainBackup,
            contentTree: structuredContent
        });

    } catch (error) {
        console.error("API-Fehler:", error.message);
        res.status(500).json({ 
            success: false, 
            error: `Wikipedia-Schnittstelle blockiert nicht, aber meldet: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Blockierungsfreier Server läuft auf Port ${PORT}`);
});
