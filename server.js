const express = require('express');
const cheerio = require('cheerio');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Schlaf-Funktion: Zwingt den Node.js-Server vor jeder Anfrage zum Warten (5 Sekunden Schutz)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hilfsfunktion: Führt einen direkten, sicheren HTTPS-Abruf aus
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 8000
        };

        https.get(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (err) => { reject(err); });
    });
}

// API-Endpunkt: Liest deine manuell eingegebene Wikipedia-URL direkt aus
app.post('/api/search-and-scrape', async (req, res) => {
    try {
        const { targetUrl } = req.body;

        if (!targetUrl || targetUrl.trim() === "") {
            return res.status(400).json({ success: false, error: 'Keine URL vom Frontend empfangen.' });
        }

        // HIER WIRD GEBREMST: Der Server wartet vor jedem Abruf exakt 5 Sekunden, damit Wikipedia uns liebt
        await sleep(5000);

        // Die eingegebene Wikipedia-Wunschseite direkt über HTTPS ansteuern
        const pageHtml = await makeRequest(targetUrl.trim());
        const $page = cheerio.load(pageHtml);
        
        // Wikipedia-Layout-Müll entfernen, damit nur das reine KI-Wissen übrig bleibt
        $page('script, style, nav, footer, header, iframe, .navbox, .aside, ad, noscript, link, style, .mw-jump-link, .printfooter, #mw-panel, #head').remove();

        const pageTitle = $page('title').text().replace('- Wikipedia', '').trim() || "Wikipedia Artikel";
        let structuredContent = [];
        let cleanPlainBackup = "";

        // Alle Textabsätze und Zwischenüberschriften sammeln
        $page('p, li, h1, h2, h3').each((index, el) => {
            const tagName = el.tagName.toLowerCase();
            const textContent = $page(el).text().replace(/\s+/g, ' ').trim();

            if (textContent.length > 30) { // Filtert leere oder irrelevante Fragmente heraus
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

        // Sauberes Datenpaket an dein Frontend zurückgeben
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
            error: `Fehler beim Auslesen dieser Wikipedia-Seite: ${error.message}` 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route nicht gefunden." });
});

app.listen(PORT, () => {
    console.log(`Direkter Wikipedia-Crawler läuft auf Port ${PORT}`);
});
