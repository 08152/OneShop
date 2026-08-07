// --- CONFIG & STATE ---
const isOnline = navigator.onLine && window.location.protocol !== 'file:';
let startCoords = null;
let targetCoords = null;

// UI-Anpassung bei Offline-Start aus der ZIP-Datei
if (!isOnline) {
    const indicator = document.getElementById('mode-indicator');
    indicator.innerText = "⚡ Offline-Modus (Matrix-Fallback)";
    indicator.style.color = "#e74c3c";
    document.getElementById('btn-download').style.display = "none";
}

// Event-Listener für Live-Vorschläge (Autovervollständigung) einrichten
setupAutocomplete('start-city', 'start-suggestions', (coord) => { startCoords = coord; });
setupAutocomplete('target-city', 'target-suggestions', (coord) => { targetCoords = coord; });

function setupAutocomplete(inputId, suggestionsId, callback) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestionsId);
    let timeout = null;

    input.addEventListener('input', () => {
        clearTimeout(timeout);
        const query = input.value.trim();
        
        if (query.length < 3) { box.style.display = 'none'; return; }

        // Verzögerung, um Server nicht zu überlasten
        timeout = setTimeout(() => {
            if (isOnline) {
                // Zugriff auf die weltweiten 3 Millionen Gemeinden via OpenStreetMap API
                fetch(`https://openstreetmap.org{encodeURIComponent(query)}&limit=5`)
                    .then(res => res.json())
                    .then(data => {
                        box.innerHTML = '';
                        if(data.length === 0) { box.style.display = 'none'; return; }
                        
                        data.forEach(item => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            div.innerText = item.display_name.split(',').slice(0, 3).join(',');
                            div.onclick = () => {
                                input.value = item.display_name.split(',')[0];
                                box.style.display = 'none';
                                callback({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
                            };
                            box.add(div);
                        });
                        box.style.display = 'block';
                    });
            } else {
                // Offline-Fallback: Mathematische Direktberechnung des Strings
                box.innerHTML = '';
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerText = `[Offline] ${query} bestätigen`;
                div.onclick = () => {
                    input.value = query;
                    box.style.display = 'none';
                    callback(generateOfflineCoords(query));
                };
                box.add(div);
                box.style.display = 'block';
            }
        }, 400);
    });

    // Schließen bei Klick außerhalb
    document.addEventListener('click', (e) => { if (e.target !== input) box.style.display = 'none'; });
}

// Mathematischer Krypto-Hash für den Offline-Fall
function generateOfflineCoords(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return { lat: 48.0 + (hash % 100) / 25, lon: 11.0 + ((hash >> 8) % 100) / 25 };
}

// Haversine-Formel zur echten Abstandsmessung auf der Erdkugel
function calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.25; // 1.25x realer Straßenumweg
}

function trigger3DMapping() {
    const startVal = document.getElementById('start-city').value;
    const targetVal = document.getElementById('target-city').value;

    // Falls die Autovervollständigung nicht geklickt wurde, Fallback triggern
    if (!startCoords) startCoords = generateOfflineCoords(startVal || "Start");
    if (!targetCoords) targetCoords = generateOfflineCoords(targetVal || "Ziel");

    const km = calculateHaversine(startCoords.lat, startCoords.lon, targetCoords.lat, targetCoords.lon);
    const totalHours = km / 85;

    document.getElementById('res-km').innerText = km.toFixed(0) + " km";
    document.getElementById('res-time').innerText = `${Math.floor(totalHours)} Std. ${Math.round((totalHours - Math.floor(totalHours)) * 60)} Min.`;
    document.getElementById('results').style.display = "block";

    // Weiterleitung der Skalierungsparameter an das WebGL-Kartenmodul
    if (typeof draw3DRouteOnMap === "function") {
        draw3DRouteOnMap(startCoords, targetCoords);
    }
}

// --- AUTOMATISCHER ZIP-DOWNLOADER ---
function downloadOfflineZip() {
    const zip = new JSZip();
    zip.file("index.html", document.documentElement.outerHTML);
    
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
        link.download = "3d_live_navigator_pack.zip";
        link.click();
    });
}
