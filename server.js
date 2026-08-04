const express = require('express');
const cheerio = require('cheerio');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Erhöhte Payload-Limits, um Fehler beim Upload großer JSON-Datensätze zu vermeiden
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// Schlaf-Funktion: Zwingt den Node.js-Server vor jeder Anfrage zum Warten (JETZT 12 SEKUNDEN SCHUTZ)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hilfsfunktion: Führt einen direkten, sicheren HTTPS-Abruf aus
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                // Ein realistischerer User-Agent verhindert, dass Wikipedia die Anfrage als Bot blockiert
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
                // FIX FÜR FEHLER 426: Signalisiert dem Server die Bereitschaft für moderne Web-Protokolle (HTTP/1.1 oder höher mit TLS)
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000 // Timeout auf 10 Sekunden erhöht
        };

        https.get(options, (res) => {
            // Falls Wikipedia ein Redirect schickt (z. B. von http auf https), fangen wir es ab
            if (res.statusCode === 301 || res.statusCode === 302) {
                return makeRequest(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode} (${res.statusMessage})`));
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

        // HIER WIRD GEBREMST: Der Server wartet vor jedem Abruf exakt 12 Sekunden gegen Fehler 426
        await sleep(12000);

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
    console.log(`Direkter Wikipedia-Crawler läuft auf Port ${PORT} (12s Delay aktiv)`);
});
