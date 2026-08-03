const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt für das gezielte Durchsuchen einer bestimmten Seite nach einem Thema
app.post('/api/search-and-scrape', async (req, res) => {
    const { targetUrl, theme } = req.body;
    
    if (!targetUrl || !theme) {
        return res.status(400).json({ error: 'Bitte eine URL und ein Thema eingeben.' });
    }

    // Sicherstellen, dass die URL mit http:// oder https:// beginnt
    let cleanUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
    }

    try {
        // Die vom Nutzer eingegebene Seite abrufen (mit Browser-Kennung)
        const response = await axios.get(cleanUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });
        
        const $ = cheerio.load(response.data);
        
        // Unwichtige Layout-Elemente entfernen
        $('script, style, nav, footer, header, iframe, .navbox').remove();

        const pageTitle = $('title').text().trim() || "Eingegebene Webseite";
        let filteredText = "";
        let totalParagraphsChecked = 0;
        let matchingParagraphsFound = 0;

        // Alle Textabsätze durchsuchen
        $('p, li, h1, h2, h3').each((index, el) => {
            const txt = $(el).text().trim();
            if (txt.length > 10) {
                totalParagraphsChecked++;
                
                // Prüfen, ob das eingegebene Thema im Textabschnitt vorkommt (Groß-/Kleinschreibung ignorieren)
                const regex = new RegExp(theme.trim(), 'i');
                if (regex.test(txt)) {
                    filteredText += txt + "\n\n";
                    matchingParagraphsFound++;
                }
            }
        });

        if (!filteredText.trim()) {
            return res.status(404).json({ 
                success: false, 
                error: `Das Thema "${theme}" wurde auf dieser Webseite nicht im Text gefunden.` 
            });
        }

        // Ergebnis zurückgeben
        res.json({
            success: true,
            title: pageTitle,
            url: cleanUrl,
            theme: theme,
            text: filteredText,
            stats: {
                checked: totalParagraphsChecked,
                found: matchingParagraphsFound
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Die Webseite konnte nicht geladen werden. Details: ${error.message}` 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft fehlerfrei auf Port ${PORT}`);
});
