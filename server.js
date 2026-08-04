const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt für die automatisierte Wikipedia-Suche
app.post('/api/search-and-scrape', async (req, res) => {
    try {
        let title = "";
        let pageId = "";

        // 1. Schritt: Eine zufällige Seite über die offizielle API anfordern
        const randomApiUrl = 'https://wikipedia.org';
        
        const randomRes = await fetch(randomApiUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (!randomRes.ok) {
            return res.status(500).json({ success: false, error: `Wikipedia Random-API antwortete mit Status ${randomRes.status}` });
        }

        const randomData = await randomRes.json();
        
        if (randomData && randomData.query && randomData.query.random && randomData.query.random[0]) {
            title = randomData.query.random[0].title;
            pageId = randomData.query.random[0].id;
        } else {
            return res.status(500).json({ success: false, error: 'Zufallsartikel-API lieferte unerwartete Struktur.' });
        }

        // 2. Schritt: Den Volltext der Seite über die Text-Extracts-API laden
        const contentApiUrl = `https://wikipedia.org{pageId}&explaintext=1&format=json`;
        
        const contentRes = await fetch(contentApiUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (!contentRes.ok) {
            return res.status(500).json({ success: false, error: `Wikipedia Content-API antwortete mit Status ${contentRes.status}` });
        }

        const contentData = await contentRes.json();

        const pages = contentData.query.pages;
        const pageData = pages[pageId];
        const rawFullText = pageData.extract || "";

        if (!rawFullText.trim()) {
            return res.status(404).json({ success: false, error: 'Der Artikel enthielt keinen lesbaren Text.' });
        }

        // 3. Schritt: Den Text in ein strukturiertes Format zerlegen
        const textLines = rawFullText.split('\n');
        let structuredContent = [];
        let cleanPlainBackup = "";

        textLines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length > 5) {
                const isHeading = trimmed.startsWith('==') && trimmed.endsWith('==');
                
                structuredContent.push({
                    type: isHeading ? 'heading' : 'paragraph',
                    tag: isHeading ? 'h2' : 'p',
                    content: isHeading ? trimmed.replace(/==/g, '').trim() : trimmed
                });
                
                cleanPlainBackup += trimmed + "\n";
            }
        });

        // WICHTIG: Sende garantiert sauberes JSON zurück
        return res.json({
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
        // Fallback: Wenn der Server abstürzt, fangen wir das ab und senden JSON statt HTML-Fehler
        return res.status(500).json({ 
            success: false, 
            error: `Interner Serverfehler abgefangen: ${error.message}` 
        });
    }
});

// Fängt falsche Routen ab, damit Render niemals HTML-Fehler sendet
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route nicht gefunden." });
});

app.listen(PORT, () => {
    console.log(`Absturzsicherer Server läuft auf Port ${PORT}`);
});
