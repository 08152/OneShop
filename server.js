let masterTrainingDataset = {
    crawlerVersion: "5.5-DatasetEnhancer-WordCount",
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

// Hilfsfunktion: Zählt die Wörter in einem Textbaum oder Fließtext
function countWords(text) {
    if (!text) return 0;
    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (cleanText === "") return 0;
    return cleanText.split(' ').length;
}

// UI AKTUALISIEREN
function updateUI() {
    document.getElementById('statPages').innerText = masterTrainingDataset.metriken.seitenAnzahl;
    document.getElementById('statChars').innerText = masterTrainingDataset.metriken.zeichenAnzahl.toLocaleString();
    
    // Live-Anzeige der gelernten Wörter
    document.getElementById('statWords').innerText = masterTrainingDataset.metriken.woerterAnzahl.toLocaleString();
    
    let sourcesDiv = document.getElementById('sourcesUsed');
    if (masterTrainingDataset.erfassteWebseiten.length > 0) {
        sourcesDiv.innerHTML = "<ol>";
        masterTrainingDataset.erfassteWebseiten.forEach(site => {
            const displayTitle = site.titel || site.seite || "Importierte Seite";
            sourcesDiv.innerHTML += `<li><a href="${site.url}" target="_blank" style="color: #38bdf8; font-weight: bold;">${displayTitle}</a></li>`;
        });
        sourcesDiv.innerHTML += "</ol>";
        downloadBtn.style.display = "block";
    } else {
        sourcesDiv.innerHTML = "Noch keine Daten im Speicher.";
        downloadBtn.style.display = "none";
    }
}

// STEUERUNG: START / STOPP BUTTON
btnAutopilot.addEventListener('click', () => {
    if (isAutopilotRunning) {
        stopAutopilot();
    } else {
        startAutopilot();
    }
});

function startAutopilot() {
    isAutopilotRunning = true;
    btnAutopilot.innerText = "🛑 AUTOMATIK STOPPEN";
    btnAutopilot.style.backgroundColor = "#dc2626";
    
    log.innerHTML += `<br>> 🤖 Autopilot gestartet... Durchsuche Internet...`;
    log.scrollTop = log.scrollHeight;
    
    triggerAutomaticScrape();
    autopilotTimer = setInterval(() => {
        triggerAutomaticScrape();
    }, SCRAPE_INTERVAL);
}

function stopAutopilot() {
    isAutopilotRunning = false;
    clearInterval(autopilotTimer);
    btnAutopilot.innerText = "▶️ AUTOPILOT FORTSETZEN";
    btnAutopilot.style.backgroundColor = "#2563eb";
    log.innerHTML += `<br>> ⏸️ Autopilot angehalten. Datensatz im Speicher gesichert.`;
    log.scrollTop = log.scrollHeight;
}

// CRAWLER AUSFÜHREN
async function triggerAutomaticScrape() {
    try {
        const response = await fetch('/api/search-and-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: "" })
        });
        const data = await response.json();
        
        if (data.success) {
            masterTrainingDataset.erfassteWebseiten.push({
                titel: data.title,
                url: data.url,
                erfassungsZeit: data.scrapedAt,
                strukturierterInhalt: data.contentTree,
                reinText: data.fullTextPlain
            });

            // Wörter im neuen Text zählen
            const newWords = countWords(data.fullTextPlain);

            // Metriken erhöhen
            masterTrainingDataset.metriken.seitenAnzahl += 1;
            masterTrainingDataset.metriken.zeichenAnzahl += data.totalCharacters;
            masterTrainingDataset.metriken.woerterAnzahl += newWords;
            masterTrainingDataset.metriken.elementeAnzahl += data.elementsCount;

            updateUI();
            log.innerHTML += `<br>> [NEU GELERNT] "${data.title}" (+${newWords.toLocaleString()} Wörter).`;
        } else {
            log.innerHTML += `<br>> ⚠️ [Autopilot] Fehler übersprungen: ${data.error}`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ [Autopilot] Keine Verbindung zum Server.`;
    }
    log.scrollTop = log.scrollHeight;
}

// LOGIK FÜR DEN DATEI-UPLOAD (BERECHNET DIE WÖRTER AUS DEINER ALTEN DATEI)
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files;
    if (!file) return;

    if (isAutopilotRunning) stopAutopilot();

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            
            if (parsedJson.metriken || parsedJson.datenSaetze || parsedJson.erfassteWebseiten) {
                
                // Konvertierung falls altes Format hochgeladen wird
                if (parsedJson.datenSaetze && !parsedJson.erfassteWebseiten) {
                    masterTrainingDataset.erfassteWebseiten = parsedJson.datenSaetze.map(d => ({
                        titel: d.suchbegriff || "Importierte Seite",
                        url: d.quellen ? d.quellen?.url : d.url,
                        reinText: d.rohText || d.text
                    }));
                } else {
                    masterTrainingDataset = parsedJson;
                }

                // Gesamte Wörter im importierten Datensatz berechnen, falls noch nicht vorhanden
                let totalWords = 0;
                let totalChars = 0;
                masterTrainingDataset.erfassteWebseiten.forEach(site => {
                    totalWords += countWords(site.reinText);
                    totalChars += (site.reinText ? site.reinText.length : 0);
                });

                masterTrainingDataset.metriken.seitenAnzahl = masterTrainingDataset.erfassteWebseiten.length;
                masterTrainingDataset.metriken.zeichenAnzahl = totalChars;
                masterTrainingDataset.metriken.woerterAnzahl = totalWords;

                updateUI();
                document.getElementById('uploadText').innerText = `✅ Geladen: ${file.name}`;
                log.innerHTML += `<br>> [UPLOAD] "${file.name}" eingelesen! ${masterTrainingDataset.metriken.woerterAnzahl.toLocaleString()} Wörter gelernt. Klicke auf START zum Erweitern.`;
            } else {
                alert("Format nicht kompatibel.");
            }
        } catch (err) {
            alert("Fehler beim Lesen der JSON.");
        }
        log.scrollTop = log.scrollHeight;
    };
    reader.readAsText(file);
});

// JSON DOWNLOAD AUSFÜHREN
downloadBtn.addEventListener('click', () => {
    if (masterTrainingDataset.erfassteWebseiten.length === 0) return;
    if (isAutopilotRunning) stopAutopilot();

    log.innerHTML += `<br>> Verpacke die bessere JSON...`;
    log.scrollTop = log.scrollHeight;

    const jsonString = JSON.stringify(masterTrainingDataset, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `erweitert_ki_dataset_${Date.now()}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
    
    log.innerHTML += `<br>> ✓ Download gestartet!`;
    log.scrollTop = log.scrollHeight;
});
