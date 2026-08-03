const express = require('express');
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

        // 1. Schritt: Eine zufällige Seite über die offizielle API anfordern (mit echtem User-Agent)
        const randomApiUrl = 'https://wikipedia.org';
        
        const randomRes = await fetch(randomApiUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        const randomData = await randomRes.json();
        
        if (randomData && randomData.query && randomData.query.random && randomData.query.random[0]) {
            title = randomData.query.random[0].title;
            pageId = randomData.query.random[0].id;
        } else {
            return res.status(500).json({ success: false, error: 'Zufallsartikel-API blockiert oder Antwort ungültig.' });
        }

        // 2. Schritt: Den Volltext der Seite sauber über die Text-Extracts-API laden
        const contentApiUrl = `https://wikipedia.org{pageId}&explaintext=1&format=json`;
        
        const contentRes = await fetch(contentApiUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        const contentData = await contentRes.json();

        const pages = contentData.query.pages;
        const pageData = pages[pageId];
        const rawFullText = pageData.extract || "";

        if (!rawFullText.trim()) {
            return res.status(404).json({ success: false, error: 'Der Artikel enthielt keinen Text.' });
        }

        // 3. Schritt: Den Text in ein strukturiertes Format zerlegen (für deine KI)
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

        // Erfolgreiche Antwort an das Frontend senden
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
            error: `Verbindung fehlgeschlagen: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Blockierungsfreier Server läuft auf Port ${PORT}`);
});
