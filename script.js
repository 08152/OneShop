// --- SYSTEMSTATUS PRÜFEN ---
const isOnline = navigator.onLine && window.location.protocol !== 'file:';
const statusEl = document.getElementById('status');
const downloadBtn = document.getElementById('btn-download');

if (!isOnline) {
    statusEl.innerText = "3D Offline (Lokal)";
    statusEl.className = "offline";
    downloadBtn.style.display = "none";
}

// --- MATHEMATISCHE BERECHNUNGEN (Offline-Navi) ---
function getDistanceOffline(lat1, lon1, lat2, lon2) {
    const R = 6371; // Erdradius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1.28; // Aufschlagfaktor für reale Straßenkrümmungen
}

function trigger3DMapping() {
    const startData = document.getElementById('start-city').value.split(',');
    const targetData = document.getElementById('target-city').value.split(',');
    
    const lat1 = parseFloat(startData[0]); const lon1 = parseFloat(startData[1]);
    const lat2 = parseFloat(targetData[0]); const lon2 = parseFloat(targetData[1]);

    // Kilometer und Zeit für das UI kalkulieren
    const km = getDistanceOffline(lat1, lon1, lat2, lon2);
    const totalHours = km / 85;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    document.getElementById('res-km').innerText = km.toFixed(0) + " km";
    document.getElementById('res-time').innerText = `${hours} Std. ${minutes} Min.`;
    document.getElementById('results').style.display = "block";

    // Befehl an das 3D-Karten-Skript (map.js) senden, um die Route plastisch zu zeichnen
    if (typeof draw3DRouteOnMap === "function") {
        draw3DRouteOnMap(km);
    }
}

// --- DER STRUKTURIERTE DOWNLOAD-MANAGER (ZIP-Packer) ---
function downloadOfflineZip() {
    const zip = new JSZip();
    
    // index.html direkt verpacken
    zip.file("index.html", document.documentElement.outerHTML);
    
    // Beide JS-Dateien vom Server laden und ins ZIP-Archiv einsortieren
    Promise.all([
        fetch('script.js').then(res => res.text()),
        fetch('map.js').then(res => res.text())
    ]).then(([scriptJs, mapJs]) => {
        zip.file("script.js", scriptJs);
        zip.file("map.js", mapJs);
        return zip.generateAsync({type:"blob"});
    }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "3d_cyber_map_system.zip";
        link.click();
    }).catch(err => {
        console.log("Online-Schnittstelle blockiert (Lokaler Testlauf?). Fallback-ZIP gestartet.");
        zip.generateAsync({type:"blob"}).then(c => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(c);
            link.download = "map_system_fallback.zip";
            link.click();
        });
    });
}
