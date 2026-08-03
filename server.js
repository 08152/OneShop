const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API-Endpunkt für die automatisierte Wikipedia-Suche
app.post('/api/search-and-scrape', async (req, res) => {
    let { targetUrl } = req.body;

    if (!targetUrl || targetUrl.trim() === "") {
        try {
            const randomApiUrl = 'https://wikipedia.org';
            const randomRes = await axios.get(randomApiUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const pageId = randomRes.data.query.random[0].id;
            targetUrl = `https://wikipedia.org{pageId}`;
        } catch (err) {
            return res.status(500).json({ success: false, error: 'Konnte keine zufällige Wikipedia-Seite abrufen.' });
        }
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, iframe, .navbox, .aside, ad').remove();

        const pageTitle = $('title').text().replace('- Wikipedia', '').trim() || "Unbenannte Webseite";
        let structuredContent = [];
        let plainTextBackup = "";

        $('h1, h2, h3, h4, p, li').each((index, el) => {
            const tagName = el.tagName.toLowerCase();
            const textContent = $(el).text().replace(/\s+/g, ' ').trim();

            if (textContent.length > 5) {
                structuredContent.push({
                    type: tagName.startsWith('h') ? 'heading' : 'paragraph',
                    tag: tagName,
                    content: textContent
                });
                plainTextBackup += textContent + "\n";
            }
        });

        if (structuredContent.length === 0) {
            return res.status(404).json({ success: false, error: 'Kein Inhalt lesbar.' });
        }

        res.json({
            success: true,
            title: pageTitle,
            url: targetUrl,
            scrapedAt: new Date().toISOString(),
            elementsCount: structuredContent.length,
            totalCharacters: plainTextBackup.length,
            fullTextPlain: plainTextBackup,
            contentTree: structuredContent
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft fehlerfrei auf Port ${PORT}`);
});
