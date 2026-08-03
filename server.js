const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt: Extrahiert die gesamte Seite strukturiert für KI-Training
app.post('/api/search-and-scrape', async (req, res) => {
    const { targetUrl } = req.body;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'Bitte eine URL eingeben.' });
    }

    // URL-Validierung
    let cleanUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
    }

    try {
        // HTML der Zielseite laden
        const response = await axios.get(cleanUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 10000 // 10 Sekunden Zeitlimit
        });
        
        const $ = cheerio.load(response.data);
        
        // Unwichtige Elemente entfernen, die das KI-Training verfälschen würden
        $('script, style, nav, footer, header, iframe, .navbox, .aside, ad').remove();

        const pageTitle = $('title').text().trim() || "Unbenannte Webseite";
        
        // Arrays für die strukturierte Aufbereitung
        let structuredContent = [];
        let plainTextBackup = "";

        // Wir durchlaufen alle relevanten Inhaltselemente chronologisch
        $('h1, h2, h3, h4, p, li').each((index, el) => {
            const tagName = el.tagName.toLowerCase();
            const textContent = $(el).text().replace(/\s+/g, ' ').trim();

            if (textContent.length > 5) {
                // Fügen jedes Element mit seinem HTML-Typ hinzu (wichtig für hierarchisches KI-Lernen)
                structuredContent.push({
                    type: tagName.startsWith('h') ? 'heading' : 'paragraph',
                    tag: tagName,
                    content: textContent
                });
                plainTextBackup += textContent + "\n";
            }
        });

        if (structuredContent.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Auf dieser Seite konnte kein lesbarer Textinhalt gefunden werden.' 
            });
        }

        // Das bereinigte, vollständige Paket an das Frontend senden
        res.json({
            success: true,
            title: pageTitle,
            url: cleanUrl,
            scrapedAt: new Date().toISOString(),
            elementsCount: structuredContent.length,
            totalCharacters: plainTextBackup.length,
            fullTextPlain: plainTextBackup,
            contentTree: structuredContent // Hier liegt die strukturierte Wissensbasis
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Die Webseite blockiert den Zugriff oder ist offline. Fehler: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft fehlerfrei auf Port ${PORT}`);
});
