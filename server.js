const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt das Parsen von JSON und Formulardaten
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien (HTML) bereitstellen
app.use(express.static(path.join(__dirname)));

// Route für das Scraping/Suchen im Internet
app.post('/api/scrape', async (req, res) => {
    const { searchQuery } = req.body;
    
    if (!searchQuery) {
        return res.status(400).json({ error: 'Bitte einen Suchbegriff eingeben.' });
    }

    try {
        // Beispiel: Wir durchsuchen die Wikipedia-Suche nach dem Begriff
        const targetUrl = `https://wikipedia.org{encodeURIComponent(searchQuery)}`;
        
        // HTML der Webseite laden
        const { data } = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        // HTML mit Cheerio parsen (wie jQuery für Server)
        const $ = cheerio.load(data);
        
        // Daten extrahieren (Hier: Den ersten Absatz und alle H2-Überschriften)
        const pageTitle = $('#firstHeading').text().trim();
        const firstParagraph = $('p').first().text().trim();
        
        const subheadings = [];
        $('h2').each((index, element) => {
            const text = $(element).text().trim();
            if (text) subheadings.push(text);
        });

        // Daten an das Frontend zurückgeben
        res.json({
            success: true,
            sourceUrl: targetUrl,
            title: pageTitle,
            preview: firstParagraph || 'Keine Vorschau verfügbar.',
            headers: subheadings.slice(0, 5) // Die ersten 5 Unterüberschriften
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Seite nicht gefunden oder Zugriff verweigert.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
