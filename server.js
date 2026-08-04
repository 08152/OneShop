const express = require('express');
const cheerio = require('cheerio');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Eine breite Liste mit zufälligen Begriffen für die Wikipedia-Suche
const randomKeywords = [
    "Technologie", "Zukunft", "Wissenschaft", "Universum", "Philosophie", 
    "Geschichte", "Informatik", "Roboter", "Klimawandel", "Erde", 
    "Medizin", "Biologie", "Quantenphysik", "Astronomie", "Archäologie",
    "Psychologie", "Kultur", "Kunst", "Ozean", "Evolution", "Energie",
    "Quantencomputer", "Neurologie", "Weltall", "Menschheit", "Zivilisation"
];

// Hilfsfunktion: Führt einen HTTPS-Request mit nativem Node.js aus (absturzsicher)
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 6000
        };

        https.get(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

app.post('/api/search-and-scrape', async (req, res) => {
    try {
        const randomWord = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
        
        // Zwingt DuckDuckGo, NUR nach Wikipedia-Links zu suchen
        const searchQuery = `site:de.wikipedia.org ${randomWord}`;
        const ddgUrl = `https://duckduckgo.com{encodeURIComponent(searchQuery)}`;
        
        // 1. DuckDuckGo HTML aufrufen
        const searchHtml = await makeRequest(ddgUrl);
        const $search = cheerio.load(searchHtml);
        
        let foundLinks = [];
        $search('.result__url').each((i, el) => {
            let link = $search(el).attr('href');
            if (link) {
                if (link.includes('uddg=')) {
                    const parts = link.split('uddg=');
                    if (parts.length > 1) {
                        const actualLink = parts[1].split('&');
                        link = decodeURIComponent(actualLink[0]);
                    }
                }
                if (link.startsWith('http') && link.includes('de.wikipedia.org/wiki/')) {
                    foundLinks.push(link);
                }
            }
        });

        // Fallback: Falls DDG fehlschlägt, generieren wir direkt eine echte Wikipedia-Zufalls-URL via ID
        if (foundLinks.length === 0) {
            const fallbackId = Math.floor(Math.random() * 5000000);
            foundLinks.push(`https://wikipedia.org{fallbackId}`);
        }

        const targetUrl = foundLinks[Math.floor(Math.random() * foundLinks.length)];

        // 2. Die gefundene Wikipedia-Webseite im Hintergrund auslesen
        const pageHtml = await makeRequest(targetUrl);
        const $page = cheerio.load(pageHtml);
        
        // Wikipedia-Layout-Müll entfernen
        $page('script, style, nav, footer, header, iframe, .navbox, .aside, ad, noscript, link, style, .mw-jump-link, .printfooter, #mw-panel, #head').remove();

        const pageTitle = $page('title').text().replace('- Wikipedia', '').trim() || "Wikipedia Artikel";
        let structuredContent = [];
        let cleanPlainBackup = "";

        // Alle Textabsätze und Überschriften sammeln
        $page('p, li, h1, h2, h3').each((index, el) => {
            const tagName = el.tagName.toLowerCase();
            const textContent = $page(el).text().replace(/\s+/g, ' ').trim();

            if (textContent.length > 30) {
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
            return res.status(404).json({ success: false, error: 'Die Wikipedia-Seite enthielt keinen lesbaren Text.' });
        }

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
            error: `Fehler beim Wikipedia-Surfen: ${error.message}` 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route nicht gefunden." });
});

// WICHTIG: Hält den Server dauerhaft online
app.listen(PORT, () => {
    console.log(`Wikipedia-DuckDuckGo-Crawler läuft auf Port ${PORT}`);
});
