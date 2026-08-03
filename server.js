const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt für die Internetsuche und das Auslesen (Scraping)
app.post('/api/search-and-scrape', async (req, res) => {
    const { searchQuery } = req.body;
    
    if (!searchQuery) {
        return res.status(400).json({ error: 'Bitte einen Suchbegriff eingeben.' });
    }

    try {
        // Suchanfrage an die freie Wikipedia-API senden (inklusive Browser-Kennung)
        const searchUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&limit=5&namespace=0&format=json`;
        
        const searchResponse = await axios.get(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const foundTitles = searchResponse.data[1] || [];
        const foundLinks = searchResponse.data[3] || [];

        if (!foundLinks || foundLinks.length === 0) {
            return res.status(404).json({ success: false, error: 'Keine passenden Seiten im Internet gefunden.' });
        }

        let combinedTrainingText = "";
        let sourcesUsed = [];

        // Die gefundenen Links nacheinander abrufen
        for (let i = 0; i < foundLinks.length; i++) {
            try {
                const pageResponse = await axios.get(foundLinks[i], {
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 5000
                });
                
                const $ = cheerio.load(pageResponse.data);
                
                // Unwichtige Elemente entfernen
                $('script, style, nav, footer, header, iframe, .mw-jump-link, .navbox').remove();

                let pageText = "";
                $('p').each((index, el) => {
                    const txt = $(el).text().trim();
                    if (txt.length > 20) {
                        pageText += txt + "\n";
                    }
                });

                if (pageText.trim().length > 100) {
                    combinedTrainingText += `\n--- QUELLE: ${foundTitles[i]} ---\n` + pageText + "\n";
                    sourcesUsed.push({ title: foundTitles[i], url: foundLinks[i] });
                }
            } catch (e) {
                // Ein fehlerhafter Link wird übersprungen
                continue;
            }
        }

        if (!combinedTrainingText.trim()) {
            return res.status(500).json({ success: false, error: 'Zugriff auf Textinhalte wurde verweigert.' });
        }

        res.json({
            success: true,
            searchTerm: searchQuery,
            sources: sourcesUsed,
            text: combinedTrainingText
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Internetsuche fehlgeschlagen: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft fehlerfrei auf Port ${PORT}`);
});
