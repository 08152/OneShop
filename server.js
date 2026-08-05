import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { AutoTokenizer } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Render vergibt den Port dynamisch über Umgebungsvariablen
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

console.log("Lade vorinstallierten Tokenizer...");
const tokenizer = await AutoTokenizer.from_pretrained('Xenova/gpt2');
console.log("Tokenizer ist auf Render einsatzbereit!");

app.post('/api/tokenize-text', async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Kein Text empfangen.' });
    }

    try {
        const { input_ids } = await tokenizer(text);
        const tokenIds = Array.from(input_ids.data);
        const tokenStrings = tokenIds.map(id => tokenizer.model.vocab[id] || id);

        res.json({
            success: true,
            characterCount: text.length,
            tokenCount: tokenIds.length,
            previewText: text.substring(0, 600) + (text.length > 600 ? '...' : ''),
            tokens: tokenStrings.slice(0, 150),
            tokenIds: tokenIds.slice(0, 150)
        });
    } catch (error) {
        console.error("Fehler:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Wichtig: Auf 0.0.0.0 binden, damit Render die App von außen erreicht
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
