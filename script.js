let masterTrainingDataset = {
    crawlerVersion: "6.0-Final-Fix",
    generiertAm: new Date().toISOString(),
    metriken: { seitenAnzahl: 0, elementeAnzahl: 0, zeichenAnzahl: 0, woerterAnzahl: 0 },
    erfassteWebseiten: []
};

const log = document.getElementById('statusLog');
const downloadBtn = document.getElementById('downloadBtn');
const btnAutopilot = document.getElementById('btnAutopilot');

let autopilotTimer = null;
let isAutopilotRunning = false;
const SCRAPE_INTERVAL = 3000; // Alle 3 Sekunden eine neue Seite holen

// Robuster Wortzähler
function countWords(text) {
    if (!text) return 0;
    const cleanText = text.toString().trim().replace(/\s+/g, ' ');
    if (cleanText === "") return 0;
    return cleanText.split(' ').length;
}

// UI AKTUALISIEREN (Zeigt alle 3 Werte an)
function updateUI() {
    document.getElementById('statPages').innerText = masterTrainingDataset.metriken.seitenAnzahl;
    document.getElementById('statChars').innerText = masterTrainingDataset.metriken.zeichenAnzahl.toLocaleString();
    document.getElementById('statWords').innerText = masterTrainingDataset.metriken.woerterAnzahl.toLocaleString();
    
    let sourcesDiv = document.getElementById('sourcesUsed');
    if (masterTrainingDataset.erfassteWebseiten.length > 0) {
        sourcesDiv.innerHTML = "<ol>";
        masterTrainingDataset.erfassteWebseiten.forEach(site => {
            const displayTitle = site.titel || site.seite || "Gelernte Seite";
            sourcesDiv.innerHTML += `<li><a href="${site.url}" target="_blank" style="color: #38bdf8; font-weight: bold;">${displayTitle}</a></li>`;
        });
        sourcesDiv.innerHTML += "</ol>";
        downloadBtn.style.display = "block";
    } else {
        sourcesDiv.innerHTML = "Noch keine Daten im Speicher.";
        downloadBtn.style.display = "none";
    }
}

// STEUERUNG
btnAutopilot.addEventListener('click', () => {
    if (isAutopilotRunning) { stopAutopilot(); } else { startAutopilot(); }
});

function startAutopilot() {
    isAutopilotRunning = true;
    btnAutopilot.innerText = "🛑 AUTOMATIK STOPPEN";
    btnAutopilot.style.backgroundColor = "#dc2626";
    log.innerHTML += `<br>> 🤖 Autopilot gestartet...`;
    log.scrollTop = log.scrollHeight;
    triggerAutomaticScrape();
    autopilotTimer = setInterval(triggerAutomaticScrape, SCRAPE_INTERVAL);
}

function stopAutopilot() {
    isAutopilotRunning = false;
    clearInterval(autopilotTimer);
    btnAutopilot.innerText = "▶️ AUTOPILOT STARTEN";
    btnAutopilot.style.backgroundColor = "#2563eb";
    log.innerHTML += `<br>> ⏸️ Autopilot gestoppt.`;
    log.scrollTop = log.scrollHeight;
}

// CRAWLER SCHLEIFE
async function triggerAutomaticScrape() {
    try {
        const response = await fetch('/api/search-and-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: "" })
        });
        const data = await response.json();
        
        if (data.success) {
            // Holt sich den Text, egal wie die Server-Variable heißt
            const textContent = data.fullTextPlain || data.text || "";
            const newWords = countWords(textContent);

            masterTrainingDataset.erfassteWebseiten.push({
                titel: data.title,
                url: data.url,
                reinText: textContent,
                strukturierterInhalt: data.contentTree || []
            });

            // Metriken erhöhen
            masterTrainingDataset.metriken.seitenAnzahl += 1;
            masterTrainingDataset.metriken.zeichenAnzahl += (data.totalCharacters || textContent.length);
            masterTrainingDataset.metriken.woerterAnzahl += newWords;

            updateUI();
            log.innerHTML += `<br>> [NEU GELERNT] "${data.title}" (+${newWords.toLocaleString()} Wörter).`;
        } else {
            log.innerHTML += `<br>> ⚠️ Fehler übersprungen: ${data.error}`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ Verbindungsfehler zum Render-Server.`;
    }
    log.scrollTop = log.scrollHeight;
}

// LOGIK FÜR DEN DATEI-UPLOAD
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (isAutopilotRunning) stopAutopilot();

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            
            // Flexibler Import für alle alten JSON-Dateien
            let importedPages = parsedJson.erfassteWebseiten || parsedJson.datenSaetze || [];
            
            masterTrainingDataset.erfassteWebseiten = importedPages.map(d => ({
                titel: d.titel || d.seite || d.suchbegriff || "Importierte Seite",
                url: d.url || (d.quellen ? d.quellen.url : "#"),
                reinText: d.reinText || d.rohText || d.text || ""
            }));

            // Wörter aus der hochgeladenen Datei neu berechnen
            let totalWords = 0;
            let totalChars = 0;
            masterTrainingDataset.erfassteWebseiten.forEach(site => {
                totalWords += countWords(site.reinText);
                totalChars += site.reinText.length;
            });

            masterTrainingDataset.metriken.seitenAnzahl = masterTrainingDataset.erfassteWebseiten.length;
            masterTrainingDataset.metriken.zeichenAnzahl = totalChars;
            masterTrainingDataset.metriken.woerterAnzahl = totalWords;

            updateUI();
            document.getElementById('uploadText').innerText = `✅ Geladen: ${file.name}`;
            log.innerHTML += `<br>> [UPLOAD] Erfogreich! ${masterTrainingDataset.metriken.woerterAnzahl.toLocaleString()} Wörter eingelesen. Klicke auf START zum Erweitern.`;
        } catch (err) {
            alert("Fehler beim Lesen der JSON-Datei.");
        }
        log.scrollTop = log.scrollHeight;
    };
    reader.readAsText(file);
});

// DOWNLOAD AUSFÜHREN
downloadBtn.addEventListener('click', () => {
    if (masterTrainingDataset.erfassteWebseiten.length === 0) return;
    if (isAutopilotRunning) stopAutopilot();

    const jsonString = JSON.stringify(masterTrainingDataset, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `bessere_trainingsdaten_${Date.now()}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(blobUrl);
    
    log.innerHTML += `<br>> ✓ Download gestartet!`;
    log.scrollTop = log.scrollHeight;
});
