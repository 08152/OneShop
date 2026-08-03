const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Endpunkt: Sucht im Netz nach Begriffen und liest die gefundenen Links aus
app.post('/api/search-and-scrape', async (req, res) => {
    const { searchQuery } = req.body;
    
    if (!searchQuery) {
        return res.status(400).json({ error: 'Bitte einen Suchbegriff eingeben.' });
    }

    try {
        // 1. Kostenlose Suche über die Wikipedia-API, um relevante Links zu finden
        const searchUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}&limit=3&namespace=0&format=json`;
        const searchResponse = await axios.get(searchUrl);
        
        // Die API liefert ein Array zurück. Index 1 sind die Titel, Index 3 die direkten Links
        const foundTitles = searchResponse.data[1] || [];
        const foundLinks = searchResponse.data[3] || [];

        if (foundLinks.length === 0) {
            return res.status(404).json({ success: false, error: 'Keine passenden Links im Internet gefunden.' });
        }

        let combinedTrainingText = "";
        let sourcesUsed = [];

        // 2. Die gefundenen Links nacheinander durchsuchen und Text extrahieren
        for (let i = 0; i < foundLinks.length; i++) {
            try {
                const pageResponse = await axios.get(foundLinks[i], {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                
                const $ = cheerio.load(pageResponse.data);
                // Unwichtige Elemente entfernen
                $('script, style, nav, footer, header, .mw-jump-link').remove();

                let pageText = "";
                $('p').each((index, el) => {
                    pageText += $(el).text().trim() + "\n";
                });

                if (pageText.trim().length > 100) {
                    combinedTrainingText += `--- QUELLE: ${foundTitles[i]} ---\n` + pageText + "\n\n";
                    sourcesUsed.push({ title: foundTitles[i], url: foundLinks[i] });
                }
            } catch (e) {
                // Falls ein einzelner Link blockiert, überspringen wir ihn einfach
                continue;
            }
        }

        if (!combinedTrainingText.trim()) {
            return res.status(500).json({ success: false, error: 'Inhalte konnten nicht ausgelesen werden.' });
        }

        // Ergebnis zurückgeben (Der Text darf sehr lang werden)
        res.json({
            success: true,
            searchTerm: searchQuery,
            sources: sourcesUsed,
            preview: combinedTrainingText.substring(0, 400) + "...", 
            text: combinedTrainingText // Kompletter Trainings-Datensatz
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Fehler bei der Suche im Internet.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
