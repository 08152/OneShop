const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // Limit: 10MB

app.use(cors());
app.use(express.json());

// Startseite mit integriertem Frontend
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kostenlose Lokale Sandbox & Heuristik-Scanner</title>
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
        .badge { background: #e67e22; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: white; }
        iframe { width: 100%; height: 450px; border: none; background: #fff; }
        ul { margin: 5px 0 0 20px; padding: 0; }
    </style>
</head>
<body>

    <div class="card">
        <h1>🛡️ Lokaler Heuristik-Scanner & Sandbox</h1>
        <p><strong>100% Kostenlos:</strong> Analysiert Dateien direkt auf dem Server nach schädlichen Mustern und führt sie isoliert aus. Keine Registrierung oder API erforderlich.</p>
        
        <div class="dropzone" onclick="document.getElementById('fileInput').click()">
            <p>Datei hier ablegen oder klicken zum Hochladen</p>
            <input type="file" id="fileInput" style="display:none">
            <button class="btn">Datei auswählen</button>
        </div>

        <div id="scanStatus" class="status-box"></div>
    </div>

    <div class="card">
        <h2>🔒 Hermetisch isolierte Sandbox</h2>
        <p>Skripte dürfen visuell ausgeführt werden, jegliche Netzwerkverbindungen nach außen oder Zugriffe auf Browser-Cookies sind jedoch unmöglich.</p>
        
        <div class="sandbox-wrapper">
            <div class="sandbox-header">
                <span>Isolierter iframe</span>
                <span class="badge">Netzwerk & Origin Blockiert</span>
            </div>
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
            scanStatus.innerHTML = '⏳ Lokale Heuristik-Analyse läuft...';

            // 1. Sicheres Laden in die Sandbox mit Content Security Policy (Sperrt Netzwerkabfluss)
            const reader = new FileReader();
            reader.onload = (evt) => {
                const userContent = evt.target.result;
                const secureCsp = \`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:;">\`;
                const securedCode = secureCsp + userContent;

                const blob = new Blob([securedCode], { type: 'text/html' });
                sandboxFrame.src = URL.createObjectURL(blob);
            };
            reader.readAsText(file);

            // 2. Datei an das kostenlose lokale Backend senden
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
                        let html = '⚠️ <strong>BEDROHUNG GEFUNDEN!</strong> Folgende verdächtige Muster wurden entdeckt:';
                        html += '<ul>' + data.findings.map(f => '<li>' + f + '</li>').join('') + '</ul>';
                        scanStatus.innerHTML = html;
                    } else {
                        scanStatus.className = 'status-box success';
                        scanStatus.innerHTML = '✅ DATEI SAUBER! Keine bekannten schädlichen Heuristik-Muster im Code gefunden.';
                    }
                } else {
                    scanStatus.className = 'status-box danger';
                    scanStatus.innerHTML = 'Fehler bei der lokalen Analyse: ' + data.error;
                }
            } catch (err) {
                scanStatus.className = 'status-box danger';
                scanStatus.innerHTML = '⚠️ Verbindung zum lokalen Analyse-Server fehlgeschlagen.';
            }
        });
    </script>
</body>
</html>
    `);
});

// Route für die kostenlose, lokale Signatur- und Heuristik-Prüfung
app.post('/api/scan', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Keine Datei übertragen." });
    }

    try {
        const fileContent = req.file.buffer.toString('utf-8');
        const findings = [];

        // Lokale Heuristik-Regeln (Erkennt bösartige Absichten in Skripten/HTML)
        const rules = [
            { pattern: /eval\s*\(/i, desc: "Dynamische Code-Ausführung (eval) – Häufig genutzt zur Code-Verschleierung." },
            { pattern: /document\.write\s*\(/i, desc: "Potenzielle DOM-Injection (document.write)." },
            { pattern: /<script[\s\S]*?src=["']http:\/\/.*?["']/i, desc: "Laden von unverschlüsseltem, externen Code via HTTP." },
            { pattern: /unescape\s*\(\s*["']%u/i, desc: "Verschleierungsmuster (Shellcode/Unescape) entdeckt." },
            { pattern: /crypto-miner|coinhive|monero/i, desc: "Unerlaubtes Krypto-Mining Skript im Code vorhanden." },
            { pattern: /atob\s*\(\s*["'][A-Za-z0-9+/={}]/i, desc: "Base64-kodierter, versteckter Programmcode (atob)." },
            { pattern: /String\.fromCharCode/i, desc: "Verdächtige Zeichenketten-Generierung zur AV-Umgehung." },
            { pattern: /location\.replace\s*\(|window\.location\s*=/i, desc: "Automatisierte Weiterleitung (Phishing-Gefahr)." }
        ];

        // Code gegen alle Regeln prüfen
        rules.forEach(rule => {
            if (rule.pattern.test(fileContent)) {
                findings.push(rule.desc);
            }
        });

        res.json({
            success: true,
            findings: findings,
            verdict: findings.length > 0 ? "GEFÄHRLICH" : "SAUBER"
        });

    } catch (error) {
        res.status(500).json({ error: "Fehler beim Lesen der Datei auf dem Server." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Kostenloser Server gestartet auf Port ${PORT}`));
