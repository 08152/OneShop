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
const SCRAPE_INTERVAL = 3000;

function countWords(text) {
    if (!text) return 0;
    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (cleanText === "") return 0;
    return cleanText.split(' ').length;
}

function updateUI() {
    document.getElementById('statPages').innerText = masterTrainingDataset.metriken.seitenAnzahl;
    document.getElementById('statChars').innerText = masterTrainingDataset.metriken.zeichenAnzahl.toLocaleString();
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
                reinText: data.fullTextPlain
            });

            const newWords = countWords(data.fullTextPlain);
            masterTrainingDataset.metriken.seitenAnzahl += 1;
            masterTrainingDataset.metriken.zeichenAnzahl += data.totalCharacters;
            masterTrainingDataset.metriken.woerterAnzahl += newWords;

            updateUI();
            log.innerHTML += `<br>> [NEU] Gelernt: "${data.title}" (+${newWords} Wörter).`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ Verbindungsfehler.`;
    }
    log.scrollTop = log.scrollHeight;
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            if (parsedJson.metriken || parsedJson.erfassteWebseiten) {
                masterTrainingDataset = parsedJson;
                
                let totalWords = 0; let totalChars = 0;
                masterTrainingDataset.erfassteWebseiten.forEach(site => {
                    totalWords += countWords(site.reinText);
                    totalChars += (site.reinText ? site.reinText.length : 0);
                });
                masterTrainingDataset.metriken.seitenAnzahl = masterTrainingDataset.erfassteWebseiten.length;
                masterTrainingDataset.metriken.zeichenAnzahl = totalChars;
                masterTrainingDataset.metriken.woerterAnzahl = totalWords;

                updateUI();
                log.innerHTML += `<br>> [UPLOAD] ${masterTrainingDataset.metriken.woerterAnzahl.toLocaleString()} Wörter importiert!`;
            }
        } catch (err) { alert("Fehler beim Lesen."); }
    };
    reader.readAsText(file);
});

downloadBtn.addEventListener('click', () => {
    const jsonString = JSON.stringify(masterTrainingDataset, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `bessere_trainingsdaten.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
