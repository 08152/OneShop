let masterTrainingDataset = {
    crawlerVersion: "8.0-UniversalJSONImporter",
    generiertAm: new Date().toISOString(),
    metriken: { seitenAnzahl: 0, elementeAnzahl: 0, zeichenAnzahl: 0, woerterAnzahl: 0 },
    erfassteWebseiten: []
};

const log = document.getElementById('statusLog');
const downloadBtn = document.getElementById('downloadBtn');
const btnAutopilot = document.getElementById('btnAutopilot');
const urlListField = document.getElementById('urlList');

let autopilotTimer = null;
let isAutopilotRunning = false;
let urlQueue = [];
const SCRAPE_INTERVAL = 3000; // 3 Sekunden Pause zwischen den Wikipedia-Seiten

function countWords(text) {
    if (!text) return 0;
    const cleanText = text.toString().trim().replace(/\s+/g, ' ');
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
    const rawInput = urlListField.value.trim();
    if (rawInput === "" && urlQueue.length === 0) {
        alert("Bitte gib zuerst mindestens eine Wikipedia-URL im Textfeld ein!");
        return;
    }

    if (urlQueue.length === 0) {
        urlQueue = rawInput.split('\n').map(url => url.trim()).filter(url => url.startsWith('http'));
        if (urlQueue.length === 0) {
            alert("Keine gültigen URLs gefunden! Die Links müssen mit http:// oder https:// beginnen.");
            return;
        }
    }

    isAutopilotRunning = true;
    btnAutopilot.innerText = "🛑 ABARBEITUNG STOPPEN";
    btnAutopilot.style.backgroundColor = "#dc2626";
    
    log.innerHTML += `<br>> 🤖 Abarbeitung gestartet! ${urlQueue.length} Links in Warteschlange...`;
    log.scrollTop = log.scrollHeight;
    
    triggerManualQueueScrape();
    autopilotTimer = setInterval(triggerManualQueueScrape, SCRAPE_INTERVAL);
}

function stopAutopilot() {
    isAutopilotRunning = false;
    clearInterval(autopilotTimer);
    btnAutopilot.innerText = "▶️ LINKS ABARBEITEN FORTSETZEN";
    btnAutopilot.style.backgroundColor = "#2563eb";
    log.innerHTML += `<br>> ⏸️ Pause. Datensatz gesichert.`;
    log.scrollTop = log.scrollHeight;
}

async function triggerManualQueueScrape() {
    if (urlQueue.length === 0) {
        stopAutopilot();
        btnAutopilot.innerText = "▶️ ABARBEITUNG STARTEN";
        log.innerHTML += `<br>> 🎉 FERTIG! Alle eingegebenen Links wurden erfolgreich durchsucht.`;
        log.scrollTop = log.scrollHeight;
        urlListField.value = "";
        return;
    }

    const nextUrl = urlQueue.shift();
    urlListField.value = urlQueue.join('\n');

    try {
        log.innerHTML += `<br>> [Crawler] Lese Seite: "${nextUrl}"...`;
        log.scrollTop = log.scrollHeight;

        const response = await fetch('/api/search-and-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl: nextUrl })
        });
        const data = await response.json();
        
        if (data.success) {
            const textContent = data.fullTextPlain || data.text || "";
            const newWords = countWords(textContent);

            masterTrainingDataset.erfassteWebseiten.push({
                titel: data.title,
                url: data.url,
                reinText: textContent,
                strukturierterInhalt: data.contentTree || []
            });

            masterTrainingDataset.metriken.seitenAnzahl += 1;
            masterTrainingDataset.metriken.zeichenAnzahl += (data.totalCharacters || textContent.length);
            masterTrainingDataset.metriken.woerterAnzahl += newWords;

            updateUI();
            log.innerHTML += `<br>> [NEU GELERNT] "${data.title}" (+${newWords.toLocaleString()} Wörter).`;
        } else {
            log.innerHTML += `<br>> ⚠️ Fehler bei dieser URL übersprungen: ${data.error}`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ Verbindungsfehler zum Server bei dieser URL.`;
    }
    log.scrollTop = log.scrollHeight;
}

// FIX FÜR DEN DATEI-UPLOAD (AKZEPTIERT JEDE STRUKTUR)
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (isAutopilotRunning) stopAutopilot();

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            
            // Finde heraus, wo die Seiten-Liste in der hochgeladenen Datei versteckt ist
            let rawPages = parsedJson.erfassteWebseiten || parsedJson.datenSaetze || [];
            
            if (!Array.isArray(rawPages) && typeof parsedJson === 'object') {
                // Falls die Datei direkt ein Array oder ein anderes Objekt ist, versuchen wir es zu retten
                rawPages = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
            }

            // Mappe alle importierten Daten in unser aktuelles, sauberes Format
            masterTrainingDataset.erfassteWebseiten = rawPages.map(d => {
                return {
                    titel: d.titel || d.seite || d.suchbegriff || "Geladene Alt-Seite",
                    url: d.url || (d.quellen && d.quellen.url) || "https://wikipedia.org",
                    reinText: d.reinText || d.rohText || d.text || JSON.stringify(d),
                    strukturierterInhalt: d.strukturierterInhalt || d.contentTree || []
                };
            });

            // Berechne die gelernten Wörter und Zeichen komplett neu
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
            log.innerHTML += `<br>> [UPLOAD] "${file.name}" erfolgreich repariert und importiert!`;
            log.innerHTML += `<br>> ZUSTAND: ${masterTrainingDataset.metriken.seitenAnzahl} Seiten mit ${masterTrainingDataset.metriken.woerterAnzahl.toLocaleString()} Wörtern geladen.`;
        } catch (err) {
            alert("Kritischer Fehler: Die hochgeladene Datei ist beschädigt oder keine echte JSON.");
            log.innerHTML += `<br>> ❌ [UPLOAD] Fehler beim Einlesen.`;
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
    downloadAnchor.setAttribute("download", `erweitert_ki_dataset_${Date.now()}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(blobUrl);
    
    log.innerHTML += `<br>> ✓ Download abgeschlossen!`;
    log.scrollTop = log.scrollHeight;
});
