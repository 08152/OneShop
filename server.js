const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer({ limits: { fileSize: 32 * 1024 * 1024 } }); // Max 32MB

app.use(cors());
app.use(express.json());

// Holt den API-Key aus den Render-Umgebungsvariablen
const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY;

// Route für die Startseite (index)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hochsicherheits-Sandbox & Virenscanner</title>
    <style>
        :root {
            --primary: #3498db;
            --success: #2ecc71;
            --danger: #e74c3c;
            --dark: #2c3e50;
            --light: #f8f9fa;
        }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #eef2f7; color: var(--dark); margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .card { width: 100%; max-width: 900px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); margin-bottom: 25px; box-sizing: border-box; }
        h1, h2 { margin-top: 0; color: #1a252f; }
        .dropzone { border: 3px dashed var(--primary); padding: 40px 20px; text-align: center; cursor: pointer; background: #f4f9fd; border-radius: 8px; font-weight: bold; transition: 0.2s; }
        .dropzone:hover { background: #e6f2fc; }
        .btn { background: var(--primary); color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; margin-top: 15px; }
        .status-box { margin-top: 20px; padding: 15px; border-radius: 6px; font-weight: bold; display: none; }
        .danger { background: #fadbd8; color: var(--danger); border: 1px solid var(--danger); }
        .success { background: #d4efdf; color: var(--success); border: 1px solid var(--success); }
        .info { background: #d6eaf8; color: var(--primary); border: 1px solid var(--primary); }
        .sandbox-wrapper { border: 2px solid #bdc3c7; border-radius: 8px; overflow: hidden; margin-top: 15px; background: white; }
        .sandbox-header { background: var(--dark); color: white; padding: 10px 15px; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; }
        .badge { background: var(--danger); padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        iframe { width: 100%; height: 450px; border: none; background: #fff; }
    </style>
</head>
<body>

    <div class="card">
        <h1>🛡️ Hochsicherheits-Virenscanner & Sandbox</h1>
        <p>Prüft Dateien serverseitig in der Cloud und führt sie zeitgleich in einer hermetisch isolierten Client-Sandbox aus.</p>
        
        <div class="dropzone" onclick="document.getElementById('fileInput').click()">
            <p>Datei hier ablegen oder klicken zum Hochladen</p>
            <input type="file" id="fileInput" style="display:none">
            <button class="btn">Datei auswählen</button>
        </div>

        <div id="scanStatus" class="status-box"></div>
    </div>

    <div class="card">
        <h2>🔒 Hermetisch isolierte Sandbox</h2>
        <p><strong>Sicherheitsstufe Maximal:</strong> Skripte dürfen für visuelle Tests laufen, haben jedoch absolutes Netzwerkverbot (kein Datenabfluss) und null Zugriff auf das Elternfenster, Cookies oder Speicherlaufwerke.</p>
        
        <div class="sandbox-wrapper">
            <div class="sandbox-header">
                <span>Isolierter iframe</span>
                <span class="badge" style="background:#e67e22;">Streng limitiert (No Same-Origin / CSP-Block)</span>
            </div>
            <!-- allow-same-origin WURDE ENTFERNT. Der Inhalt ist jetzt komplett vom Hauptfenster getrennt -->
            <iframe id="sandboxFrame" sandbox="allow-scripts"></iframe>
        </div>
    </div>

    <script>
        const fileInput = document.getElementById('fileInput');
        const scanStatus = document.getElementById('scanStatus');
        const sandboxFrame = document.getElementById('sandboxFrame');

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            scanStatus.style.display = 'block';
            scanStatus.className = 'status-box info';
            scanStatus.innerHTML = '⏳ Datei wird verarbeitet und gescannt... Bitte warten...';

            // 1. Sicheres Laden in die Sandbox mit Content Security Policy (CSP)
            const reader = new FileReader();
            reader.onload = (evt) => {
                let userContent = evt.target.result;
                
                // Wir injizieren eine ultra-strikte CSP ganz oben in den Code der Datei.
                // default-src 'none': Verbietet alle Verbindungen nach außen, Bilder-Nachladen, Ajax-Requests etc.
                // script-src 'unsafe-inline': Erlaubt nur den lokalen JS-Code der Datei, verbietet das Nachladen externer Viren-Skripte.
                const secureCsp = \`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">\`;
                
                // Setze CSP an den Anfang des hochgeladenen Codes
                const securedCode = secureCsp + userContent;

                const blob = new Blob([securedCode], { type: 'text/html' });
                sandboxFrame.src = URL.createObjectURL(blob);
            };
            reader.readAsText(file);

            // 2. Datei an das Backend senden
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/scan', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    if (data.verdict === 'GEFÄHRLICH') {
                        scanStatus.className = 'status-box danger';
                        scanStatus.innerHTML = '⚠️ BEDROHUNG GEFUNDEN! Erkennungen: ' + data.malicious + ' Antiviren-Engines schlagen Alarm.';
                    } else {
                        scanStatus.className = 'status-box success';
                        scanStatus.innerHTML = '✅ DATEI SAUBER! Der Echtzeit-Cloud-Scan meldet keine bekannten Bedrohungen.';
                    }
                } else {
                    scanStatus.className = 'status-box danger';
                    scanStatus.innerHTML = 'Fehler beim Scannen: ' + data.error;
                }
            } catch (err) {
                scanStatus.className = 'status-box danger';
                scanStatus.innerHTML = '⚠️ Verbindung zum Scan-Server fehlgeschlagen.';
            }
        });
    </script>
</body>
</html>
    `);
});

// Route für den echten Cloud-Virenscan via VirusTotal API
app.post('/api/scan', upload.single('file'), async (req, res) => {
    if (!VT_API_KEY) {
        return res.status(500).json({ error: "Server-Konfigurationsfehler: Kein API-Key auf Render hinterlegt." });
    }
    if (!req.file) {
        return res.status(400).json({ error: "Keine Datei übertragen." });
    }

    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: req.file.originalname });

        const uploadResponse = await axios.post('https://virustotal.com', formData, {
            headers: {
                ...formData.getHeaders(),
                'x-apikey': VT_API_KEY
            }
        });

        const analysisId = uploadResponse.data.data.id;

        // Kurze Pause für die cloudbasierte Analyse-Engine
        await new Promise(resolve => setTimeout(resolve, 3500));

        const resultResponse = await axios.get(`https://virustotal.com{analysisId}`, {
            headers: { 'x-apikey': VT_API_KEY }
        });

        const stats = resultResponse.data.data.attributes.stats;

        res.json({
            success: true,
            malicious: stats.malicious,
            verdict: stats.malicious > 0 ? "GEFÄHRLICH" : "SAUBER"
        });

    } catch (error) {
        console.error("Scan-Error:", error.message);
        res.status(500).json({ error: "Die Scan-Schnittstelle meldet ein Problem." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server gestartet auf Port ${PORT}`));
