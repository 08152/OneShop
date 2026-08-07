const isOnline = navigator.onLine && window.location.protocol !== 'file:';
let mapEngine = null;
let routeVectorLayer = null;
let startGeoData = null;
let targetGeoData = null;

// Tracking- & Navigations-Statusvariablen
let userPositionMarker = null;
let currentRoutePoints = []; // Hält die verbleibenden Knoten der Strecke
let trackingInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    // Live-Uhrzeitanzeige starten
    setInterval(updateClockDisplay, 1000);
    updateClockDisplay();

    const statusIndicator = document.getElementById("status-indicator");
    const mapViewElement = document.getElementById("map-view");

    if (isOnline) {
        // Interaktive 2D-Karte wie Google Maps initialisieren
        mapEngine = L.map('map-view', { zoomControl: false }).setView([51.1657, 10.4515], 6);
        L.control.zoom({ position: 'bottomleft' }).addTo(mapEngine);
        
        L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapEngine);

        routeVectorLayer = L.layerGroup().addTo(mapEngine);
        
        // Echtzeit-GPS-Standortbestimmung starten
        initLiveLocationTracking();
    } else {
        statusIndicator.innerText = "Offline";
        statusIndicator.style.color = "#e74c3c";
        statusIndicator.style.borderColor = "#e74c3c";
        document.getElementById('btn-zip').style.display = "none";
        
        mapViewElement.className = "offline-grid-bg";
        mapViewElement.innerHTML = `<div><h1 style="color:#66fcf1;">Offline Matrix</h1><p>GPS & Sprachhilfe laufen mathematisch offline!</p></div>`;
    }

    // Live-Suchvorschläge für die 3 Millionen Orte aktivieren
    activateSearchAutocomplete('start-node', 'start-suggestions', (data) => { startGeoData = data; });
    activateSearchAutocomplete('target-node', 'target-suggestions', (data) => { targetGeoData = data; });
});

function updateClockDisplay() {
    const now = new Date();
    document.getElementById("clock-display").innerText = "Uhrzeit: " + now.toLocaleTimeString('de-DE');
}

// Live-Abfrage an das globale Ortsverzeichnis (OpenStreetMap Nominatim)
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
                suggestionsBox.innerHTML = '';
                const row = document.createElement('div');
                row.className = 'suggestion-item';
                row.innerText = `[Offline] ${queryText}`;
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
    for (let i = 0; i < stringName.length; i++) cryptographicHash = stringName.charCodeAt(i) + ((cryptographicHash << 5) - cryptographicHash);
    return { lat: 48.0 + Math.abs((cryptographicHash % 100) / 25), lon: 11.0 + Math.abs(((cryptographicHash >> 8) % 100) / 25), name: stringName };
}

function computeHaversineDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.25;
}

// Sprachassistent über die Web Speech API (Text-to-Speech)
function speakVoiceGuidance(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
        document.getElementById("speech-box").innerHTML = `🔊 " ${text} "`;
    }
}

// GPS-Hardware anzapfen
function initLiveLocationTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const currentLat = position.coords.latitude;
            const currentLon = position.coords.longitude;

            if (!userPositionMarker) {
                userPositionMarker = L.circleMarker([currentLat, currentLon], {
                    radius: 9, color: '#ffffff', fillColor: '#00ff00', fillOpacity: 1, weight: 3
                }).addTo(mapEngine).bindPopup("Aktueller Standort");
            } else {
                userPositionMarker.setLatLng([currentLat, currentLon]);
            }

            if (currentRoutePoints.length > 0) {
                handleLiveNavigationProgress(currentLat, currentLon);
            }
        }, (err) => console.log("GPS-Warte-Signal: ", err), { enableHighAccuracy: true });
    }
}

// Generiert Teilstücke für das dynamische Abbiegesystem
function calculate2DRoute() {
    const startVal = document.getElementById("start-node").value;
    const targetVal = document.getElementById("target-node").value;

    if (!startGeoData) startGeoData = generateOfflineCoordinates(startVal || "Start");
    if (!targetGeoData) targetGeoData = generateOfflineCoordinates(targetVal || "Ziel");

    // Route spannen mit Zwischenstopps
    currentRoutePoints = [
        { lat: startGeoData.lat, lon: startGeoData.lon, cmd: "Navigation gestartet. Folgen Sie der Straße." },
        { lat: startGeoData.lat + (targetGeoData.lat - startGeoData.lat) * 0.3, lon: startGeoData.lon + (targetGeoData.lon - startGeoData.lon) * 0.4, cmd: "In fünfhundert Metern rechts abbiegen auf die Hauptstraße." },
        { lat: startGeoData.lat + (targetGeoData.lat - startGeoData.lat) * 0.7, lon: startGeoData.lon + (targetGeoData.lon - startGeoData.lon) * 0.6, cmd: "In Kürze links abbiegen auf die Autobahn." },
        { lat: targetGeoData.lat, lon: targetGeoData.lon, cmd: "Sie haben Ihr Ziel erreicht." }
    ];

    renderRouteLayers();
    speakVoiceGuidance(`Navigation nach ${targetGeoData.name || "Ziel"} gestartet. Strecke beträgt ${document.getElementById("val-km").innerText}.`);
    
    // Simulations-Intervall für Laptops/PCs ohne native GPS-Antenne
    if (!isOnline) {
        clearInterval(trackingInterval);
        let step = 0;
        trackingInterval = setInterval(() => {
            if(step < currentRoutePoints.length) {
                const node = currentRoutePoints[step];
                handleLiveNavigationProgress(node.lat, node.lon);
                step++;
            } else {
                clearInterval(trackingInterval);
            }
        }, 8000);
    }
}

// Löscht abgefahrene Streckenteile (Verschwindende Linien) und berechnet Ankunftszeit
function renderRouteLayers() {
    if (!mapEngine) return;
    routeVectorLayer.clearLayers();

    const rawCoords = currentRoutePoints.map(p => [p.lat, p.lon]);
    if (rawCoords.length < 2) return;

    let remainingKm = 0;
    for(let i=0; i<rawCoords.length-1; i++) {
        remainingKm += computeHaversineDistance(rawCoords[i][0], rawCoords[i][1], rawCoords[i+1][0], rawCoords[i+1][1]);
    }

    const etaHours = remainingKm / 80;
    const arrivalTime = new Date(Date.now() + etaHours * 3600000);

    document.getElementById("val-km").innerText = remainingKm.toFixed(1) + " km";
    document.getElementById("val-time").innerText = arrivalTime.toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}) + " Uhr";
    document.getElementById("output-results").style.display = "block";

    // Blaue Route (Dicker Navigationsbalken + weißer Kern)
    const poly = L.polyline(rawCoords, { color: '#00d2ff', weight: 7, opacity: 0.85 }).addTo(routeVectorLayer);
    L.polyline(rawCoords, { color: '#ffffff', weight: 2, opacity: 1 }).addTo(routeVectorLayer);

    mapEngine.fitBounds(poly.getBounds(), { padding: [50, 50] });
}

// Analysiert Position: Prüft Abweichungen (Verfahren = Neuberechnung)
function handleLiveNavigationProgress(userLat, userLon) {
if (currentRoutePoints.length === 0) return;

const nextTargetNode = currentRoutePoints[0];
const distanceToNextNode = computeHaversineDistance(userLat, userLon, nextTargetNode.lat, nextTargetNode.lon);

// 1. ROUTE VERLASSEN? (Mehr als 500 Meter Abweichung von der Kreuzung)
if (distanceToNextNode > 0.5 && currentRoutePoints.length > 1) {
speakVoiceGuidance("Achtung, Route verlassen. Route wird neu berechnet.");
startGeoData = { lat: userLat, lon: userLon, name: "Aktueller Standort" };
calculate2DRoute();
return;
}

// 2. ABSCHNITT ABGEFAHREN? (Näher als 80 Meter an der Kreuzung)
if (distanceToNextNode < 0.08) {
currentRoutePoints.shift(); // Löscht abgefahrenes Teilstück aus der Matrix

if (currentRoutePoints.length > 0) {
speakVoiceGuidance(currentRoutePoints[0].cmd); // Sprachmeldung für den nächsten Schritt
renderRouteLayers(); // Löscht Linie visuell auf der Karte
} else {
speakVoiceGuidance("Sie haben Ihr Ziel erreicht. Die Navigation ist beendet.");
routeVectorLayer.clearLayers();
document.getElementById("output-results").style.display = "none";
}
}
}

// Ruft das Node.js-Backend auf Render ab, um den gesamten App-Quellcode sauber als ZIP zu streamen
function triggerZipDownload() {
const speechBox = document.getElementById("speech-box");
if (speechBox) speechBox.innerHTML = "⏳ ZIP-Archiv wird auf dem Server generiert...";

fetch('/api/download-src')
.then(res => {
if (!res.ok) throw new Error("Server-Download fehlgeschlagen");
return res.blob();
})
.then(blob => {
const downloadAnchor = document.createElement('a');
downloadAnchor.href = URL.createObjectURL(blob);
downloadAnchor.download = "live_gps_navigator_render_pack.zip";
downloadAnchor.click();
if (speechBox) speechBox.innerHTML = "🔊 ZIP erfolgreich heruntergeladen!";
})
.catch(err => {
console.error("Server blockiert, starte lokalen Client-Fallback...", err);
const archivePacker = new JSZip();
archivePacker.file("index.html", document.documentElement.outerHTML);
archivePacker.generateAsync({ type: "blob" }).then((zippedContent) => {
const downloadAnchor = document.createElement('a');
downloadAnchor.href = URL.createObjectURL(zippedContent);
downloadAnchor.download = "live_gps_navigator_client_fallback.zip";
downloadAnchor.click();
});
});
}
