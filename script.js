<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KI-Volltext-Crawler (Modular)</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 950px; margin: 30px auto; padding: 20px; background-color: #0f172a; color: #f8fafc; }
        .box { background: #1e293b; padding: 25px; margin-bottom: 25px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        h1 { color: #38bdf8; margin-top: 0; }
        h3 { color: #f1f5f9; margin-bottom: 10px; }
        .input-row { display: flex; gap: 15px; margin-bottom: 15px; }
        input[type="text"] { flex: 4; padding: 14px; font-size: 16px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: #fff; box-sizing: border-box; }
        input[type="text"]:focus { border-color: #38bdf8; outline: none; }
        .btn-action { flex: 1; padding: 14px; font-size: 16px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .btn-action:hover { background-color: #0369a1; }
        .upload-area { border: 2px dashed #475569; padding: 20px; text-align: center; border-radius: 6px; background: #0f172a; cursor: pointer; transition: 0.2s; }
        .upload-area:hover { border-color: #38bdf8; background: #111e36; }
        #fileInput { display: none; }
        .btn-download { background-color: #16a34a; width: 100%; font-size: 18px; padding: 16px; margin-top: 20px; display: none; text-transform: uppercase; letter-spacing: 1px; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; }
        .btn-download:hover { background-color: #15803d; }
        #statusLog { height: 150px; overflow-y: auto; background: #0f172a; border: 1px solid #334155; padding: 15px; font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #34d399; border-radius: 6px; }
        .stats { display: flex; gap: 20px; margin-top: 15px; }
        .stat-card { background: #334155; padding: 15px 20px; border-radius: 6px; flex: 1; text-align: center; }
        .stat-card span { display: block; font-size: 26px; font-weight: bold; color: #38bdf8; margin-top: 5px; }
        .source-list { max-height: 180px; overflow-y: auto; padding-left: 20px; color: #cbd5e1; }
        .source-list li { margin-bottom: 6px; font-size: 14px; }
    </style>
</head>
<body>

    <!-- JSON hochladen -->
    <div class="box">
        <h1>📂 Vorhandenes Dataset hochladen</h1>
        <p>Wähle eine alte `.json`-Datei aus, die du mit diesem Tool erstellt hast, um neue Webseiten hinzuzufügen:</p>
        <div class="upload-area" onclick="document.getElementById('fileInput').click()">
            <span id="uploadText">📁 Klicke hier, um deine JSON-Datei auszuwählen</span>
            <input type="file" id="fileInput" accept=".json">
        </div>
    </div>

    <!-- Webseiten scrapen -->
    <div class="box">
        <h1>📦 KI-Volltext-Crawler (Deep Scrape)</h1>
        <p>Gib eine URL ein, um die Seite vollständig auszulesen und an das Dataset anzuhängen.</p>
        
        <form id="crawlerForm">
            <div class="input-row">
                <input type="text" id="targetUrl" placeholder="https://wikipedia.org" required>
                <button type="submit" class="btn-action">Aussaugen</button>
            </div>
        </form>
    </div>

    <!-- Live-Zähler -->
    <div class="box">
        <h3>📊 Zustand deines KI-Datensatzes</h3>
        <div class="stats">
            <div class="stat-card">Seiten im Datensatz <span id="statPages">0</span></div>
            <div class="stat-card">Gesamt-Textelemente <span id="statElements">0</span></div>
            <div class="stat-card">Gesamt-Zeichenanzahl <span id="statChars">0</span></div>
        </div>
        <h4 style="margin-top: 20px; margin-bottom: 5px;">Integrierte Webseiten:</h4>
        <div id="sourcesUsed" class="source-list">Noch keine Daten im Speicher.</div>
    </div>

    <!-- Log -->
    <div class="box">
        <h3>📜 System-Log-Protokoll</h3>
        <div id="statusLog">> System hochgefahren. Bereit...</div>
    </div>

    <div class="box" style="text-align: center;">
        <button id="downloadBtn" class="btn-download">📥 GESAMTEN DATENSATZ ALS JSON DOWNLOADEN</button>
    </div>

    <!-- Verknüpfung der Logik-Datei -->
    <script src="script.js"></script>
</body>
</html>
