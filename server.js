const express = require('express');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Eine breite Liste mit zufälligen Begriffen, um die Suchmaschine zu füttern
const randomKeywords = [
    "Technologie", "Zukunft", "Wissenschaft", "Universum", "Philosophie", 
    "Geschichte", "Informatik", "Roboter", "Klimawandel", "Erde", 
    "Medizin", "Biologie", "Quantenphysik", "Astronomie", "Archäologie",
    "Psychologie", "Kultur", "Kunst", "Ozean", "Evolution", "Energie",
    "Quantencomputer", "Neurologie", "Weltall", "Menschheit", "Zivilisation"
];

// API-Endpunkt: Durchsucht das Netz blitzschnell via DuckDuckGo HTML
app.post('/api/search-and-scrape', async (req, res) => {
    try {
        // 1. Ein zufälliges Suchwort auswählen
        const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
        
        // 2. DuckDuckGo HTML-Version aufrufen (Wird von Render nicht blockiert)
        const ddgUrl = `https://duckduckgo.com{encodeURIComponent(randomWord)}`;
        
        const searchResponse = await fetch(ddgUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!searchResponse.ok) {
            return res.status(500).json({ success: false, error: `DuckDuckGo reagiert nicht (Status ${searchResponse.status})` });
        }

        const searchHtml = await searchResponse.text();
        const $search = cheerio.load(searchHtml);
        
        // Die echten Suchergebnisse herausfiltern
        let foundLinks = [];
        $search('.result__url').each((i, el) => {
            let link = $search(el).attr('href');
            if (link) {
                // DuckDuckGo-Weiterleitungs-URLs sauber extrahieren und decodieren
                if (link.includes('uddg=')) {
                    const parts = link.split('uddg=');
                    if (parts.length > 1) {
                        const actualLink = parts[1].split('&');
                        link = decodeURIComponent(actualLink[0]);
                    }
                }
                // Keine Werbelinks oder DuckDuckGo-eigenen Links mitnehmen
                if (link.startsWith('http') && !link.includes('duckduckgo.com')) {
                    foundLinks.push(link);
                }
            }
        });

        if (foundLinks.length === 0) {
            return res.status(404).json({ success: false, error: 'Keine passenden Links bei DuckDuckGo gefunden.' });
        }

        // Einen zufälligen Link aus den Suchergebnissen auswählen
        const targetUrl = foundLinks[Math.floor(Math.random() * foundLinks.length)];

        // 3. Die ausgewählte Webseite im Hintergrund aufrufen
        const pageResponse = await fetch(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000) // Nach 5 Sekunden abbrechen, falls eine Seite trödelt
        });

        if (!pageResponse.ok) {
            return res.status(500).json({ success: false, error: `Zielseite verweigert Zugriff (Status ${pageResponse.status})` });
        }

        const pageHtml = await pageResponse.text();
        const $page = cheerio.load(pageHtml);
        
        // Unwichtige Elemente radikal löschen für sauberen Text
        $page('script, style, nav, footer, header, iframe, .navbox, .aside, ad, noscript, link, style').remove();

        const pageTitle = $page('title').text().trim() || "Zufällige Internetseite";
        let structuredContent = [];
        let cleanPlainBackup = "";

        // Alle Textabsätze und Überschriften sammeln
        $page('p, li, h1, h2, h3').each((index, el) => {
            const tagName = el.tagName.toLowerCase();
            const textContent = $page(el).text().replace(/\s+/g, ' ').trim();

            if (textContent.length > 25) { // Nur Abschnitte mit echtem Inhalt mitnehmen
                const isHeading = tagName.startsWith('h');
                structuredContent.push({
                    type: isHeading ? 'heading' : 'paragraph',
                    tag: tagName,
                    content: textContent
                });
                cleanPlainBackup += textContent + "\n";
            }
        });

        if (!cleanPlainBackup.trim()) {
            return res.status(404).json({ success: false, error: 'Die ausgewählte Seite enthielt keinen lesbaren Text.' });
        }

        // Datenpaket sauber strukturiert ans Frontend schicken
        return res.json({
            success: true,
            title: pageTitle,
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
            error: `Fehler beim rasanten Websurfen: ${error.message}` 
        });
    }
});

// Fängt falsche Routen ab, damit niemals HTML-Fehler ausgegeben werden
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route nicht gefunden." });
});

app.listen(PORT, () => {
    console.log(`Pfeilschneller DuckDuckGo-Crawler läuft auf Port ${PORT}`);
});
