import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { encode, decode } from 'gpt-tokenizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// API-Endpunkt
app.post('/api/tokenize-text', (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Kein Text empfangen.' });
    }

    try {
        // 1. Text direkt in Token-IDs umwandeln
        const tokenIds = encode(text);
        
        // 2. Die IDs wieder in die einzelnen Text-Fragmente zerlegen
        const tokenStrings = tokenIds.map(id => decode([id]));

        res.json({
            success: true,
            characterCount: text.length,
            tokenCount: tokenIds.length,
            previewText: text.substring(0, 600) + (text.length > 600 ? '...' : ''),
            tokens: tokenStrings.slice(0, 150), // Erste 150 Fragmente zur Ansicht
            tokenIds: tokenIds.slice(0, 150)
        });
    } catch (error) {
        console.error("Fehler:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
