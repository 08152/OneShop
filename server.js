import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// URL deiner lokalen KI (z.B. ComfyUI oder Automatic1111)
const LOKALE_KI_URL = "http://127.0.0.1:8188"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

// Route für die lokale Generierung
app.post('/api/generate-video', async (req, res) => {
    try {
        const { timeline } = req.body;
        
        if (!timeline || timeline.length === 0) {
            return res.status(400).json({ error: "Keine Szenen-Daten vorhanden." });
        }

        console.log(`Sende ${timeline.length} Szenen an die lokale KI...`);

        const tasks = timeline.map(async (scene) => {
            // Wir bauen den Request für deine lokale KI (Beispiel: Text-to-Video / AnimateDiff)
            const lokaleKiPayload = {
                prompt: scene.ai_prompt,
                steps: 20,
                width: 512,
                height: 512,
                frames: 16, // Erzeugt ein kurzes lokales Video/GIF
                input_image_url: scene.source_url || null 
            };

            // Anfrage an deine lokale KI-Software auf deinem PC senden
            const response = await axios.post(`${LOKALE_KI_URL}/api/generate`, lokaleKiPayload).catch(e => {
                throw new Error("Lokale KI nicht erreichbar. Läuft ComfyUI/WebUI im Hintergrund?");
            });

            return {
                scene_number: scene.scene_number,
                generation_id: response.data.prompt_id || Math.random().toString(36).substring(7),
                status: "processing",
                prompt: scene.ai_prompt
            };
        });

        const results = await Promise.all(tasks);
        res.json({ success: true, message: "Lokale Generierung gestartet", tasks: results });

    } catch (error) {
        console.error("Fehler:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Status der lokalen KI abfragen
app.get('/api/generation-status/:id', async (req, res) => {
    try {
        // Fragt den aktuellen Stand der lokalen Grafikkarte ab
        const response = await axios.get(`${LOKALE_KI_URL}/history/${req.params.id}`).catch(() => null);
        
        if (response && response.data) {
            // Wenn fertig, liefert die lokale KI den Pfad zur lokalen Datei
            res.json({
                id: req.params.id,
                status: "completed",
                video_url: response.data.output_file_url // Pfad zum lokal generierten Video
            });
        } else {
            res.json({ id: req.params.id, status: "rendering", video_url: null });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server läuft offline auf http://localhost:${port}`);
});
