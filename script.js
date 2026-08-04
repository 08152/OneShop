let masterTrainingDataset = {
    crawlerVersion: "9.5-Final-Fix",
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
const SCRAPE_INTERVAL = 3000; // Erhöht auf 3 Sek., um Blockaden durch die API zu verhindern

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

btnAutopilot.addEventListener('click', () => {
    if (isAutopilotRunning) { stopAutopilot(); } else { startAutopilot(); }
});

function startAutopilot() {
    const rawInput = urlListField.value.trim();
    if (rawInput === "" && urlQueue.length === 0) {
        alert("Bitte gib zuerst Wikipedia-URLs ein!");
        return;
    }

    if (urlQueue.length === 0) {
        // ZWINGEND HTTPS ERZWINGEN (Verhindert Protokollfehler 426 im Browser)
        urlQueue = rawInput.split('\n')
            .map(url => url.trim())
            .filter(url => url.startsWith('https://'));
            
        if (urlQueue.length === 0) {
            alert("Keine gültigen HTTPS-URLs gefunden! Wikipedia erlaubt keine unverschlüsselten Verbindungen.");
            return;
        }
    }

    isAutopilotRunning = true;
    btnAutopilot.innerText = "🛑 ABARBEITUNG STOPPEN";
    btnAutopilot.style.backgroundColor = "#dc2626";
    
    log.innerHTML += `<br>> 🤖 Automatische Abarbeitung gestartet...`;
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

        // Anfrage an deine lokale API-Schnittstelle
        const response = await fetch('/api/search-and-scrape', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Upgrade-Insecure-Requests': '1' // Signalisiert dem Browser, die Verbindung sauber zu halten
            },
            body: JSON.stringify({ targetUrl: nextUrl })
        });
        
        // Fängt den Protokoll-Fehler 426 ab, falls die API-Gegenstelle falsch konfiguriert ist
        if (response.status === 426) {
            log.innerHTML += `<br>> ❌ Fehler 426: Das System verlangt ein Protokoll-Upgrade (HTTPS/TLS).`;
            stopAutopilot();
            return;
        }

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
            log.innerHTML += `<br>> ❌ Fehler übersprungen: ${data.error}`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ Verbindungsfehler zum Server (CORS/Netzwerkblockade).`;
    }
    log.scrollTop = log.scrollHeight;
}

// FIX: 'e.target.files' korrigiert, um das erste File-Objekt [0] korrekt auszulesen
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (isAutopilotRunning) stopAutopilot();

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            let importedPages = parsedJson.erfassteWebseiten || parsedJson.datenSaetze || [];
            
            masterTrainingDataset.erfassteWebseiten = importedPages
                .map(d => ({
                    titel: d.titel || d.seite || d.suchbegriff || "Geladene Alt-Seite",
                    url: d.url || (d.quellen && d.quellen.url) || "https://wikipedia.org",
                    reinText: d.reinText || d.rohText || d.text || "",
                    strukturierterInhalt: d.strukturierterInhalt || d.contentTree || []
                }))
                .filter(site => site.url.startsWith('http') && !site.url.includes('{articletitle}'));

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
            log.innerHTML += `<br>> [UPLOAD] "${file.name}" eingelesen und bereinigt!`;
        } catch (err) { alert("Fehler beim JSON-Upload."); }
        log.scrollTop = log.scrollHeight;
    };
    reader.readAsText(file);
});

downloadBtn.addEventListener('click', () => {
    if (masterTrainingDataset.erfassteWebseiten.length === 0) return;
    if (isAutopilotRunning) stopAutopilot();
    const jsonString = JSON.stringify(masterTrainingDataset, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `bereinigt_ki_dataset_${Date.now()}.json`);
    downloadAnchor.click();
    downloadAnchor.remove();
});
