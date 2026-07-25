const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // Limit: 10MB

app.use(cors());
app.use(express.json());

// Startseite mit integriertem Norton 360 Premium-Design
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Norton 360 - Smart Scan & Isolation Sandbox</title>
    <style>
        :root {
            --norton-yellow: #ffcc00;
            --norton-dark: #1a1a1a;
            --norton-gray: #2d2d2d;
            --norton-light-gray: #3d3d3d;
            --norton-text: #ffffff;
            --norton-text-muted: #aaaaaa;
            --success-green: #2ecc71;
            --danger-red: #e74c3c;
        }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: var(--norton-dark); 
            color: var(--norton-text); 
            margin: 0; 
            padding: 40px 20px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
        }

        .norton-window {
            width: 100%;
            max-width: 750px;
            background: var(--norton-gray);
            border-radius: 6px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6);
            border: 1px solid var(--norton-light-gray);
            overflow: hidden;
        }

        .norton-header {
            background: #111;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            border-bottom: 1px solid var(--norton-light-gray);
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .norton-brand {
            color: var(--norton-yellow);
            margin-right: 8px;
        }

        .norton-body {
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        /* Der geforderte Status-Kreis im Norton Design */
        .status-circle-container {
            position: relative;
            margin-bottom: 35px;
        }

        .status-circle {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            border: 6px solid var(--norton-yellow);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(255, 204, 0, 0.03);
            transition: all 0.4s ease;
            box-shadow: 0 0 20px rgba(255, 204, 0, 0.1);
        }

        .status-circle.is-safe {
            border-color: var(--success-green);
            background: rgba(46, 204, 113, 0.03);
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.1);
        }

        .status-circle.is-danger {
            border-color: var(--danger-red);
            background: rgba(231, 76, 60, 0.03);
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.1);
        }

        .status-title {
            font-size: 12px;
            text-transform: uppercase;
            color: var(--norton-text-muted);
            letter-spacing: 1px;
            font-weight: bold;
        }

        .status-value {
            font-size: 22px;
            font-weight: bold;
            margin-top: 4px;
        }

        /* Drag & Drop Zone */
        .dropzone { 
            width: 100%;
            max-width: 550px;
            border: 2px dashed var(--norton-light-gray); 
            padding: 50px 30px; 
            text-align: center; 
            cursor: pointer; 
            background: #242424; 
            border-radius: 8px; 
            transition: all 0.3s;
            box-sizing: border-box;
        }
        
        .dropzone:hover, .dropzone.dragover { 
            border-color: var(--norton-yellow);
            background: #2a2a2a;
        }

        .dropzone p {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #ddd;
        }

        .btn { 
            background: var(--norton-yellow); 
            color: #000; 
            border: none; 
            padding: 10px 24px; 
            font-size: 14px; 
            font-weight: bold;
            border-radius: 4px; 
            cursor: pointer; 
            transition: background 0.2s;
        }
        
        .btn:hover { 
            background: #ffe066; 
        }

        .findings-list {
            width: 100%;
            max-width: 550px;
            text-align: left;
            margin-top: 25px;
            background: #242424;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid var(--danger-red);
            display: none;
        }

        .findings-list h4 {
            margin: 0 0 10px 0;
            color: var(--danger-red);
        }

        .findings-list ul {
            margin: 0;
            padding-left: 20px;
            color: #ccc;
            font-size: 14px;
            line-height: 1.5;
        }

        /* Die Sandbox läuft versteckt im Hintergrund */
        #hiddenSandbox {
            display: none;
        }
    </style>
</head>
<body>

    <div class="norton-window">
        <div class="norton-header">
            <span class="norton-brand">✓ norton</span> 360 Premium
        </div>
        
        <div class="norton-body">
            <!-- Risiko-Stufe im gelben Norton-Kreis -->
            <div class="status-circle-container">
                <div id="statusCircle" class="status-circle">
                    <span class="status-title">Risiko-Stufe</span>
                    <span id="statusValue" class="status-value">BEREIT</span>
                </div>
            </div>
            
            <!-- Drag & Drop / Upload Bereich -->
            <div id="dropzone" class="dropzone">
                <p>Datei hierher ziehen (Drag & Drop) oder klicken zum Scannen</p>
                <input type="file" id="fileInput" style="display:none">
                <button class="btn" onclick="document.getElementById('fileInput').click(); event.stopPropagation();">Datei auswählen</button>
            </div>

            <!-- Detaillierte Befunde bei Funden -->
            <div id="findingsCard" class="findings-list">
                <h4>Bedrohungsdetails:</h4>
                <ul id="findingsUl"></ul>
            </div>
        </div>
    </div>

    <!-- UNSICHTBARE SANDBOX: Führt Code isoliert im Hintergrund aus -->
    <iframe id="hiddenSandbox" sandbox="allow-scripts"></iframe>

    <script>
        const fileInput = document.getElementById('fileInput');
        const dropzone = document.getElementById('dropzone');
        const statusCircle = document.getElementById('statusCircle');
        const statusValue = document.getElementById('statusValue');
        const findingsCard = document.getElementById('findingsCard');
        const findingsUl = document.getElementById('findingsUl');
        const hiddenSandbox = document.getElementById('hiddenSandbox');

        // Drag & Drop Event-Handler
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                fileInput.files = files;
                processAndScanFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                processAndScanFile(e.target.files[0]);
            }
        });

        // Zentrale Verarbeitungs- und Scan-Logik
        async function processAndScanFile(file) {
            // Kreis-Status zurücksetzen auf Analyse
            statusCircle.className = 'status-circle';
            statusValue.innerHTML = 'PRÜFEN...';
            statusValue.style.color = 'var(--norton-yellow)';
            findingsCard.style.display = 'none';

            // 1. Verstecktes Laden in die Hintergrund-Sandbox mit CSP (Absolut Sicher)
            const reader = new FileReader();
            reader.onload = (evt) => {
                const userContent = evt.target.result;
                const secureCsp = \`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:;">\`;
                const securedCode = secureCsp + userContent;

                const blob = new Blob([securedCode], { type: 'text/html' });
                hiddenSandbox.src = URL.createObjectURL(blob);
            };
            reader.readAsText(file);

            // 2. Datei an das lokale Heuristik-Backend senden
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
                        // Norton-Kreis wird ROT bei Bedrohung
                        statusCircle.classList.add('is-danger');
                        statusValue.innerHTML = 'GEFAHR';
                        statusValue.style.color = 'var(--danger-red)';
// Befunde auflisten
findingsUl.innerHTML = data.findings.map(f => `${f}`).join('');
findingsCard.style.display = 'block';
} else {
// Norton-Kreis wird GRÜN, wenn sauber
statusCircle.classList.add('is-safe');
statusValue.innerHTML = 'SICHER';
statusValue.style.color = 'var(--success-green)';
}
} else {
statusValue.innerHTML = 'FEHLER';
alert('Fehler bei der Analyse: ' + data.error);
}
} catch (err) {
statusValue.innerHTML = 'OFFLINE';
alert('Verbindung zum Server fehlgeschlagen.');
}
}



`);
});

// Lokale, kostenlose Signatur- und Heuristik-Prüfung
app.post('/api/scan', upload.single('file'), (req, res) => {
if (!req.file) {
return res.status(400).json({ error: "Keine Datei übertragen." });
}

try {
const fileContent = req.file.buffer.toString('utf-8');
const findings = [];

const rules = [
{ pattern: /eval\s*(/i, desc: "Dynamische Code-Ausführung (eval) entdeckt." },
{ pattern: /document.write\s*(/i, desc: "Potenzielle DOM-Injection (document.write)." },
{ pattern: /<script[\s\S]?src=["']http://.?["']/i, desc: "Laden von unverschlüsseltem externen Code (HTTP)." },
{ pattern: /unescape\s*(\s*["']%u/i, desc: "Verschleierungsmuster (Shellcode/Unescape) erkannt." },
{ pattern: /crypto-miner|coinhive|monero/i, desc: "Krypto-Mining Aktivitäten im Code gefunden." },
{ pattern: /atob\s*(\s*["'][A-Za-z0-9+/={}]/i, desc: "Base64-kodierter, versteckter Programmcode (atob)." },
{ pattern: /String.fromCharCode/i, desc: "Verdächtige Zeichenketten-Generierung zur AV-Umgehung." },
{ pattern: /location.replace\s*(|window.location\s*=/i, desc: "Automatisierte Phishing-Weiterleitung." }
];

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
app.listen(PORT, () => console.log(Norton-Style Server gestartet auf Port ${PORT}));

