import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.post('/api/tokenize-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Keine URL empfangen.' });
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe, noscript, header').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!cleanText || cleanText.length < 5) {
            throw new Error('Kein brauchbarer Text gefunden.');
        }

        // Mathematische Schätzung statt externer Bibliothek (Komplett kostenlos & fehlerfrei)
        const estimatedTokenCount = Math.round(cleanText.length / 4);

        // Erstelle eine einfache Wort-Vorschau für das Frontend
        const previewWords = cleanText.split(' ').slice(0, 100);

        res.json({
            success: true,
            url: url,
            characterCount: cleanText.length,
            tokenCount: estimatedTokenCount,
            text: cleanText,
            previewTokens: previewWords
        });

    } catch (error) {
        console.error(`Fehler bei ${url}:`, error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Wichtig für Render: Bindung an 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft code-neutral auf Port ${PORT}`);
});
