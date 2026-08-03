// Das Hauptobjekt, das das Dataset hält
let masterTrainingDataset = {
    crawlerVersion: "2.0-FullScrape",
    generiertAm: new Date().toISOString(),
    metriken: { seitenAnzahl: 0, elementeAnzahl: 0, zeichenAnzahl: 0 },
    erfassteWebseiten: []
};

const log = document.getElementById('statusLog');
const downloadBtn = document.getElementById('downloadBtn');

// Funktion, um das UI nach Änderungen neu zu zeichnen
function updateUI() {
    document.getElementById('statPages').innerText = masterTrainingDataset.metriken.seitenAnzahl;
    document.getElementById('statElements').innerText = masterTrainingDataset.metriken.elementeAnzahl.toLocaleString();
    document.getElementById('statChars').innerText = masterTrainingDataset.metriken.zeichenAnzahl.toLocaleString();
    
    let sourcesDiv = document.getElementById('sourcesUsed');
    if(masterTrainingDataset.erfassteWebseiten.length > 0) {
        sourcesDiv.innerHTML = "<ol>";
        masterTrainingDataset.erfassteWebseiten.forEach(site => {
            sourcesDiv.innerHTML += `<li><a href="${site.url}" target="_blank" style="color: #38bdf8; font-weight: bold;">${site.titel}</a> (${site.reinText.length.toLocaleString()} Zeichen)</li>`;
        });
        sourcesDiv.innerHTML += "</ol>";
        downloadBtn.style.display = "block";
    } else {
        sourcesDiv.innerHTML = "Noch keine Daten im Speicher.";
        downloadBtn.style.display = "none";
    }
}

// LOGIK FÜR DEN DATEI-UPLOAD
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsedJson = JSON.parse(evt.target.result);
            
            // Überprüfung der Struktur-Kompatibilität
            if (parsedJson.metriken && Array.isArray(parsedJson.erfassteWebseiten)) {
                masterTrainingDataset = parsedJson;
                updateUI();
                
                document.getElementById('uploadText').innerText = `✅ Geladen: ${file.name}`;
                log.innerHTML += `<br>> [UPLOAD] Dataset erfolgreich importiert! ${masterTrainingDataset.metriken.seitenAnzahl} Seiten geladen.`;
            } else {
                alert("Ungültiges JSON-Format. Bitte lade eine kompatible Dataset-Datei hoch.");
                log.innerHTML += `<br>> ❌ [UPLOAD] Fehler: Falsches JSON-Format.`;
            }
        } catch (err) {
            alert("Datei konnte nicht gelesen werden. Keine gültige JSON.");
            log.innerHTML += `<br>> ❌ [UPLOAD] Fehler beim Parsen der Datei.`;
        }
        log.scrollTop = log.scrollHeight;
    };
    reader.readAsText(file);
});

// SCRAPER AUSFÜHREN
document.getElementById('crawlerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUrl = document.getElementById('targetUrl').value;
    
    log.innerHTML += `<br>> Verbinde mit Zielseite: "${targetUrl}"...`;
    log.scrollTop = log.scrollHeight;

    try {
        const response = await fetch('/api/search-and-scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl })
        });
        const data = await response.json();
        
        if(data.success) {
            // Neue Daten anhängen
            masterTrainingDataset.erfassteWebseiten.push({
                titel: data.title,
                url: data.url,
                erfassungsZeit: data.scrapedAt,
                strukturierterInhalt: data.contentTree,
                reinText: data.fullTextPlain
            });

            // Metriken erhöhen
            masterTrainingDataset.metriken.seitenAnzahl += 1;
            masterTrainingDataset.metriken.elementeAnzahl += data.elementsCount;
            masterTrainingDataset.metriken.zeichenAnzahl += data.totalCharacters;

            updateUI();
            log.innerHTML += `<br>> ✓ VOLLTEXT ERFOLGREICH GEHOLT! "${data.title}" wurde angehängt.`;
        } else {
            log.innerHTML += `<br>> ❌ Fehler: ${data.error}`;
        }
    } catch (err) {
        log.innerHTML += `<br>> ❌ Server-Verbindungsfehler.`;
    }
    log.scrollTop = log.scrollHeight;
});

// DOWNLOAD AUSFÜHREN
downloadBtn.addEventListener('click', () => {
    if (masterTrainingDataset.erfassteWebseiten.length === 0) return;
    
    const jsonString = JSON.stringify(masterTrainingDataset, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", `ai_dataset_fortgesetzt_${Date.now()}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
    
    log.innerHTML += `<br>> ✓ Aktualisiertes Dataset auf deinem PC gesichert!`;
    log.scrollTop = log.scrollHeight;
});
