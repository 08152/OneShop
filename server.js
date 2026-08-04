const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt: Holt Daten garantiert und blockierungsfrei über die REST-API
app.post('/api/search-and-scrape', async (req, res) => {
    try {
        // 1. Schritt: Einen zufälligen Artikel über die moderne REST-API von Wikipedia anfordern
        // Diese API wird von Cloud-Servern nicht blockiert
        const randomApiUrl = 'https://wikipedia.org';
        
        const response = await fetch(randomApiUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Wenn die API mit HTML antwortet, fangen wir das hier sofort ab
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return res.status(500).json({ 
                success: false, 
                error: 'Wikipedia hat die Anfrage blockiert (HTML statt JSON gesendet).' 
            });
        }

        if (!response.ok) {
            return res.status(500).json({ success: false, error: `Wikipedia-Server meldet Status ${response.status}` });
        }

        const data = await response.json();
        
        const title = data.title || "Unbenannter Artikel";
        const pageUrl = data.content_urls?.desktop?.page || "https://wikipedia.org";
        const textContent = data.extract || "";

        if (!textContent.trim()) {
            return res.status(404).json({ success: false, error: 'Dieser Zufallsartikel war leer.' });
        }

        // 2. Schritt: Den Text in das gewohnte, strukturierte Format für deine KI zerlegen
        let structuredContent = [{
            type: 'paragraph',
            tag: 'p',
            content: textContent
        }];

        return res.json({
            success: true,
            title: title,
            url: pageUrl,
            scrapedAt: new Date().toISOString(),
            elementsCount: 1,
            totalCharacters: textContent.length,
            fullTextPlain: textContent + "\n",
            contentTree: structuredContent
        });

    } catch (error) {
        console.error("API-Fehler:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: `Verbindungsfehler: ${error.message}` 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route nicht gefunden." });
});

app.listen(PORT, () => {
    console.log(`Blockierungsfreier Server läuft auf Port ${PORT}`);
});
