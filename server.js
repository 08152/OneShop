import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { encode, decode } from 'gpt-tokenizer';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// API-Endpunkt zum Scrapen und Tokenisieren einer URL
app.post('/api/tokenize-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Keine URL empfangen.' });
    }

    try {
        // 1. Webseite abrufen
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(10000) // 10 Sekunden Timeout
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden (Status: ${response.status})`);
        }

        const html = await response.text();

        // 2. HTML säubern
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe, noscript, header').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!cleanText || cleanText.length < 5) {
            throw new Error('Kein brauchbarer Text auf der Webseite gefunden.');
        }

        // 3. Tokenisieren (Rein mathematisch im RAM)
        const tokenIds = encode(cleanText);
        const tokenStrings = tokenIds.slice(0, 100).map(id => decode([id])); // Nur erste 100 für die Vorschau mitschicken

        res.json({
            success: true,
            url: url,
            characterCount: cleanText.length,
            tokenCount: tokenIds.length,
            text: cleanText,
            previewTokens: tokenStrings
        });

    } catch (error) {
        console.error(`Fehler bei ${url}:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
