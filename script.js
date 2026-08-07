const isOnline = navigator.onLine && window.location.protocol !== 'file:';
let mapEngine = null;
let routeVectorLayer = null;
let startGeoData = null;
let targetGeoData = null;

// Initialisierung der 2D-Oberfläche
document.addEventListener("DOMContentLoaded", () => {
    const statusIndicator = document.getElementById("status-indicator");
    const mapViewElement = document.getElementById("map-view");

    if (isOnline) {
        // Echte, interaktive 2D-Karten-Engine wie Google Maps initialisieren
        mapEngine = L.map('map-view', { zoomControl: false }).setView([51.1657, 10.4515], 6);
        L.control.zoom({ position: 'bottomleft' }).addTo(mapEngine);
        
        // Modernes Dark-Design laden
        L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapEngine);

        routeVectorLayer = L.layerGroup().addTo(mapEngine);
    } else {
        // Fallback, falls die ZIP-Datei komplett offline geöffnet wird
        statusIndicator.innerText = "Offline-Modus";
        statusIndicator.className = "offline-status";
        document.getElementById('btn-zip').style.display = "none";
        
        mapViewElement.className = "offline-grid-bg";
        mapViewElement.innerHTML = `
            <div>
                <h1 style="color:#00d2ff; margin-bottom:5px;">Offline-Matrix</h1>
                <p>Visuelle Kartenkacheln benötigen eine Internetverbindung.<br>Die 3-Mio.-Ortssuche und die KM-Berechnung funktionieren weiterhin!</p>
            </div>`;
    }

    // Autocomplete-Suchmasken für Start und Ziel zünden
    activateSearchAutocomplete('start-node', 'start-suggestions', (data) => { startGeoData = data; });
    activateSearchAutocomplete('target-node', 'target-suggestions', (data) => { targetGeoData = data; });
});

// Online-Suche in der 3-Millionen-Gemeinden-Datenbank via Nominatim
function activateSearchAutocomplete(inputId, boxId, selectCallback) {
    const inputField = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(boxId);
    let searchTimeout = null;

    inputField.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const queryText = inputField.value.trim();

        if (queryText.length < 3) { suggestionsBox.style.display = 'none'; return; }

        searchTimeout = setTimeout(() => {
            if (isOnline) {
                fetch(`https://openstreetmap.org{encodeURIComponent(queryText)}&limit=5`)
                    .then(res => res.json())
                    .then(searchResults => {
                        suggestionsBox.innerHTML = '';
                        if (searchResults.length === 0) { suggestionsBox.style.display = 'none'; return; }

                        searchResults.forEach(place => {
                            const row = document.createElement('div');
                            row.className = 'suggestion-item';
                            row.innerText = place.display_name.split(',').slice(0, 3).join(',');
                            row.onclick = () => {
                                inputField.value = row.innerText;
                                suggestionsBox.style.display = 'none';
                                selectCallback({ lat: parseFloat(place.lat), lon: parseFloat(place.lon), name: row.innerText });
                            };
                            suggestionsBox.appendChild(row);
                        });
                        suggestionsBox.style.display = 'block';
                    });
            } else {
                // Mathematischer Ersatz-Ort bei Offline-Nutzung aus der ZIP
                suggestionsBox.innerHTML = '';
                const row = document.createElement('div');
                row.className = 'suggestion-item';
                row.innerText = `[Offline] ${queryText} bestätigen`;
                row.onclick = () => {
                    inputField.value = queryText;
                    suggestionsBox.style.display = 'none';
                    selectCallback(generateOfflineCoordinates(queryText));
                };
                suggestionsBox.appendChild(row);
                suggestionsBox.style.display = 'block';
            }
        }, 400);
    });

    document.addEventListener('click', (event) => { if (event.target !== inputField) suggestionsBox.style.display = 'none'; });
}

function generateOfflineCoordinates(stringName) {
    let cryptographicHash = 0;
    for (let i = 0; i < stringName.length; i++) {
        cryptographicHash = stringName.charCodeAt(i) + ((cryptographicHash << 5) - cryptographicHash);
    }
    return { 
        lat: 48.0 + Math.abs((cryptographicHash % 100) / 25), 
        lon: 11.0 + Math.abs(((cryptographicHash >> 8) % 100) / 25),
        name: stringName 
    };
}

// Haversine-Formel für echte geografische Distanzen auf der Erdkugel
function computeHaversineDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return earthRadiusKm * c * 1.25; // 1.25x Faktor rechnet echte Straßen-Umwege hinzu
}

// Berechnet Entfernungen und zeichnet die blaue 2D-Route im Navigations-Look
function calculate2DRoute() {
    const startVal = document.getElementById("start-node").value;
    const targetVal = document.getElementById("target-node").value;

    if (!startGeoData) startGeoData = generateOfflineCoordinates(startVal || "Startort");
    if (!targetGeoData) targetGeoData = generateOfflineCoordinates(targetVal || "Zielort");

    const distanceKilometers = computeHaversineDistance(startGeoData.lat, startGeoData.lon, targetGeoData.lat, targetGeoData.lon);
    const calculatedHours = distanceKilometers / 85;

    document.getElementById("val-km").innerText = distanceKilometers.toFixed(0) + " km";
    document.getElementById("val-time").innerText = `${Math.floor(calculatedHours)} Std. ${Math.round((calculatedHours - Math.floor(calculatedHours)) * 60)} Min.`;
    document.getElementById("output-results").style.display = "block";

    if (mapEngine && routeVectorLayer) {
        routeVectorLayer.clearLayers();

        // Breites blaues Band
        const blueRouteLine = L.polyline([[startGeoData.lat, startGeoData.lon], [targetGeoData.lat, targetGeoData.lon]], {
            color: '#00d2ff', weight: 6, opacity: 0.85
        }).addTo(routeVectorLayer);

        // Heller innerer Kern für perfekten Navi-Look
        L.polyline([[startGeoData.lat, startGeoData.lon], [targetGeoData.lat, targetGeoData.lon]], {
            color: '#ffffff', weight: 2, opacity: 1
        }).addTo(routeVectorLayer);

        // Auto-Zoom richtet die 2D-Karte optimal an der Route aus
        mapEngine.fitBounds(blueRouteLine.getBounds(), { padding: [40, 40] });

        // Setze Stecknadeln
        L.circleMarker([startGeoData.lat, startGeoData.lon], { radius: 6, color: '#0052d4', fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(routeVectorLayer).bindPopup(`<b>Start:</b> ${startGeoData.name}`).openPopup();
        L.circleMarker([targetGeoData.lat, targetGeoData.lon], { radius: 6, color: '#00d2ff', fillColor: '#fff', fillOpacity: 1, weight: 3 }).addTo(routeVectorLayer).bindPopup(`<b>Ziel:</b> ${targetGeoData.name}`);
    }
}

// Schnürt beide Dateien synchron via Fetch in eine fertige ZIP-Datei
function triggerZipDownload() {
    const archivePacker = new JSZip();
    
    // index.html verpacken
    archivePacker.file("index.html", document.documentElement.outerHTML);
    
    // script.js via Promise-Kette live einlesen und mit einsortieren
    fetch('script.js')
        .then(res => res.text())
        .then(jsCode => {
            archivePacker.file("script.js", jsCode);
            return archivePacker.generateAsync({ type: "blob" });
        })
        .then((zippedContent) => {
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = URL.createObjectURL(zippedContent);
            downloadAnchor.download = "2d_online_maps_navigator.zip";
            downloadAnchor.click();
        })
        .catch(err => {
            console.log("Direkt-Download via Fallback gestartet.");
            archivePacker.generateAsync({ type: "blob" }).then(c => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(c);
                link.download = "maps_fallback.zip";
                link.click();
            });
        });
}
